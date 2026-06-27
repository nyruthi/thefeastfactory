import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CartStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { PricingService } from '../pricing/pricing.service';
import { AttachCartEventDto } from './dto/attach-cart-event.dto';
import { CreateCartDto } from './dto/create-cart.dto';
import {
  CartSelectionItemDto,
  ReplaceCartItemsDto,
} from './dto/replace-cart-items.dto';

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: PricingService,
    private readonly orders: OrdersService,
  ) {}

  async getActive(userId: string) {
    const cart = await this.prisma.cart.findFirst({
      where: { userId, status: CartStatus.ACTIVE },
      include: this.cartInclude(),
      orderBy: { updatedAt: 'desc' },
    });
    return cart ? this.serializeCart(cart) : null;
  }

  async createOrFetch(userId: string, dto: CreateCartDto) {
    await this.assertPackageVersion(dto.packageVersionId);
    if (dto.eventId) {
      await this.assertEvent(userId, dto.eventId, dto.packageVersionId);
    }

    const existing = await this.prisma.cart.findFirst({
      where: {
        userId,
        packageVersionId: dto.packageVersionId,
        status: CartStatus.ACTIVE,
      },
      include: this.cartInclude(),
      orderBy: { updatedAt: 'desc' },
    });
    if (existing) {
      const updated =
        dto.eventId && existing.eventId !== dto.eventId
          ? await this.prisma.cart.update({
              where: { id: existing.id },
              data: { eventId: dto.eventId },
              include: this.cartInclude(),
            })
          : existing;
      return this.serializeCart(updated);
    }

    const cart = await this.prisma.cart.create({
      data: {
        userId,
        packageVersionId: dto.packageVersionId,
        eventId: dto.eventId ?? null,
        expiresAt: this.expiryDate(),
      },
      include: this.cartInclude(),
    });
    return this.serializeCart(cart);
  }

  async replaceItems(userId: string, id: string, dto: ReplaceCartItemsDto) {
    const cart = await this.assertActiveCart(userId, id);
    if (dto.items.length) {
      await this.validateCartItems(cart.packageVersionId, dto.items);
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.cartItem.deleteMany({ where: { cartId: id } });
      if (dto.items.length) {
        await tx.cartItem.createMany({
          data: dto.items.map((item) => ({
            cartId: id,
            categoryId: item.categoryId,
            menuItemId: item.menuItemId,
            replacedMenuItemId: item.replacedMenuItemId ?? null,
            role: item.role,
            quantity: item.quantity ?? 1,
          })),
        });
      }
      return tx.cart.update({
        where: { id },
        data: { lastQuotedAt: null, expiresAt: this.expiryDate() },
        include: this.cartInclude(),
      });
    });
    return this.serializeCart(updated);
  }

  async attachEvent(userId: string, id: string, dto: AttachCartEventDto) {
    const cart = await this.assertActiveCart(userId, id);
    await this.assertEvent(userId, dto.eventId, cart.packageVersionId);
    const updated = await this.prisma.cart.update({
      where: { id },
      data: { eventId: dto.eventId, expiresAt: this.expiryDate() },
      include: this.cartInclude(),
    });
    return this.serializeCart(updated);
  }

  async quote(userId: string, id: string) {
    const cart = await this.assertActiveCart(userId, id);
    const guestCount =
      cart.event?.guestCount ?? cart.packageVersion.minGuestCount;
    const quote = await this.pricing.quote(
      cart.packageVersionId,
      guestCount,
      cart.items.map((item) => ({
        categoryId: item.categoryId,
        menuItemId: item.menuItemId,
        replacedMenuItemId: item.replacedMenuItemId,
        role: item.role,
      })),
    );
    await this.prisma.cart.update({
      where: { id },
      data: { lastQuotedAt: new Date() },
    });
    return this.pricing.serialize(quote);
  }

  async checkout(userId: string, id: string) {
    const cart = await this.assertActiveCart(userId, id);
    if (!cart.eventId) {
      throw new BadRequestException('Attach event details before checkout');
    }
    const order = await this.orders.create(
      userId,
      {
        eventId: cart.eventId,
        selectedItems: cart.items.map((item) => ({
          categoryId: item.categoryId,
          menuItemId: item.menuItemId,
          replacedMenuItemId: item.replacedMenuItemId,
          role: item.role,
        })),
      },
      cart.id,
    );
    await this.prisma.cart.update({
      where: { id },
      data: { status: CartStatus.CHECKED_OUT },
    });
    return order;
  }

  private async validateCartItems(
    packageVersionId: string,
    items: CartSelectionItemDto[],
  ) {
    const version = await this.assertPackageVersion(packageVersionId);
    const guestCount = version.minGuestCount;
    await this.pricing.quote(packageVersionId, guestCount, items);
  }

  private async assertActiveCart(userId: string, id: string) {
    const cart = await this.prisma.cart.findFirst({
      where: { id, userId, status: CartStatus.ACTIVE },
      include: this.cartInclude(),
    });
    if (!cart) throw new NotFoundException('Active cart not found');
    return cart;
  }

  private async assertPackageVersion(id: string) {
    const version = await this.prisma.packageVersion.findFirst({
      where: {
        id,
        isActive: true,
        publishedAt: { not: null },
        package: { isActive: true, deletedAt: null },
      },
      include: { package: true },
    });
    if (!version) throw new NotFoundException('Package version not found');
    return version;
  }

  private async assertEvent(
    userId: string,
    eventId: string,
    packageVersionId: string,
  ) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, userId },
    });
    if (!event) throw new NotFoundException('Event not found');
    if (event.packageVersionId !== packageVersionId) {
      throw new BadRequestException(
        'Event package does not match the cart package',
      );
    }
    return event;
  }

  private cartInclude() {
    return {
      packageVersion: { include: { package: true } },
      event: true,
      items: {
        include: {
          category: true,
          menuItem: true,
          replacedMenuItem: true,
        },
        orderBy: { createdAt: 'asc' as const },
      },
    };
  }

  private serializeCart(cart: Record<string, any>) {
    return {
      id: cart.id,
      userId: cart.userId,
      packageVersionId: cart.packageVersionId,
      eventId: cart.eventId,
      status: cart.status,
      expiresAt: cart.expiresAt?.toISOString() ?? null,
      lastQuotedAt: cart.lastQuotedAt?.toISOString() ?? null,
      createdAt: cart.createdAt.toISOString(),
      updatedAt: cart.updatedAt.toISOString(),
      package: cart.packageVersion
        ? {
            id: cart.packageVersion.package.id,
            name: cart.packageVersion.package.name,
            type: cart.packageVersion.package.type,
            versionNo: cart.packageVersion.versionNo,
            basePricePerPlate:
              cart.packageVersion.basePricePerPlate instanceof Prisma.Decimal
                ? cart.packageVersion.basePricePerPlate.toFixed(2)
                : cart.packageVersion.basePricePerPlate,
          }
        : null,
      event: cart.event
        ? {
            id: cart.event.id,
            eventName: cart.event.eventName,
            eventDate: cart.event.eventDate.toISOString().slice(0, 10),
            guestCount: cart.event.guestCount,
          }
        : null,
      items: (cart.items ?? []).map((item: any) => ({
        id: item.id,
        categoryId: item.categoryId,
        categoryName: item.category?.name,
        menuItemId: item.menuItemId,
        menuItemName: item.menuItem?.name,
        replacedMenuItemId: item.replacedMenuItemId,
        replacedMenuItemName: item.replacedMenuItem?.name ?? null,
        role: item.role,
        quantity: item.quantity,
        isVeg: item.menuItem?.isVeg,
      })),
    };
  }

  private expiryDate() {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);
    return expiresAt;
  }
}
