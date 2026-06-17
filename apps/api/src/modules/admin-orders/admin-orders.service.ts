import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  CancellationActor,
  EventStatus,
  OrderStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../../common/auth/jwt-payload';
import { OperatingRegionsService } from '../operating-regions/operating-regions.service';
import { OrdersService } from '../orders/orders.service';
import { PaymentsService } from '../payments/payments.service';
import { OperationsService } from '../operations/operations.service';
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersService,
    private readonly payments: PaymentsService,
    private readonly operations: OperationsService,
    private readonly regions: OperatingRegionsService,
  ) {}

  async list(admin: JwtPayload, query: AdminOrdersQueryDto) {
    const regionId = await this.regions.resolveAdminScope(admin, query.regionId);
    const eventFilter = {
      ...(query.dateFrom || query.dateTo
        ? { eventDate: { ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}), ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}) } }
        : {}),
      ...(query.city ? { address: { city: { contains: query.city, mode: 'insensitive' as const } } } : {}),
    };
    const rows = await this.prisma.order.findMany({
      where: {
        ...(regionId ? { regionId } : {}),
        ...(query.orderStatus ? { orderStatus: query.orderStatus } : {}),
        ...(query.paymentStatus ? { paymentStatus: query.paymentStatus } : {}),
        ...(query.mobileNumber ? { user: { mobileNumber: { contains: query.mobileNumber } } } : {}),
        ...(Object.keys(eventFilter).length ? { event: eventFilter } : {}),
      },
      include: { user: true, event: { include: { address: true, region: true } }, region: true, selectedItems: true, payments: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.orders.serializeOrder(row));
  }

  async get(admin: JwtPayload, id: string) {
    const regionId = await this.regions.resolveAdminScope(admin);
    const row = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        event: { include: { address: true, region: true } },
        region: true,
        selectedItems: true,
        payments: { include: { refunds: true } },
        statusHistory: { include: { changedBy: true }, orderBy: { changedAt: 'asc' } },
      },
    });
    if (!row) throw new NotFoundException('Order not found');
    if (regionId && row.regionId !== regionId) throw new NotFoundException('Order not found');
    return this.orders.serializeOrder(row);
  }

  async updateStatus(admin: JwtPayload, id: string, dto: UpdateOrderStatusDto) {
    const regionId = await this.regions.resolveAdminScope(admin);
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    if (regionId && order.regionId !== regionId) throw new NotFoundException('Order not found');
    if (!transitions[order.orderStatus].includes(dto.status)) {
      throw new BadRequestException(`Cannot transition from ${order.orderStatus} to ${dto.status}`);
    }
    const row = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: {
          orderStatus: dto.status,
          statusHistory: {
            create: { fromStatus: order.orderStatus, toStatus: dto.status, changedById: admin.sub, notes: dto.notes },
          },
        },
        include: { user: true, event: true, selectedItems: true, payments: true, statusHistory: true },
      });
      if (dto.status === OrderStatus.DELIVERED) {
        await tx.event.update({ where: { id: order.eventId }, data: { status: EventStatus.COMPLETED } });
      }
      const notification = this.operations.notificationForStatus(dto.status);
      if (notification) {
        await this.operations.notify(tx, {
          userId: order.userId,
          orderId: order.id,
          ...notification,
        });
      }
      return updated;
    });
    return this.orders.serializeOrder(row);
  }

  async cancel(admin: JwtPayload, id: string, dto: AdminCancelOrderDto) {
    const regionId = await this.regions.resolveAdminScope(admin);
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    if (regionId && order.regionId !== regionId) throw new NotFoundException('Order not found');
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
          cancelledByAdminId: admin.sub,
          cancellationReason: dto.reason,
          statusHistory: {
            create: { fromStatus: order.orderStatus, toStatus: OrderStatus.CANCELLED, changedById: admin.sub, notes: dto.reason },
          },
        },
      }),
      this.prisma.event.update({ where: { id: order.eventId }, data: { status: EventStatus.CANCELLED } }),
      this.prisma.notification.create({
        data: {
          userId: order.userId,
          orderId: order.id,
          type: 'ORDER_CANCELLED',
          title: 'Order cancelled',
          message: 'Your catering order has been cancelled by the operations team.',
        },
      }),
    ]);
    return this.get(admin, id);
  }

  async listPayments(admin: JwtPayload, requestedRegionId?: string) {
    const regionId = await this.regions.resolveAdminScope(admin, requestedRegionId);
    const rows = await this.prisma.payment.findMany({
      where: regionId ? { order: { regionId } } : {},
      include: { order: { include: { user: true, region: true } }, refunds: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => ({
      ...row,
      amount: row.amount.toFixed(2),
      refunds: row.refunds.map((refund) => ({ ...refund, amount: refund.amount.toFixed(2) })),
    }));
  }

  async refund(admin: JwtPayload, paymentId: string, dto: CreateRefundDto) {
    const regionId = await this.regions.resolveAdminScope(admin);
    if (regionId) {
      const payment = await this.prisma.payment.findUnique({ where: { id: paymentId }, include: { order: true } });
      if (!payment || payment.order.regionId !== regionId) throw new NotFoundException('Payment not found');
    }
    return this.payments.createRefund(admin.sub, paymentId, dto.amount, dto.reason);
  }
}
