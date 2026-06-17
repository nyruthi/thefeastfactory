import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { CreatePackageVersionDto } from './dto/create-package-version.dto';
import { PackageSelectionDto } from './dto/package-selection.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { UpdatePackageVersionDto } from './dto/update-package-version.dto';
import { UpsertCategoryRuleDto } from './dto/upsert-category-rule.dto';
import { UpsertItemPricingDto } from './dto/upsert-item-pricing.dto';
import { UpsertPackageMenuItemDto } from './dto/upsert-package-menu-item.dto';

@Injectable()
export class PackagesService {
  constructor(private readonly prisma: PrismaService) {}

  async listPackages() {
    const packages = await this.prisma.package.findMany({
      where: { isActive: true, deletedAt: null },
      include: {
        versions: {
          where: { isActive: true, publishedAt: { not: null } },
          orderBy: { versionNo: 'desc' },
          take: 1,
        },
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });

    return packages.map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      description: pkg.description,
      displayOrder: pkg.displayOrder,
      isCustom: pkg.isCustom,
      activeVersion: pkg.versions[0] ? this.serializeVersion(pkg.versions[0]) : null,
    }));
  }

  async getActiveVersion(packageId: string) {
    const version = await this.prisma.packageVersion.findFirst({
      where: {
        packageId,
        isActive: true,
        publishedAt: { not: null },
        package: { isActive: true, deletedAt: null },
      },
      include: { package: true },
      orderBy: { versionNo: 'desc' },
    });
    if (!version) throw new NotFoundException('Active package version not found');
    return { ...this.serializeVersion(version), packageName: version.package.name, isCustom: version.package.isCustom };
  }

  async getConfiguration(versionId: string) {
    const version = await this.loadVersionConfiguration(versionId, true);
    return this.serializeConfiguration(version);
  }

  async validateSelection(versionId: string, dto: PackageSelectionDto) {
    const version = await this.loadVersionConfiguration(versionId, true);
    const result = await this.evaluateSelection(version, dto);
    return { valid: result.errors.length === 0, errors: result.errors };
  }

  async priceSelection(versionId: string, dto: PackageSelectionDto) {
    const version = await this.loadVersionConfiguration(versionId, true);
    const result = await this.evaluateSelection(version, dto);
    const totalCustomizationCharges = result.items.reduce(
      (total, item) => total.plus(item.adjustmentAmount),
      new Prisma.Decimal(0),
    );
    return {
      valid: result.errors.length === 0,
      errors: result.errors,
      basePricePerPlate: version.basePricePerPlate.toFixed(2),
      totalCustomizationCharges: totalCustomizationCharges.toFixed(2),
      finalPerPlatePrice: version.basePricePerPlate.plus(totalCustomizationCharges).toFixed(2),
      items: result.items.map((item) => ({
        ...item,
        itemPrice: item.itemPrice.toFixed(2),
        includedValue: item.includedValue.toFixed(2),
        adjustmentAmount: item.adjustmentAmount.toFixed(2),
      })),
    };
  }

  listAdminPackages() {
    return this.prisma.package.findMany({
      where: { deletedAt: null },
      include: { versions: { orderBy: { versionNo: 'desc' } } },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });
  }

  createPackage(dto: CreatePackageDto) {
    return this.prisma.package.create({
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim(),
        displayOrder: dto.displayOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updatePackage(id: string, dto: UpdatePackageDto) {
    await this.assertPackage(id);
    return this.prisma.package.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() } : {}),
        ...(dto.displayOrder !== undefined ? { displayOrder: dto.displayOrder } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async createVersion(packageId: string, dto: CreatePackageVersionDto) {
    await this.assertPackage(packageId);
    this.assertGuestRange(dto.minGuestCount ?? 10, dto.maxGuestCount);
    return this.prisma.packageVersion.create({
      data: {
        packageId,
        versionNo: dto.versionNo,
        basePricePerPlate: new Prisma.Decimal(dto.basePricePerPlate),
        minGuestCount: dto.minGuestCount ?? 10,
        maxGuestCount: dto.maxGuestCount,
        isActive: dto.isActive ?? true,
        publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : null,
      },
    });
  }

  async updateVersion(id: string, dto: UpdatePackageVersionDto) {
    const current = await this.assertVersion(id);
    this.assertGuestRange(dto.minGuestCount ?? current.minGuestCount, dto.maxGuestCount ?? current.maxGuestCount);
    return this.prisma.packageVersion.update({
      where: { id },
      data: {
        ...(dto.versionNo !== undefined ? { versionNo: dto.versionNo } : {}),
        ...(dto.basePricePerPlate !== undefined
          ? { basePricePerPlate: new Prisma.Decimal(dto.basePricePerPlate) }
          : {}),
        ...(dto.minGuestCount !== undefined ? { minGuestCount: dto.minGuestCount } : {}),
        ...(dto.maxGuestCount !== undefined ? { maxGuestCount: dto.maxGuestCount } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.publishedAt !== undefined
          ? { publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : null }
          : {}),
      },
    });
  }

  async upsertCategoryRule(versionId: string, dto: UpsertCategoryRuleDto) {
    await Promise.all([this.assertVersion(versionId), this.assertCategory(dto.categoryId)]);
    const minSelections = dto.minSelections ?? 1;
    if (dto.maxSelections < minSelections) {
      throw new BadRequestException('Maximum selections must be at least minimum selections');
    }
    return this.prisma.packageCategoryRule.upsert({
      where: { packageVersionId_categoryId: { packageVersionId: versionId, categoryId: dto.categoryId } },
      update: {
        minSelections,
        maxSelections: dto.maxSelections,
        isMandatory: dto.isMandatory ?? true,
      },
      create: {
        packageVersionId: versionId,
        categoryId: dto.categoryId,
        minSelections,
        maxSelections: dto.maxSelections,
        isMandatory: dto.isMandatory ?? true,
      },
    });
  }

  async upsertMenuItem(versionId: string, dto: UpsertPackageMenuItemDto) {
    await this.assertVersion(versionId);
    const item = await this.prisma.menuItem.findFirst({
      where: { id: dto.menuItemId, categoryId: dto.categoryId, deletedAt: null },
    });
    if (!item) throw new BadRequestException('Menu item does not belong to the selected category');
    return this.prisma.packageMenuItem.upsert({
      where: { packageVersionId_menuItemId: { packageVersionId: versionId, menuItemId: dto.menuItemId } },
      update: { categoryId: dto.categoryId, isAvailable: dto.isAvailable ?? true },
      create: {
        packageVersionId: versionId,
        categoryId: dto.categoryId,
        menuItemId: dto.menuItemId,
        isAvailable: dto.isAvailable ?? true,
      },
    });
  }

  async upsertItemPricing(versionId: string, dto: UpsertItemPricingDto) {
    await this.assertVersion(versionId);
    const allowed = await this.prisma.packageMenuItem.findUnique({
      where: { packageVersionId_menuItemId: { packageVersionId: versionId, menuItemId: dto.menuItemId } },
    });
    if (!allowed) throw new BadRequestException('Add the menu item to this package version first');
    return this.prisma.packageMenuItemPricing.upsert({
      where: { packageVersionId_menuItemId: { packageVersionId: versionId, menuItemId: dto.menuItemId } },
      update: {
        itemPrice: new Prisma.Decimal(dto.itemPrice),
        includedValue: new Prisma.Decimal(dto.includedValue),
      },
      create: {
        packageVersionId: versionId,
        menuItemId: dto.menuItemId,
        itemPrice: new Prisma.Decimal(dto.itemPrice),
        includedValue: new Prisma.Decimal(dto.includedValue),
      },
    });
  }

  private async loadVersionConfiguration(versionId: string, publicOnly: boolean) {
    const version = await this.prisma.packageVersion.findFirst({
      where: {
        id: versionId,
        ...(publicOnly
          ? { isActive: true, publishedAt: { not: null }, package: { isActive: true, deletedAt: null } }
          : {}),
      },
      include: {
        package: true,
        categoryRules: { include: { category: true }, orderBy: { category: { displayOrder: 'asc' } } },
        packageMenuItems: {
          where: publicOnly ? { isAvailable: true, menuItem: { isActive: true, deletedAt: null } } : {},
          include: { menuItem: true, category: true },
        },
        packageMenuItemPricing: true,
      },
    });
    if (!version) throw new NotFoundException('Package version not found');
    return version;
  }

  private async serializeConfiguration(version: Awaited<ReturnType<PackagesService['loadVersionConfiguration']>>) {
    const pricing = new Map(version.packageMenuItemPricing.map((row) => [row.menuItemId, row]));
    return {
      id: version.id,
      packageId: version.packageId,
      packageName: version.package.name,
      isCustom: version.package.isCustom,
      versionNo: version.versionNo,
      basePricePerPlate: version.basePricePerPlate.toFixed(2),
      minGuestCount: version.minGuestCount,
      maxGuestCount: version.maxGuestCount,
      categoryRules: version.package.isCustom
        ? await this.customCategoryRules()
        : version.categoryRules.map((rule) => ({
            id: rule.id,
            category: rule.category,
            minSelections: rule.minSelections,
            maxSelections: rule.maxSelections,
            isMandatory: rule.isMandatory,
            items: version.packageMenuItems
              .filter((allowed) => allowed.categoryId === rule.categoryId)
              .map((allowed) => {
                const row = pricing.get(allowed.menuItemId);
                const itemPrice = row?.itemPrice ?? allowed.menuItem.basePrice;
                const includedValue = row?.includedValue ?? allowed.menuItem.basePrice;
                return {
                  ...allowed.menuItem,
                  basePrice: allowed.menuItem.basePrice.toFixed(2),
                  itemPrice: itemPrice.toFixed(2),
                  includedValue: includedValue.toFixed(2),
                  adjustmentAmount: Prisma.Decimal.max(itemPrice.minus(includedValue), 0).toFixed(2),
                };
              }),
          })),
    };
  }

  private async customCategoryRules() {
    const categories = await this.prisma.menuCategory.findMany({
      where: { isActive: true, menuItems: { some: { isActive: true, deletedAt: null } } },
      include: {
        menuItems: {
          where: { isActive: true, deletedAt: null },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });
    return categories.map((category) => ({
      id: `custom-${category.id}`,
      category: {
        id: category.id,
        name: category.name,
        description: category.description,
        displayOrder: category.displayOrder,
        isActive: category.isActive,
      },
      minSelections: 0,
      maxSelections: category.menuItems.length,
      isMandatory: false,
      items: category.menuItems.map((item) => ({
        ...item,
        basePrice: item.basePrice.toFixed(2),
        itemPrice: item.basePrice.toFixed(2),
        includedValue: '0.00',
        adjustmentAmount: item.basePrice.toFixed(2),
      })),
    }));
  }

  private async evaluateSelection(
    version: Awaited<ReturnType<PackagesService['loadVersionConfiguration']>>,
    dto: PackageSelectionDto,
  ) {
    const errors: string[] = [];
    const uniqueKeys = new Set(dto.selectedItems.map((item) => `${item.categoryId}:${item.menuItemId}`));
    if (uniqueKeys.size !== dto.selectedItems.length) errors.push('Duplicate menu selections are not allowed');

    if (version.package.isCustom) {
      return this.evaluateCustomSelection(dto, errors);
    }

    const allowedByItem = new Map(version.packageMenuItems.map((row) => [row.menuItemId, row]));
    const pricingByItem = new Map(version.packageMenuItemPricing.map((row) => [row.menuItemId, row]));

    for (const rule of version.categoryRules) {
      const count = dto.selectedItems.filter((item) => item.categoryId === rule.categoryId).length;
      if (rule.isMandatory && count < rule.minSelections) {
        errors.push(`${rule.category.name} requires at least ${rule.minSelections} selection(s)`);
      }
      if (count > rule.maxSelections) {
        errors.push(`${rule.category.name} allows at most ${rule.maxSelections} selection(s)`);
      }
    }

    const items = dto.selectedItems.flatMap((selection) => {
      const allowed = allowedByItem.get(selection.menuItemId);
      if (!allowed || !allowed.isAvailable || allowed.categoryId !== selection.categoryId) {
        errors.push(`Menu item ${selection.menuItemId} is not available for the selected package/category`);
        return [];
      }
      const price = pricingByItem.get(selection.menuItemId);
      const itemPrice = price?.itemPrice ?? allowed.menuItem.basePrice;
      const includedValue = price?.includedValue ?? allowed.menuItem.basePrice;
      return [{
        categoryId: selection.categoryId,
        menuItemId: selection.menuItemId,
        menuItemName: allowed.menuItem.name,
        itemPrice,
        includedValue,
        adjustmentAmount: Prisma.Decimal.max(itemPrice.minus(includedValue), 0),
      }];
    });

    return { errors, items };
  }

  private async evaluateCustomSelection(dto: PackageSelectionDto, errors: string[]) {
    const categories = await this.prisma.menuCategory.findMany({
      where: { id: { in: dto.selectedItems.map((item) => item.categoryId) } },
    });
    const categoryById = new Map(categories.map((category) => [category.id, category]));
    const menuItems = await this.prisma.menuItem.findMany({
      where: {
        id: { in: dto.selectedItems.map((item) => item.menuItemId) },
        isActive: true,
        deletedAt: null,
      },
      include: { category: true },
    });
    const menuItemById = new Map(menuItems.map((item) => [item.id, item]));
    const items = dto.selectedItems.flatMap((selection) => {
      const menuItem = menuItemById.get(selection.menuItemId);
      const category = categoryById.get(selection.categoryId);
      if (!menuItem || !category || menuItem.categoryId !== selection.categoryId) {
        errors.push(`Menu item ${selection.menuItemId} is not available for the selected category`);
        return [];
      }
      return [{
        categoryId: selection.categoryId,
        menuItemId: selection.menuItemId,
        menuItemName: menuItem.name,
        itemPrice: menuItem.basePrice,
        includedValue: new Prisma.Decimal(0),
        adjustmentAmount: menuItem.basePrice,
      }];
    });
    return { errors, items };
  }

  private serializeVersion<T extends { basePricePerPlate: Prisma.Decimal; publishedAt: Date | null }>(version: T) {
    return {
      ...version,
      basePricePerPlate: version.basePricePerPlate.toFixed(2),
      publishedAt: version.publishedAt?.toISOString() ?? null,
    };
  }

  private async assertPackage(id: string) {
    const pkg = await this.prisma.package.findFirst({ where: { id, deletedAt: null } });
    if (!pkg) throw new NotFoundException('Package not found');
    return pkg;
  }

  private async assertVersion(id: string) {
    const version = await this.prisma.packageVersion.findUnique({ where: { id } });
    if (!version) throw new NotFoundException('Package version not found');
    return version;
  }

  private async assertCategory(id: string) {
    const category = await this.prisma.menuCategory.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Menu category not found');
    return category;
  }

  private assertGuestRange(min: number, max?: number | null) {
    if (max !== undefined && max !== null && max < min) {
      throw new BadRequestException('Maximum guest count must be at least minimum guest count');
    }
  }
}
