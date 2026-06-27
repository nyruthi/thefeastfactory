import { PaymentStatus } from '@prisma/client'
import { prisma } from '../prisma'
import { resolveAdminScope } from './operating-regions'

interface AdminPayload { sub: string; role?: string | null }

export async function revenueReport(admin: AdminPayload, requestedRegionId?: string) {
  const regionId = await resolveAdminScope(admin.sub, admin.role ?? 'ADMIN', requestedRegionId)
  const paymentWhere = regionId ? { order: { regionId } } : {}
  const [paid, refunded] = await Promise.all([
    prisma.payment.aggregate({
      where: { paymentStatus: PaymentStatus.PAID, ...paymentWhere },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.refund.aggregate({
      where: {
        refundStatus: 'SUCCESS',
        ...(regionId ? { payment: { order: { regionId } } } : {}),
      },
      _sum: { amount: true },
      _count: true,
    }),
  ])
  const gross = paid._sum.amount ?? 0
  const refunds = refunded._sum.amount ?? 0
  return {
    grossRevenue: gross.toString(),
    refundedAmount: refunds.toString(),
    netRevenue: Number(gross) - Number(refunds),
    paidPayments: paid._count,
  }
}

export async function ordersReport(admin: AdminPayload, requestedRegionId?: string) {
  const regionId = await resolveAdminScope(admin.sub, admin.role ?? 'ADMIN', requestedRegionId)
  const orderWhere = regionId ? { regionId } : {}
  const [byStatus, popularItems, total] = await Promise.all([
    prisma.order.groupBy({
      by: ['orderStatus'],
      where: orderWhere,
      _count: true,
    }),
    prisma.orderSelectedItem.groupBy({
      by: ['menuItemName'],
      where: regionId ? { order: { regionId } } : {},
      _count: true,
      orderBy: { _count: { menuItemName: 'desc' } },
      take: 10,
    }),
    prisma.order.count({ where: orderWhere }),
  ])
  return { total, byStatus, popularItems }
}

export async function paymentsReport(admin: AdminPayload, requestedRegionId?: string) {
  const regionId = await resolveAdminScope(admin.sub, admin.role ?? 'ADMIN', requestedRegionId)
  const paymentWhere = regionId ? { order: { regionId } } : {}
  const [byStatus, total] = await Promise.all([
    prisma.payment.groupBy({
      by: ['paymentStatus'],
      where: paymentWhere,
      _count: true,
      _sum: { amount: true },
    }),
    prisma.payment.count({ where: paymentWhere }),
  ])
  return {
    total,
    byStatus: byStatus.map((row) => ({
      paymentStatus: row.paymentStatus,
      count: row._count,
      amount: row._sum.amount?.toFixed(2) ?? '0.00',
    })),
  }
}
