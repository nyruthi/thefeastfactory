import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type SelectedItemInput = { categoryId: string; menuItemId: string };
type PackageVersionForQuote = Prisma.PackageVersionGetPayload<{
  include: { package: true };
}>;

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  async quote(
    packageVersionId: string,
    guestCount: number,
    selectedItems: SelectedItemInput[],
  ) {
    const version = await this.prisma.packageVersion.findFirst({
      where: {
        id: packageVersionId,
        isActive: true,
        publishedAt: { not: null },
        package: { isActive: true, deletedAt: null },
      },
      include: {
        package: true,
        categoryRules: { include: { category: true } },
        packageMenuItems: {
          where: { isAvailable: true },
          include: { menuItem: true },
        },
        packageMenuItemPricing: true,
      },
    });
    if (!version) throw new NotFoundException('Package version not found');
    if (
      guestCount < version.minGuestCount ||
      (version.maxGuestCount && guestCount > version.maxGuestCount)
    ) {
      throw new BadRequestException('Guest count is outside package limits');
    }
    if (
      new Set(selectedItems.map((item) => item.menuItemId)).size !==
      selectedItems.length
    ) {
      throw new BadRequestException(
        'Duplicate menu selections are not allowed',
      );
    }
    if (version.package.isCustom) {
      return this.customQuote(version, guestCount, selectedItems);
    }
    const allowed = new Map(
      version.packageMenuItems.map((row) => [row.menuItemId, row]),
    );
    const pricing = new Map(
      version.packageMenuItemPricing.map((row) => [row.menuItemId, row]),
    );
    const errors: string[] = [];
    for (const rule of version.categoryRules) {
      const count = selectedItems.filter(
        (item) => item.categoryId === rule.categoryId,
      ).length;
      if (rule.isMandatory && count < rule.minSelections)
        errors.push(`${rule.category.name} requires ${rule.minSelections}`);
      if (count > rule.maxSelections)
        errors.push(
          `${rule.category.name} allows at most ${rule.maxSelections}`,
        );
    }
    const items = selectedItems.flatMap((selection) => {
      const row = allowed.get(selection.menuItemId);
      if (
        !row ||
        row.categoryId !== selection.categoryId ||
        !row.menuItem.isActive ||
        row.menuItem.deletedAt
      ) {
        errors.push(`Invalid menu item ${selection.menuItemId}`);
        return [];
      }
      const price = pricing.get(selection.menuItemId);
      const itemPrice = price?.itemPrice ?? row.menuItem.basePrice;
      const includedValue = price?.includedValue ?? row.menuItem.basePrice;
      return [
        {
          categoryId: selection.categoryId,
          categoryName:
            version.categoryRules.find(
              (rule) => rule.categoryId === selection.categoryId,
            )?.category.name ?? '',
          menuItemId: selection.menuItemId,
          menuItemName: row.menuItem.name,
          isVeg: row.menuItem.isVeg,
          itemPrice,
          includedValue,
          adjustmentAmount: Prisma.Decimal.max(
            itemPrice.minus(includedValue),
            0,
          ),
        },
      ];
    });
    if (errors.length)
      throw new BadRequestException({
        message: 'Invalid package selection',
        errors,
      });
    const customization = items.reduce(
      (sum, item) => sum.plus(item.adjustmentAmount),
      new Prisma.Decimal(0),
    );
    const finalPerPlate = version.basePricePerPlate.plus(customization);
    return {
      packageVersionId: version.id,
      packageName: version.package.name,
      packageVersionNo: version.versionNo,
      guestCount,
      basePerPlatePrice: version.basePricePerPlate,
      totalCustomizationCharges: customization,
      finalPerPlatePrice: finalPerPlate,
      totalAmount: finalPerPlate.mul(guestCount),
      items,
    };
  }

  private async customQuote(
    version: PackageVersionForQuote,
    guestCount: number,
    selectedItems: SelectedItemInput[],
  ) {
    const menuItems = await this.prisma.menuItem.findMany({
      where: {
        id: { in: selectedItems.map((item) => item.menuItemId) },
        isActive: true,
        deletedAt: null,
      },
      include: { category: true },
    });
    const menuItemById = new Map(menuItems.map((item) => [item.id, item]));
    const errors: string[] = [];
    const items = selectedItems.flatMap((selection) => {
      const menuItem = menuItemById.get(selection.menuItemId);
      if (
        !menuItem ||
        menuItem.categoryId !== selection.categoryId ||
        !menuItem.category.isActive
      ) {
        errors.push(`Invalid menu item ${selection.menuItemId}`);
        return [];
      }
      return [
        {
          categoryId: selection.categoryId,
          categoryName: menuItem.category.name,
          menuItemId: selection.menuItemId,
          menuItemName: menuItem.name,
          isVeg: menuItem.isVeg,
          itemPrice: menuItem.basePrice,
          includedValue: new Prisma.Decimal(0),
          adjustmentAmount: menuItem.basePrice,
        },
      ];
    });
    if (errors.length)
      throw new BadRequestException({
        message: 'Invalid custom package selection',
        errors,
      });
    const finalPerPlate = items.reduce(
      (sum, item) => sum.plus(item.itemPrice),
      new Prisma.Decimal(0),
    );
    return {
      packageVersionId: version.id,
      packageName: version.package.name,
      packageVersionNo: version.versionNo,
      guestCount,
      basePerPlatePrice: version.basePricePerPlate,
      totalCustomizationCharges: finalPerPlate,
      finalPerPlatePrice: finalPerPlate,
      totalAmount: finalPerPlate.mul(guestCount),
      items,
    };
  }

  serialize(quote: Awaited<ReturnType<PricingService['quote']>>) {
    return {
      ...quote,
      basePerPlatePrice: quote.basePerPlatePrice.toFixed(2),
      totalCustomizationCharges: quote.totalCustomizationCharges.toFixed(2),
      finalPerPlatePrice: quote.finalPerPlatePrice.toFixed(2),
      totalAmount: quote.totalAmount.toFixed(2),
      items: quote.items.map((item) => ({
        ...item,
        itemPrice: item.itemPrice.toFixed(2),
        includedValue: item.includedValue.toFixed(2),
        adjustmentAmount: item.adjustmentAmount.toFixed(2),
      })),
    };
  }
}
