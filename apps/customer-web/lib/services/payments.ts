import { NotificationType, OrderStatus, PaymentStatus, Prisma, RefundStatus } from '@prisma/client'
import crypto from 'node:crypto'
import Razorpay from 'razorpay'
import { prisma } from '../prisma'

type GatewayPayment = { id: string; order_id?: string | null; amount: number; status: string; method?: string; error_description?: string }

function keyId() { return process.env.RAZORPAY_KEY_ID ?? '' }
function keySecret() { return process.env.RAZORPAY_KEY_SECRET ?? '' }
function currency() { return process.env.RAZORPAY_CURRENCY ?? 'INR' }
function isConfigured() { return Boolean(keyId() && keySecret()) }
function client() { return new Razorpay({ key_id: keyId(), key_secret: keySecret() }) }

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && crypto.timingSafeEqual(left, right)
}

function serializeRefund<T extends { amount: Prisma.Decimal }>(r: T) {
  return { ...r, amount: r.amount.toFixed(2) }
}

function gatewayError(err: unknown) {
  if (!err || typeof err !== 'object') return 'Unknown gateway error'
  const e = err as { error?: { description?: string }; message?: string }
  return e.error?.description ?? e.message ?? 'Unknown gateway error'
}

async function notify(tx: Prisma.TransactionClient, input: { userId: string; orderId?: string; type: NotificationType; title: string; message: string }) {
  return tx.notification.create({ data: input })
}

async function reconcileRefund(paymentId: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId }, include: { refunds: true, order: true } })
  if (!payment) return
  const total = payment.refunds.filter((r) => r.refundStatus === RefundStatus.SUCCESS).reduce((s, r) => s.plus(r.amount), new Prisma.Decimal(0))
  const paymentStatus = total.gte(payment.amount) ? PaymentStatus.REFUNDED : total.gt(0) ? PaymentStatus.PARTIALLY_REFUNDED : PaymentStatus.PAID
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({ where: { id: paymentId }, data: { paymentStatus } })
    await tx.order.update({ where: { id: payment.orderId }, data: { paymentStatus } })
    await notify(tx, { userId: payment.order.userId, orderId: payment.orderId, type: NotificationType.REFUND_UPDATED, title: paymentStatus === PaymentStatus.REFUNDED ? 'Refund completed' : 'Refund updated', message: `Refunded amount: INR ${total.toFixed(2)}.` })
  })
}

async function markPaid(paymentId: string, razorpayPaymentId: string, signature: string | undefined, gatewayPayment: GatewayPayment) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId }, include: { order: true } })
  if (!payment || payment.paymentStatus === PaymentStatus.PAID) return
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({ where: { id: paymentId }, data: { paymentStatus: PaymentStatus.PAID, razorpayPaymentId, razorpaySignature: signature, paymentMethod: gatewayPayment.method, paidAt: new Date(), failureReason: null, gatewayResponse: gatewayPayment as unknown as Prisma.InputJsonValue } })
    await tx.order.update({ where: { id: payment.orderId }, data: { paymentStatus: PaymentStatus.PAID, orderStatus: OrderStatus.CONFIRMED, statusHistory: { create: { fromStatus: payment.order.orderStatus, toStatus: OrderStatus.CONFIRMED, notes: 'Payment verified' } } } })
    await notify(tx, { userId: payment.order.userId, orderId: payment.orderId, type: NotificationType.ORDER_CONFIRMED, title: 'Order confirmed', message: 'Payment received. Your catering order is confirmed.' })
  })
}

export async function createGatewayOrder(userId: string, orderId: string) {
  const order = await prisma.order.findFirst({ where: { id: orderId, userId }, include: { payments: { orderBy: { createdAt: 'desc' } } } })
  if (!order) throw Object.assign(new Error('Order not found'), { status: 404 })
  if (order.orderStatus !== OrderStatus.PENDING_PAYMENT) throw Object.assign(new Error('Order is not awaiting payment'), { status: 400 })

  const existing = order.payments.find((p) => p.paymentStatus === PaymentStatus.PENDING && p.razorpayOrderId)
  if (existing) {
    return { paymentId: existing.id, keyId: keyId() || 'local', id: existing.razorpayOrderId, amount: existing.amount.mul(100).toNumber(), currency: currency(), localMode: !isConfigured(), reused: true }
  }

  const gatewayOrder = isConfigured()
    ? await (async () => {
        try {
          const created = await client().orders.create({ amount: order.totalAmount.mul(100).toNumber(), currency: currency(), receipt: order.orderNumber.slice(0, 40), notes: { source: 'the-feast-factory' } })
          return { id: created.id, amount: Number(created.amount), currency: created.currency }
        } catch { throw Object.assign(new Error('Payment provider is temporarily unavailable'), { status: 502 }) }
      })()
    : { id: `local_order_${order.id}_${Date.now()}`, amount: order.totalAmount.mul(100).toNumber(), currency: currency() }

  const payment = await prisma.payment.create({ data: { orderId, amount: order.totalAmount, razorpayOrderId: gatewayOrder.id, gatewayResponse: { orderCreated: true, localMode: !isConfigured() } } })
  return { paymentId: payment.id, keyId: keyId() || 'local', ...gatewayOrder, localMode: !isConfigured(), reused: false }
}

export async function verifyPayment(userId: string, dto: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) {
  const payment = await prisma.payment.findFirst({ where: { razorpayOrderId: dto.razorpayOrderId, order: { userId } }, include: { order: true } })
  if (!payment) throw Object.assign(new Error('Payment not found'), { status: 404 })
  if (payment.paymentStatus === PaymentStatus.PAID) return { success: true, orderId: payment.orderId }

  const expected = isConfigured()
    ? crypto.createHmac('sha256', keySecret()).update(`${dto.razorpayOrderId}|${dto.razorpayPaymentId}`).digest('hex')
    : 'local_success'
  if (!safeEqual(dto.razorpaySignature, expected)) throw Object.assign(new Error('Invalid payment signature'), { status: 401 })

  let gatewayPayment: GatewayPayment = { id: dto.razorpayPaymentId, order_id: dto.razorpayOrderId, amount: payment.amount.mul(100).toNumber(), status: 'captured', method: 'local' }
  if (isConfigured()) {
    gatewayPayment = (await client().payments.fetch(dto.razorpayPaymentId)) as GatewayPayment
    if (gatewayPayment.order_id !== dto.razorpayOrderId || Number(gatewayPayment.amount) !== payment.amount.mul(100).toNumber() || gatewayPayment.status !== 'captured') {
      throw Object.assign(new Error('Payment details could not be reconciled'), { status: 400 })
    }
  }

  await markPaid(payment.id, dto.razorpayPaymentId, dto.razorpaySignature, gatewayPayment)
  return { success: true, orderId: payment.orderId }
}

export async function handleWebhook(rawBody: Buffer, payload: Record<string, unknown>, signature?: string, providerEventId?: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (secret) {
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
    if (!signature || !safeEqual(signature, expected)) throw Object.assign(new Error('Invalid webhook signature'), { status: 401 })
  } else if (process.env.NODE_ENV === 'production') {
    throw Object.assign(new Error('Razorpay webhook is not configured'), { status: 401 })
  }

  const eventType = String(payload.event ?? 'unknown')
  const eventId = providerEventId ?? crypto.createHash('sha256').update(rawBody).digest('hex')

  try {
    await prisma.paymentWebhookEvent.create({ data: { providerEventId: eventId, eventType, payload: payload as Prisma.InputJsonValue } })
  } catch (error) {
    if ((error as { code?: string }).code === 'P2002') return { received: true, duplicate: true }
    throw error
  }

  try {
    await processWebhook(eventType, payload)
    await prisma.paymentWebhookEvent.update({ where: { providerEventId: eventId }, data: { processedAt: new Date() } })
    return { received: true }
  } catch (error) {
    await prisma.paymentWebhookEvent.update({ where: { providerEventId: eventId }, data: { processingError: error instanceof Error ? error.message.slice(0, 1000) : 'Unknown error' } })
    throw error
  }
}

async function processWebhook(eventType: string, payload: Record<string, unknown>) {
  if (eventType === 'payment.captured') {
    const entity = (payload?.payload as Record<string, unknown>)?.payment as { entity?: GatewayPayment } | undefined
    if (!entity?.entity?.id || !entity.entity.order_id) return
    const payment = await prisma.payment.findFirst({ where: { razorpayOrderId: entity.entity.order_id } })
    if (payment) await markPaid(payment.id, entity.entity.id, undefined, entity.entity)
    return
  }

  if (eventType === 'payment.failed') {
    const entity = (payload?.payload as Record<string, unknown>)?.payment as { entity?: GatewayPayment } | undefined
    if (!entity?.entity?.order_id) return
    const payment = await prisma.payment.findFirst({ where: { razorpayOrderId: entity.entity.order_id }, include: { order: true } })
    if (!payment || payment.paymentStatus === PaymentStatus.PAID) return
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({ where: { id: payment.id }, data: { paymentStatus: PaymentStatus.FAILED, razorpayPaymentId: entity.entity!.id, paymentMethod: entity.entity!.method, failureReason: entity.entity!.error_description ?? 'Payment failed', gatewayResponse: entity.entity as unknown as Prisma.InputJsonValue } })
      await tx.order.update({ where: { id: payment.orderId }, data: { paymentStatus: PaymentStatus.FAILED } })
      await notify(tx, { userId: payment.order.userId, orderId: payment.orderId, type: NotificationType.PAYMENT_FAILED, title: 'Payment failed', message: 'Your payment was not completed. You can retry from your order.' })
    })
    return
  }

  if (eventType.startsWith('refund.')) {
    const entity = (payload?.payload as Record<string, unknown>)?.refund as { entity?: { id?: string; status?: string; payment_id?: string } } | undefined
    if (!entity?.entity?.id) return
    const refund = await prisma.refund.findFirst({ where: { razorpayRefundId: entity.entity.id } })
    if (!refund) return
    const status = eventType === 'refund.failed' || entity.entity.status === 'failed' ? RefundStatus.FAILED : eventType === 'refund.processed' || entity.entity.status === 'processed' ? RefundStatus.SUCCESS : RefundStatus.PROCESSING
    await prisma.refund.update({ where: { id: refund.id }, data: { refundStatus: status, processedAt: status !== RefundStatus.PROCESSING ? new Date() : undefined, gatewayResponse: entity.entity as unknown as Prisma.InputJsonValue } })
    if (status !== RefundStatus.PROCESSING) await reconcileRefund(refund.paymentId)
  }
}

export async function createRefund(adminId: string, paymentId: string, amountInput: string, reason?: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId }, include: { refunds: true, order: true } })
  if (!payment || (payment.paymentStatus !== PaymentStatus.PAID && payment.paymentStatus !== PaymentStatus.PARTIALLY_REFUNDED) || !payment.razorpayPaymentId) {
    throw Object.assign(new Error('Refundable payment not found'), { status: 400 })
  }

  const amount = new Prisma.Decimal(amountInput)
  const committed = payment.refunds.filter((r) => r.refundStatus !== RefundStatus.FAILED).reduce((s, r) => s.plus(r.amount), new Prisma.Decimal(0))
  if (amount.lte(0) || committed.plus(amount).gt(payment.amount)) throw Object.assign(new Error('Invalid refund amount'), { status: 400 })

  const refund = await prisma.refund.create({
    data: {
      paymentId,
      amount,
      reason: reason?.trim(),
      initiatedById: adminId,
      refundStatus: isConfigured() ? RefundStatus.PROCESSING : RefundStatus.SUCCESS,
      processedAt: isConfigured() ? undefined : new Date(),
      razorpayRefundId: isConfigured() ? undefined : `local_refund_${Date.now()}`,
      gatewayResponse: { localMode: !isConfigured() },
    },
  })

  if (!isConfigured()) { await reconcileRefund(paymentId); return serializeRefund(refund) }

  try {
    const gateway = await client().payments.refund(payment.razorpayPaymentId, { amount: amount.mul(100).toNumber(), speed: 'normal', notes: { reason: reason ?? 'Admin initiated refund', orderId: payment.orderId } })
    const updated = await prisma.refund.update({ where: { id: refund.id }, data: { razorpayRefundId: gateway.id, refundStatus: gateway.status === 'processed' ? RefundStatus.SUCCESS : RefundStatus.PROCESSING, processedAt: gateway.status === 'processed' ? new Date() : undefined, gatewayResponse: gateway as unknown as Prisma.InputJsonValue } })
    if (updated.refundStatus === RefundStatus.SUCCESS) await reconcileRefund(paymentId)
    return serializeRefund(updated)
  } catch (error) {
    await prisma.refund.update({ where: { id: refund.id }, data: { refundStatus: RefundStatus.FAILED, processedAt: new Date(), gatewayResponse: { error: gatewayError(error) } } })
    throw Object.assign(new Error('Razorpay refund could not be initiated'), { status: 502 })
  }
}
