import { CancellationActor, EventStatus, NotificationType, OrderStatus, PaymentStatus } from '@prisma/client'
import { JwtPayload } from '../auth'
import { prisma } from '../prisma'
import { resolveAdminScope } from './operating-regions'
import { serializeOrder } from './orders'
import { createRefund } from './payments'

const transitions: Record<OrderStatus, OrderStatus[]> = {
  DRAFT: [OrderStatus.PENDING_PAYMENT, OrderStatus.CANCELLED],
  PENDING_PAYMENT: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  CONFIRMED: [OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED],
  IN_PROGRESS: [OrderStatus.READY_FOR_DELIVERY, OrderStatus.CANCELLED],
  READY_FOR_DELIVERY: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  DELIVERED: [],
  CANCELLED: [],
}

const notificationForStatus = (status: OrderStatus): { type: NotificationType; title: string; message: string } | undefined => {
  const map: Partial<Record<OrderStatus, { type: NotificationType; title: string; message: string }>> = {
    CONFIRMED: { type: NotificationType.ORDER_CONFIRMED, title: 'Order confirmed', message: 'Your catering order has been confirmed.' },
    IN_PROGRESS: { type: NotificationType.ORDER_IN_PROGRESS, title: 'Preparation started', message: 'Your catering order is now being prepared.' },
    READY_FOR_DELIVERY: { type: NotificationType.ORDER_READY, title: 'Order ready', message: 'Your order is ready for delivery.' },
    DELIVERED: { type: NotificationType.ORDER_DELIVERED, title: 'Order delivered', message: 'Your catering order has been delivered.' },
    CANCELLED: { type: NotificationType.ORDER_CANCELLED, title: 'Order cancelled', message: 'Your catering order has been cancelled.' },
  }
  return map[status]
}

export interface AdminOrdersQuery {
  regionId?: string
  orderStatus?: OrderStatus
  paymentStatus?: PaymentStatus
  mobileNumber?: string
  dateFrom?: string
  dateTo?: string
  city?: string
}

export async function listAdminOrders(admin: JwtPayload, query: AdminOrdersQuery) {
  const regionId = await resolveAdminScope(admin.sub, admin.role ?? '', query.regionId)
  const eventFilter: Record<string, unknown> = {}
  if (query.dateFrom || query.dateTo) {
    eventFilter.eventDate = {
      ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
      ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
    }
  }
  if (query.city) eventFilter.address = { city: { contains: query.city, mode: 'insensitive' } }

  const rows = await prisma.order.findMany({
    where: {
      ...(regionId ? { regionId } : {}),
      ...(query.orderStatus ? { orderStatus: query.orderStatus } : {}),
      ...(query.paymentStatus ? { paymentStatus: query.paymentStatus } : {}),
      ...(query.mobileNumber ? { user: { mobileNumber: { contains: query.mobileNumber } } } : {}),
      ...(Object.keys(eventFilter).length ? { event: eventFilter } : {}),
    },
    include: { user: true, event: { include: { address: true, region: true } }, region: true, selectedItems: true, payments: true },
    orderBy: { createdAt: 'desc' },
  })
  return rows.map(serializeOrder)
}

export async function getAdminOrder(admin: JwtPayload, id: string) {
  const regionId = await resolveAdminScope(admin.sub, admin.role ?? '')
  const row = await prisma.order.findUnique({
    where: { id },
    include: { user: true, event: { include: { address: true, region: true } }, region: true, selectedItems: true, payments: { include: { refunds: true } }, statusHistory: { include: { changedBy: true }, orderBy: { changedAt: 'asc' } } },
  })
  if (!row || (regionId && row.regionId !== regionId)) throw Object.assign(new Error('Order not found'), { status: 404 })
  return serializeOrder(row)
}

export async function updateOrderStatus(admin: JwtPayload, id: string, status: OrderStatus, notes?: string) {
  const regionId = await resolveAdminScope(admin.sub, admin.role ?? '')
  const order = await prisma.order.findUnique({ where: { id } })
  if (!order || (regionId && order.regionId !== regionId)) throw Object.assign(new Error('Order not found'), { status: 404 })
  if (!transitions[order.orderStatus].includes(status)) {
    throw Object.assign(new Error(`Cannot transition from ${order.orderStatus} to ${status}`), { status: 400 })
  }

  const row = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id },
      data: { orderStatus: status, statusHistory: { create: { fromStatus: order.orderStatus, toStatus: status, changedById: admin.sub, notes } } },
      include: { user: true, event: true, selectedItems: true, payments: true, statusHistory: true },
    })
    if (status === OrderStatus.DELIVERED) {
      await tx.event.update({ where: { id: order.eventId }, data: { status: EventStatus.COMPLETED } })
    }
    const notification = notificationForStatus(status)
    if (notification) await tx.notification.create({ data: { userId: order.userId, orderId: order.id, ...notification } })
    return updated
  })
  return serializeOrder(row)
}

export async function adminCancelOrder(admin: JwtPayload, id: string, reason?: string) {
  const regionId = await resolveAdminScope(admin.sub, admin.role ?? '')
  const order = await prisma.order.findUnique({ where: { id } })
  if (!order || (regionId && order.regionId !== regionId)) throw Object.assign(new Error('Order not found'), { status: 404 })
  if (order.orderStatus === OrderStatus.CANCELLED || order.orderStatus === OrderStatus.DELIVERED) {
    throw Object.assign(new Error('Order cannot be cancelled'), { status: 400 })
  }

  await prisma.$transaction([
    prisma.order.update({ where: { id }, data: { orderStatus: OrderStatus.CANCELLED, cancelledAt: new Date(), cancelledBy: CancellationActor.ADMIN, cancelledByAdminId: admin.sub, cancellationReason: reason, statusHistory: { create: { fromStatus: order.orderStatus, toStatus: OrderStatus.CANCELLED, changedById: admin.sub, notes: reason } } } }),
    prisma.event.update({ where: { id: order.eventId }, data: { status: EventStatus.CANCELLED } }),
    prisma.notification.create({ data: { userId: order.userId, orderId: order.id, type: NotificationType.ORDER_CANCELLED, title: 'Order cancelled', message: 'Your catering order has been cancelled by the operations team.' } }),
  ])
  return getAdminOrder(admin, id)
}

export async function listAdminPayments(admin: JwtPayload, requestedRegionId?: string) {
  const regionId = await resolveAdminScope(admin.sub, admin.role ?? '', requestedRegionId)
  const rows = await prisma.payment.findMany({
    where: regionId ? { order: { regionId } } : {},
    include: { order: { include: { user: true, region: true } }, refunds: true },
    orderBy: { createdAt: 'desc' },
  })
  return rows.map((row) => ({ ...row, amount: row.amount.toFixed(2), refunds: row.refunds.map((r) => ({ ...r, amount: r.amount.toFixed(2) })) }))
}

export async function adminRefund(admin: JwtPayload, paymentId: string, amount: string, reason?: string) {
  const regionId = await resolveAdminScope(admin.sub, admin.role ?? '')
  if (regionId) {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId }, include: { order: true } })
    if (!payment || payment.order.regionId !== regionId) throw Object.assign(new Error('Payment not found'), { status: 404 })
  }
  return createRefund(admin.sub, paymentId, amount, reason)
}
