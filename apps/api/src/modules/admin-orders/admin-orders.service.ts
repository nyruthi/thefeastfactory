import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  CancellationActor,
  EventStatus,
  OrderStatus,
  PaymentStatus,
  Prisma,
  RefundStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { AdminCancelOrderDto } from './dto/admin-cancel-order.dto';
import { AdminOrdersQueryDto } from './dto/admin-orders-query.dto';
import { CreateRefundDto } from './dto/create-refund.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

const transitions: Record<OrderStatus, OrderStatus[]> = {
  DRAFT: [OrderStatus.PENDING_PAYMENT, OrderStatus.CANCELLED],
  PENDING_PAYMENT: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  CONFIRMED: [OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED],
  IN_PROGRESS: [OrderStatus.READY_FOR_DELIVERY, OrderStatus.CANCELLED],
  READY_FOR_DELIVERY: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  DELIVERED: [],
  CANCELLED: [],
};

@Injectable()
export class AdminOrdersService {
  constructor(private readonly prisma: PrismaService, private readonly orders: OrdersService) {}

  async list(query: AdminOrdersQueryDto) {
    const rows = await this.prisma.order.findMany({
      where: {
        ...(query.orderStatus ? { orderStatus: query.orderStatus } : {}),
        ...(query.paymentStatus ? { paymentStatus: query.paymentStatus } : {}),
        ...(query.mobileNumber ? { user: { mobileNumber: { contains: query.mobileNumber } } } : {}),
        ...(query.dateFrom || query.dateTo
          ? { createdAt: { ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}), ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}) } }
          : {}),
      },
      include: { user: true, event: true, selectedItems: true, payments: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.orders.serializeOrder(row));
  }

  async get(id: string) {
    const row = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        event: { include: { address: true } },
        selectedItems: true,
        payments: { include: { refunds: true } },
        statusHistory: { include: { changedBy: true }, orderBy: { changedAt: 'asc' } },
      },
    });
    if (!row) throw new NotFoundException('Order not found');
    return this.orders.serializeOrder(row);
  }

  async updateStatus(adminId: string, id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    if (!transitions[order.orderStatus].includes(dto.status)) {
      throw new BadRequestException(`Cannot transition from ${order.orderStatus} to ${dto.status}`);
    }
    const row = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: {
          orderStatus: dto.status,
          statusHistory: {
            create: { fromStatus: order.orderStatus, toStatus: dto.status, changedById: adminId, notes: dto.notes },
          },
        },
        include: { user: true, event: true, selectedItems: true, payments: true, statusHistory: true },
      });
      if (dto.status === OrderStatus.DELIVERED) {
        await tx.event.update({ where: { id: order.eventId }, data: { status: EventStatus.COMPLETED } });
      }
      return updated;
    });
    return this.orders.serializeOrder(row);
  }

  async cancel(adminId: string, id: string, dto: AdminCancelOrderDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.orderStatus === OrderStatus.CANCELLED || order.orderStatus === OrderStatus.DELIVERED) {
      throw new BadRequestException('Order cannot be cancelled');
    }
    await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id },
        data: {
          orderStatus: OrderStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelledBy: CancellationActor.ADMIN,
          cancelledByAdminId: adminId,
          cancellationReason: dto.reason,
          statusHistory: {
            create: { fromStatus: order.orderStatus, toStatus: OrderStatus.CANCELLED, changedById: adminId, notes: dto.reason },
          },
        },
      }),
      this.prisma.event.update({ where: { id: order.eventId }, data: { status: EventStatus.CANCELLED } }),
    ]);
    return this.get(id);
  }

  async listPayments() {
    const rows = await this.prisma.payment.findMany({
      include: { order: { include: { user: true } }, refunds: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => ({
      ...row,
      amount: row.amount.toFixed(2),
      refunds: row.refunds.map((refund) => ({ ...refund, amount: refund.amount.toFixed(2) })),
    }));
  }

  async refund(adminId: string, paymentId: string, dto: CreateRefundDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { refunds: true, order: true },
    });
    if (!payment || payment.paymentStatus !== PaymentStatus.PAID) throw new BadRequestException('Paid payment not found');
    const amount = new Prisma.Decimal(dto.amount);
    const refunded = payment.refunds
      .filter((row) => row.refundStatus === RefundStatus.SUCCESS)
      .reduce((sum, row) => sum.plus(row.amount), new Prisma.Decimal(0));
    if (amount.lte(0) || refunded.plus(amount).gt(payment.amount)) throw new BadRequestException('Invalid refund amount');
    const totalRefunded = refunded.plus(amount);
    const status = totalRefunded.eq(payment.amount) ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED;
    const refund = await this.prisma.$transaction(async (tx) => {
      const created = await tx.refund.create({
        data: {
          paymentId,
          amount,
          refundStatus: RefundStatus.SUCCESS,
          reason: dto.reason,
          initiatedById: adminId,
          razorpayRefundId: `local_refund_${Date.now()}`,
          processedAt: new Date(),
          gatewayResponse: { localMode: true },
        },
      });
      await tx.payment.update({ where: { id: paymentId }, data: { paymentStatus: status } });
      await tx.order.update({ where: { id: payment.orderId }, data: { paymentStatus: status } });
      return created;
    });
    return { ...refund, amount: refund.amount.toFixed(2) };
  }
}
