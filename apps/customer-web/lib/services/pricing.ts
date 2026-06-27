import { Prisma, SelectedItemRole } from '@prisma/client'
import { prisma } from '../prisma'

export interface SelectedItemInput { categoryId: string; menuItemId: string }

export async function quote(packageVersionId: string, guestCount: number, selectedItems: SelectedItemInput[]) {
  const version = await prisma.packageVersion.findFirst({
    where: { id: packageVersionId, isActive: true, publishedAt: { not: null }, package: { isActive: true, deletedAt: null } },
    include: {
      package: true,
      packageMenuItems: { where: { isAvailable: true }, include: { menuItem: true, category: true } },
    },
  })
  if (!version) throw Object.assign(new Error('Package version not found'), { status: 404 })
  if (guestCount < version.minGuestCount || (version.maxGuestCount && guestCount > version.maxGuestCount)) {
    throw Object.assign(new Error('Guest count is outside package limits'), { status: 400 })
  }
  if (new Set(selectedItems.map((i) => i.menuItemId)).size !== selectedItems.length) {
    throw Object.assign(new Error('Duplicate menu selections are not allowed'), { status: 400 })
  }

  if (version.package.type === 'CUSTOM_PACKAGE') return customQuote(version, guestCount, selectedItems)

  const isMealBox = version.package.type === 'MEAL_BOX'
  const allowed = new Map(version.packageMenuItems.map((r) => [r.menuItemId, r]))
  const errors: string[] = []

  const items = selectedItems.flatMap((sel) => {
    const row = allowed.get(sel.menuItemId)
    if (!row || row.categoryId !== sel.categoryId || !row.menuItem.isActive || row.menuItem.deletedAt) {
      errors.push(`Invalid menu item ${sel.menuItemId}`)
      return []
    }
    const itemPrice = isMealBox ? row.menuItem.boxPrice : row.menuItem.generalPrice
    const includedValue = isMealBox ? itemPrice : new Prisma.Decimal(0)
    const categoryName = row.category?.name ?? ''
    const role = isMealBox ? SelectedItemRole.INCLUDED : SelectedItemRole.EXTRA
    return [{ categoryId: sel.categoryId, categoryName, menuItemId: sel.menuItemId, menuItemName: row.menuItem.name, isVeg: row.menuItem.isVeg, itemPrice, includedValue, adjustmentAmount: Prisma.Decimal.max(itemPrice.minus(includedValue), 0), role }]
  })

  if (errors.length) throw Object.assign(new Error('Invalid package selection'), { status: 400, errors })

  const customization = items.reduce((s, i) => s.plus(i.adjustmentAmount), new Prisma.Decimal(0))
  const finalPerPlate = version.basePricePerPlate.plus(customization)
  return { packageVersionId: version.id, packageName: version.package.name, packageVersionNo: version.versionNo, guestCount, basePerPlatePrice: version.basePricePerPlate, totalCustomizationCharges: customization, finalPerPlatePrice: finalPerPlate, totalAmount: finalPerPlate.mul(guestCount), items }
}

async function customQuote(version: Prisma.PackageVersionGetPayload<{ include: { package: true } }>, guestCount: number, selectedItems: SelectedItemInput[]) {
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: selectedItems.map((i) => i.menuItemId) }, isActive: true, deletedAt: null },
    include: { category: true },
  })
  const menuItemById = new Map(menuItems.map((i) => [i.id, i]))
  const errors: string[] = []
  const items = selectedItems.flatMap((sel) => {
    const item = menuItemById.get(sel.menuItemId)
    if (!item || item.categoryId !== sel.categoryId || !item.category.isActive) {
      errors.push(`Invalid menu item ${sel.menuItemId}`)
      return []
    }
    return [{ categoryId: sel.categoryId, categoryName: item.category.name, menuItemId: sel.menuItemId, menuItemName: item.name, isVeg: item.isVeg, itemPrice: item.generalPrice, includedValue: new Prisma.Decimal(0), adjustmentAmount: item.generalPrice, role: SelectedItemRole.CUSTOM }]
  })
  if (errors.length) throw Object.assign(new Error('Invalid custom package selection'), { status: 400, errors })
  const finalPerPlate = items.reduce((s, i) => s.plus(i.itemPrice), new Prisma.Decimal(0))
  return { packageVersionId: version.id, packageName: version.package.name, packageVersionNo: version.versionNo, guestCount, basePerPlatePrice: version.basePricePerPlate, totalCustomizationCharges: finalPerPlate, finalPerPlatePrice: finalPerPlate, totalAmount: finalPerPlate.mul(guestCount), items }
}

export function serialize(q: Awaited<ReturnType<typeof quote>>) {
  return {
    ...q,
    basePerPlatePrice: q.basePerPlatePrice.toFixed(2),
    totalCustomizationCharges: q.totalCustomizationCharges.toFixed(2),
    finalPerPlatePrice: q.finalPerPlatePrice.toFixed(2),
    totalAmount: q.totalAmount.toFixed(2),
    items: q.items.map((i) => ({ ...i, itemPrice: i.itemPrice.toFixed(2), includedValue: i.includedValue.toFixed(2), adjustmentAmount: i.adjustmentAmount.toFixed(2) })),
  }
}
