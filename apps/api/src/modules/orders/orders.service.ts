import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CancellationActor, EventStatus, OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { OrderSelectionDto } from './dto/order-selection.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService, private readonly pricing: PricingService) {}

  async quote(userId: string, dto: OrderSelectionDto) {
    const event = await this.getEvent(userId, dto.eventId);
    return this.pricing.serialize(await this.pricing.quote(event.packageVersionId, event.guestCount, dto.selectedItems));
  }

  async create(userId: string, dto: OrderSelectionDto) {
    const event = await this.getEvent(userId, dto.eventId);
    if (event.orders.length) throw new BadRequestException('An order already exists for this event');
    const quote = await this.pricing.quote(event.packageVersionId, event.guestCount, dto.selectedItems);
    const leadHours = Math.floor((event.eventDate.getTime() - Date.now()) / 3_600_000);
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber: this.orderNumber(),
          userId,
          eventId: event.id,
          guestCount: quote.guestCount,
          basePerPlatePrice: quote.basePerPlatePrice,
          totalCustomizationCharges: quote.totalCustomizationCharges,
          finalPerPlatePrice: quote.finalPerPlatePrice,
          totalAmount: quote.totalAmount,
          packageName: quote.packageName,
          packageVersionNo: quote.packageVersionNo,
          orderStatus: OrderStatus.PENDING_PAYMENT,
          bookingLeadHours: leadHours,
          selectedItems: {
            create: quote.items.map((item) => ({
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
        include: { selectedItems: true, statusHistory: true },
      });
      await tx.event.update({ where: { id: event.id }, data: { status: EventStatus.CONFIRMED } });
      return this.serializeOrder(order);
    });
  }

  async list(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: { event: true, selectedItems: true, payments: true },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((order) => this.serializeOrder(order));
  }

  async get(userId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: {
        event: { include: { address: true } },
        selectedItems: true,
        payments: { include: { refunds: true } },
        statusHistory: { orderBy: { changedAt: 'asc' } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return this.serializeOrder(order);
  }

  async cancel(userId: string, id: string, dto: CancelOrderDto) {
    const order = await this.prisma.order.findFirst({ where: { id, userId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.orderStatus === OrderStatus.DELIVERED || order.orderStatus === OrderStatus.CANCELLED) {
      throw new BadRequestException('Order cannot be cancelled');
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.order.update({
        where: { id },
        data: {
          orderStatus: OrderStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelledBy: CancellationActor.CUSTOMER,
          cancellationReason: dto.reason,
          statusHistory: {
            create: { fromStatus: order.orderStatus, toStatus: OrderStatus.CANCELLED, notes: dto.reason },
          },
        },
        include: { selectedItems: true, payments: true, statusHistory: true },
      });
      await tx.event.update({ where: { id: order.eventId }, data: { status: EventStatus.CANCELLED } });
      return row;
    });
    return this.serializeOrder(updated);
  }

  private async getEvent(userId: string, eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, userId },
      include: { orders: true },
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  private orderNumber() {
    const date = new Date().toISOString().slice(2, 10).replaceAll('-', '');
    return `ORD-${date}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }

  serializeOrder(order: Record<string, any>) {
    const moneyFields = ['basePerPlatePrice', 'totalCustomizationCharges', 'finalPerPlatePrice', 'totalAmount'];
    const result: Record<string, any> = { ...order };
    for (const field of moneyFields) if (result[field] instanceof Prisma.Decimal) result[field] = result[field].toFixed(2);
    if (result.selectedItems) {
      result.selectedItems = result.selectedItems.map((item: any) => ({
        ...item,
        itemPrice: item.itemPrice.toFixed(2),
        includedValue: item.includedValue.toFixed(2),
        adjustmentAmount: item.adjustmentAmount.toFixed(2),
      }));
    }
    if (result.payments) {
      result.payments = result.payments.map((payment: any) => ({
        ...payment,
        amount: payment.amount.toFixed(2),
        refunds: payment.refunds?.map((refund: any) => ({ ...refund, amount: refund.amount.toFixed(2) })),
      }));
    }
    return result;
  }
}
