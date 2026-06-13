import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async revenue() {
    const [paid, refunded] = await Promise.all([
      this.prisma.payment.aggregate({ where: { paymentStatus: PaymentStatus.PAID }, _sum: { amount: true }, _count: true }),
      this.prisma.refund.aggregate({ where: { refundStatus: 'SUCCESS' }, _sum: { amount: true }, _count: true }),
    ]);
    const gross = paid._sum.amount ?? 0;
    const refunds = refunded._sum.amount ?? 0;
    return {
      grossRevenue: gross.toString(),
      refundedAmount: refunds.toString(),
      netRevenue: Number(gross) - Number(refunds),
      paidPayments: paid._count,
    };
  }

  async orders() {
    const [byStatus, popularItems, total] = await Promise.all([
      this.prisma.order.groupBy({ by: ['orderStatus'], _count: true }),
      this.prisma.orderSelectedItem.groupBy({
        by: ['menuItemName'],
        _count: true,
        orderBy: { _count: { menuItemName: 'desc' } },
        take: 10,
      }),
      this.prisma.order.count(),
    ]);
    return { total, byStatus, popularItems };
  }

  async payments() {
    const [byStatus, total] = await Promise.all([
      this.prisma.payment.groupBy({ by: ['paymentStatus'], _count: true, _sum: { amount: true } }),
      this.prisma.payment.count(),
    ]);
    return {
      total,
      byStatus: byStatus.map((row) => ({
        paymentStatus: row.paymentStatus,
        count: row._count,
        amount: row._sum.amount?.toFixed(2) ?? '0.00',
      })),
    };
  }
}
