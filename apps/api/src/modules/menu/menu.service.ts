import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMenuCategoryDto } from './dto/create-menu-category.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { MenuItemsQueryDto } from './dto/menu-items-query.dto';
import { UpdateMenuCategoryDto } from './dto/update-menu-category.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  listCategories() {
    return this.prisma.menuCategory.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        description: true,
        displayOrder: true,
        isActive: true,
      },
    });
  }

  async listItems(query: MenuItemsQueryDto) {
    const items = await this.prisma.menuItem.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        category: { isActive: true },
        ...(query.categoryId ? { categoryId: query.categoryId } : {}),
        ...(query.isVeg !== undefined ? { isVeg: query.isVeg } : {}),
        ...(query.search
          ? {
              OR: [
                { name: { contains: query.search, mode: 'insensitive' } },
                { description: { contains: query.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: { category: true },
      orderBy: [{ category: { displayOrder: 'asc' } }, { name: 'asc' }],
    });

    return items.map((item) => this.serializeItem(item));
  }

  async getItem(id: string) {
    const item = await this.prisma.menuItem.findFirst({
      where: { id, isActive: true, deletedAt: null, category: { isActive: true } },
      include: { category: true },
    });

    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    return this.serializeItem(item);
  }

  listAdminCategories() {
    return this.prisma.menuCategory.findMany({
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });
  }

  createCategory(dto: CreateMenuCategoryDto) {
    return this.prisma.menuCategory.create({
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim(),
        displayOrder: dto.displayOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateCategory(id: string, dto: UpdateMenuCategoryDto) {
    await this.assertCategory(id);
    return this.prisma.menuCategory.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() } : {}),
        ...(dto.displayOrder !== undefined ? { displayOrder: dto.displayOrder } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async listAdminItems(query: MenuItemsQueryDto) {
    const items = await this.prisma.menuItem.findMany({
      where: {
        deletedAt: null,
        ...(query.categoryId ? { categoryId: query.categoryId } : {}),
        ...(query.isVeg !== undefined ? { isVeg: query.isVeg } : {}),
        ...(query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {}),
      },
      include: { category: true },
      orderBy: [{ category: { displayOrder: 'asc' } }, { name: 'asc' }],
    });

    return items.map((item) => this.serializeItem(item));
  }

  async createItem(dto: CreateMenuItemDto) {
    await this.assertCategory(dto.categoryId);
    const item = await this.prisma.menuItem.create({
      data: {
        categoryId: dto.categoryId,
        name: dto.name.trim(),
        description: dto.description?.trim(),
        basePrice: new Prisma.Decimal(dto.basePrice),
        isVeg: dto.isVeg ?? true,
        isActive: dto.isActive ?? true,
        imageUrl: dto.imageUrl,
      },
      include: { category: true },
    });
    return this.serializeItem(item);
  }

  async updateItem(id: string, dto: UpdateMenuItemDto) {
    await this.assertItem(id);
    if (dto.categoryId) {
      await this.assertCategory(dto.categoryId);
    }

    const item = await this.prisma.menuItem.update({
      where: { id },
      data: {
        ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() } : {}),
        ...(dto.basePrice !== undefined ? { basePrice: new Prisma.Decimal(dto.basePrice) } : {}),
        ...(dto.isVeg !== undefined ? { isVeg: dto.isVeg } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl } : {}),
      },
      include: { category: true },
    });
    return this.serializeItem(item);
  }

  async deleteItem(id: string) {
    await this.assertItem(id);
    await this.prisma.menuItem.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
    return { success: true };
  }

  private async assertCategory(id: string) {
    const category = await this.prisma.menuCategory.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Menu category not found');
    return category;
  }

  private async assertItem(id: string) {
    const item = await this.prisma.menuItem.findFirst({ where: { id, deletedAt: null } });
    if (!item) throw new NotFoundException('Menu item not found');
    return item;
  }

  private serializeItem<T extends { basePrice: Prisma.Decimal; category?: unknown }>(item: T) {
    return { ...item, basePrice: item.basePrice.toFixed(2) };
  }
}
