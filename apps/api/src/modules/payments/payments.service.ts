import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { PrismaService } from '../../prisma/prisma.service';
import { VerifyPaymentDto } from './dto/verify-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  async createGatewayOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.orderStatus !== OrderStatus.PENDING_PAYMENT) throw new BadRequestException('Order is not awaiting payment');
    const keyId = this.config.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.config.get<string>('RAZORPAY_KEY_SECRET');
    let gatewayOrder: { id: string; amount: number; currency: string };
    if (keyId && keySecret) {
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      const created = await razorpay.orders.create({
        amount: order.totalAmount.mul(100).toNumber(),
        currency: this.config.get<string>('RAZORPAY_CURRENCY', 'INR'),
        receipt: order.orderNumber,
      });
      gatewayOrder = { id: created.id, amount: Number(created.amount), currency: created.currency };
    } else {
      gatewayOrder = {
        id: `local_order_${order.id}`,
        amount: order.totalAmount.mul(100).toNumber(),
        currency: 'INR',
      };
    }
    const payment = await this.prisma.payment.create({
      data: { orderId, amount: order.totalAmount, razorpayOrderId: gatewayOrder.id },
    });
    return { paymentId: payment.id, keyId: keyId || 'local', ...gatewayOrder, localMode: !keyId };
  }

  async verify(userId: string, dto: VerifyPaymentDto) {
    const payment = await this.prisma.payment.findFirst({
      where: { razorpayOrderId: dto.razorpayOrderId, order: { userId } },
      include: { order: true },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.paymentStatus === PaymentStatus.PAID) return { success: true, orderId: payment.orderId };
    const secret = this.config.get<string>('RAZORPAY_KEY_SECRET');
    const expected = secret
      ? crypto.createHmac('sha256', secret).update(`${dto.razorpayOrderId}|${dto.razorpayPaymentId}`).digest('hex')
      : 'local_success';
    if (dto.razorpaySignature !== expected) throw new UnauthorizedException('Invalid payment signature');
    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          paymentStatus: PaymentStatus.PAID,
          razorpayPaymentId: dto.razorpayPaymentId,
          razorpaySignature: dto.razorpaySignature,
          paidAt: new Date(),
          gatewayResponse: { verified: true, localMode: !secret },
        },
      }),
      this.prisma.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: PaymentStatus.PAID,
          orderStatus: OrderStatus.CONFIRMED,
          statusHistory: {
            create: { fromStatus: payment.order.orderStatus, toStatus: OrderStatus.CONFIRMED, notes: 'Payment verified' },
          },
        },
      }),
    ]);
    return { success: true, orderId: payment.orderId };
  }

  async webhook(payload: Record<string, any>, signature?: string) {
    const secret = this.config.get<string>('RAZORPAY_WEBHOOK_SECRET');
    if (secret) {
      const expected = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
      if (signature !== expected) throw new UnauthorizedException('Invalid webhook signature');
    }
    const paymentId = payload?.payload?.payment?.entity?.id;
    if (!paymentId) return { received: true, ignored: true };
    const payment = await this.prisma.payment.findFirst({ where: { razorpayPaymentId: paymentId } });
    if (payment) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { gatewayResponse: payload as Prisma.InputJsonValue },
      });
    }
    return { received: true };
  }
}
