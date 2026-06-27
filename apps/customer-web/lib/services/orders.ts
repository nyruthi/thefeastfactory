import { CancellationActor, EventStatus, NotificationType, OrderStatus, Prisma } from '@prisma/client'
import { prisma } from '../prisma'
import { assignRegion, serializeRegion } from './operating-regions'
import { quote as pricingQuote, SelectedItemInput, serialize as serializePricing } from './pricing'

export interface OrderSelectionInput {
  eventId: string
  selectedItems: SelectedItemInput[]
}

function orderNumber() {
  const date = new Date().toISOString().slice(2, 10).replaceAll('-', '')
  return `ORD-${date}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

export function serializeOrder(order: Record<string, unknown>) {
  const moneyFields = ['basePerPlatePrice', 'totalCustomizationCharges', 'finalPerPlatePrice', 'distanceKm', 'deliveryFee', 'totalAmount']
  const result: Record<string, unknown> = { ...order }
  for (const field of moneyFields) {
    if (result[field] instanceof Prisma.Decimal) result[field] = (result[field] as Prisma.Decimal).toFixed(2)
  }
  if (Array.isArray(result.selectedItems)) {
    result.selectedItems = (result.selectedItems as Record<string, unknown>[]).map((item) => ({
      ...item,
      itemPrice: (item.itemPrice as Prisma.Decimal).toFixed(2),
      includedValue: (item.includedValue as Prisma.Decimal).toFixed(2),
      adjustmentAmount: (item.adjustmentAmount as Prisma.Decimal).toFixed(2),
    }))
  }
  if (Array.isArray(result.payments)) {
    result.payments = (result.payments as Record<string, unknown>[]).map((payment) => ({
      ...payment,
      amount: (payment.amount as Prisma.Decimal).toFixed(2),
      refunds: Array.isArray(payment.refunds)
        ? (payment.refunds as Record<string, unknown>[]).map((r) => ({ ...r, amount: (r.amount as Prisma.Decimal).toFixed(2) }))
        : undefined,
    }))
  }
  if (result.region) result.region = serializeRegion(result.region as Parameters<typeof serializeRegion>[0])
  if (result.event && typeof result.event === 'object') {
    const event = result.event as Record<string, unknown>
    if (event.region) event.region = serializeRegion(event.region as Parameters<typeof serializeRegion>[0])
    if (event.distanceKm instanceof Prisma.Decimal) event.distanceKm = event.distanceKm.toFixed(2)
    if (event.deliveryFee instanceof Prisma.Decimal) event.deliveryFee = event.deliveryFee.toFixed(2)
  }
  return result
}

async function getEvent(userId: string, eventId: string) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, userId },
    include: { address: true, region: true, orders: true },
  })
  if (!event) throw Object.assign(new Error('Event not found'), { status: 404 })
  return event
}

async function quoteWithDelivery(event: Awaited<ReturnType<typeof getEvent>>, dto: OrderSelectionInput) {
  const menuQuote = await pricingQuote(event.packageVersionId, event.guestCount, dto.selectedItems)
  const assignment =
    event.region && event.distanceKm != null
      ? { region: event.region!, distanceKm: event.distanceKm, billableDistanceKm: Math.ceil(Number(event.distanceKm)), deliveryFee: event.deliveryFee }
      : await assignRegion(event.address.latitude, event.address.longitude)
  const subtotalAmount = menuQuote.totalAmount
  return { ...menuQuote, region: assignment.region, distanceKm: assignment.distanceKm, billableDistanceKm: assignment.billableDistanceKm, deliveryFeePerKm: assignment.region.deliveryFeePerKm, deliveryFee: assignment.deliveryFee, subtotalAmount, totalAmount: subtotalAmount.plus(assignment.deliveryFee) }
}

export async function orderQuote(userId: string, dto: OrderSelectionInput) {
  const event = await getEvent(userId, dto.eventId)
  const q = await quoteWithDelivery(event, dto)
  return {
    ...serializePricing(q),
    region: serializeRegion(q.region),
    distanceKm: q.distanceKm.toFixed(2),
    billableDistanceKm: q.billableDistanceKm,
    deliveryFeePerKm: q.deliveryFeePerKm.toFixed(2),
    deliveryFee: q.deliveryFee.toFixed(2),
    subtotalAmount: q.subtotalAmount.toFixed(2),
    totalAmount: q.totalAmount.toFixed(2),
  }
}

export async function createOrder(userId: string, dto: OrderSelectionInput) {
  const event = await getEvent(userId, dto.eventId)
  const existing = event.orders[0]
  if (existing?.orderStatus === OrderStatus.PENDING_PAYMENT) return getOrder(userId, existing.id)
  if (existing) throw Object.assign(new Error('An order already exists for this event'), { status: 400 })

  const q = await quoteWithDelivery(event, dto)
  const leadHours = Math.floor((event.eventDate.getTime() - Date.now()) / 3_600_000)

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        orderNumber: orderNumber(),
        userId,
        eventId: event.id,
        regionId: q.region.id,
        guestCount: q.guestCount,
        basePerPlatePrice: q.basePerPlatePrice,
        totalCustomizationCharges: q.totalCustomizationCharges,
        finalPerPlatePrice: q.finalPerPlatePrice,
        totalAmount: q.totalAmount,
        distanceKm: q.distanceKm,
        deliveryFee: q.deliveryFee,
        packageName: q.packageName,
        packageVersionNo: q.packageVersionNo,
        orderStatus: OrderStatus.PENDING_PAYMENT,
        bookingLeadHours: leadHours,
        selectedItems: {
          create: q.items.map((item) => ({
            categoryId: item.categoryId,
            menuItemId: item.menuItemId,
            menuItemName: item.menuItemName,
            categoryName: item.categoryName,
            isVeg: item.isVeg,
            itemPrice: item.itemPrice,
            includedValue: item.includedValue,
            adjustmentAmount: item.adjustmentAmount,
          })),
        },
        statusHistory: { create: { toStatus: OrderStatus.PENDING_PAYMENT, notes: 'Order created' } },
      },
      include: { selectedItems: true, statusHistory: true, region: true },
    })
    await tx.event.update({ where: { id: event.id }, data: { status: EventStatus.CONFIRMED, regionId: q.region.id, distanceKm: q.distanceKm, deliveryFee: q.deliveryFee } })
    return serializeOrder(order)
  })
}

export async function listOrders(userId: string) {
  const orders = await prisma.order.findMany({
    where: { userId },
    include: { event: { include: { region: true } }, region: true, selectedItems: true, payments: true },
    orderBy: { createdAt: 'desc' },
  })
  return orders.map(serializeOrder)
}

export async function getOrder(userId: string, id: string) {
  const order = await prisma.order.findFirst({
    where: { id, userId },
    include: { event: { include: { address: true, region: true } }, region: true, selectedItems: true, payments: { include: { refunds: true } }, statusHistory: { orderBy: { changedAt: 'asc' } } },
  })
  if (!order) throw Object.assign(new Error('Order not found'), { status: 404 })
  return serializeOrder(order)
}

export async function cancelOrder(userId: string, id: string, reason?: string) {
  const order = await prisma.order.findFirst({ where: { id, userId } })
  if (!order) throw Object.assign(new Error('Order not found'), { status: 404 })
  if (order.orderStatus === OrderStatus.DELIVERED || order.orderStatus === OrderStatus.CANCELLED) {
    throw Object.assign(new Error('Order cannot be cancelled'), { status: 400 })
  }

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.order.update({
      where: { id },
      data: {
        orderStatus: OrderStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelledBy: CancellationActor.CUSTOMER,
        cancellationReason: reason,
        statusHistory: { create: { fromStatus: order.orderStatus, toStatus: OrderStatus.CANCELLED, notes: reason } },
      },
      include: { selectedItems: true, payments: true, statusHistory: true },
    })
    await tx.event.update({ where: { id: order.eventId }, data: { status: EventStatus.CANCELLED } })
    await tx.notification.create({ data: { userId, orderId: id, type: NotificationType.ORDER_CANCELLED, title: 'Order cancelled', message: 'Your catering order has been cancelled.' } })
    return row
  })
  return serializeOrder(updated)
}
