import { Prisma } from '@prisma/client'
import { prisma } from '../prisma'

// ── Helpers ────────────────────────────────────────────────────────────────────

function notFound(msg: string): never {
  throw Object.assign(new Error(msg), { status: 404 })
}

function badRequest(msg: string): never {
  throw Object.assign(new Error(msg), { status: 400 })
}

function serializeVersion<T extends { basePricePerPlate: Prisma.Decimal; publishedAt: Date | null }>(v: T) {
  return { ...v, basePricePerPlate: v.basePricePerPlate.toFixed(2), publishedAt: v.publishedAt?.toISOString() ?? null }
}

async function assertPackage(id: string) {
  const pkg = await prisma.package.findFirst({ where: { id, deletedAt: null } })
  if (!pkg) notFound('Package not found')
  return pkg
}

async function assertVersion(id: string) {
  const v = await prisma.packageVersion.findUnique({ where: { id } })
  if (!v) notFound('Package version not found')
  return v
}

function assertGuestRange(min: number, max?: number | null) {
  if (max != null && max < min) badRequest('Maximum guest count must be at least minimum guest count')
}

// ── loadVersionConfiguration ───────────────────────────────────────────────────

async function loadVersionConfiguration(versionId: string, publicOnly: boolean) {
  const version = await prisma.packageVersion.findFirst({
    where: {
      id: versionId,
      ...(publicOnly ? { isActive: true, publishedAt: { not: null }, package: { isActive: true, deletedAt: null } } : {}),
    },
    include: {
      package: true,
      packageMenuItems: {
        where: publicOnly ? { isAvailable: true, menuItem: { isActive: true, deletedAt: null } } : {},
        include: { menuItem: true, category: true },
        orderBy: [{ category: { displayOrder: 'asc' } }, { displayOrder: 'asc' }],
      },
    },
  })
  if (!version) notFound('Package version not found')
  return version
}

// ── customCategoryRules ────────────────────────────────────────────────────────

async function customCategoryRules() {
  const categories = await prisma.menuCategory.findMany({
    where: { isActive: true, menuItems: { some: { isActive: true, deletedAt: null } } },
    include: { menuItems: { where: { isActive: true, deletedAt: null }, orderBy: { name: 'asc' } } },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
  })
  return categories.map((cat) => ({
    id: `custom-${cat.id}`,
    category: { id: cat.id, name: cat.name, description: cat.description, displayOrder: cat.displayOrder, isActive: cat.isActive },
    minSelections: 0,
    maxSelections: cat.menuItems.length,
    isMandatory: false,
    items: cat.menuItems.map((item) => ({
      ...item,
      basePrice: item.generalPrice.toFixed(2),
      itemPrice: item.generalPrice.toFixed(2),
      includedValue: '0.00',
      adjustmentAmount: item.generalPrice.toFixed(2),
    })),
  }))
}

// ── serializeConfiguration ─────────────────────────────────────────────────────
// Derives category rules from packageMenuItems grouped by category.
// MEAL_BOX  → INCLUDED items per category (fixed slots, included in base price)
// FIXED_PACKAGE → EXTRA items per category (add-ons, customer pays generalPrice)
// CUSTOM_PACKAGE → all active menu items across all categories

async function serializeConfiguration(version: Awaited<ReturnType<typeof loadVersionConfiguration>>) {
  if (version.package.type === 'CUSTOM_PACKAGE') {
    return {
      id: version.id,
      packageId: version.packageId,
      packageName: version.package.name,
      isCustom: true,
      versionNo: version.versionNo,
      basePricePerPlate: version.basePricePerPlate.toFixed(2),
      minGuestCount: version.minGuestCount,
      maxGuestCount: version.maxGuestCount,
      categoryRules: await customCategoryRules(),
    }
  }

  const isMealBox = version.package.type === 'MEAL_BOX'
  // INCLUDED = fixed items in the package (meal boxes + curated fixed packages)
  // EXTRA = full add-on menu (uncurated fixed packages still use this)
  const hasIncluded = version.packageMenuItems.some((i) => i.role === 'INCLUDED')
  const targetRole = (isMealBox || hasIncluded) ? 'INCLUDED' : 'EXTRA'

  // Group items by category, preserving category displayOrder
  const categoryMap = new Map<string, {
    category: (typeof version.packageMenuItems)[number]['category']
    items: (typeof version.packageMenuItems)[number][]
  }>()

  for (const pmi of version.packageMenuItems) {
    if (pmi.role !== targetRole) continue
    if (!categoryMap.has(pmi.categoryId)) {
      categoryMap.set(pmi.categoryId, { category: pmi.category, items: [] })
    }
    categoryMap.get(pmi.categoryId)!.items.push(pmi)
  }

  const PREVIEW_CAP = 4
  const categoryRules = [...categoryMap.values()].map(({ category, items }) => {
    const count = items.length
    // INCLUDED items (meal boxes + curated packages): show all. EXTRA items: cap preview.
    const maxSelections = (isMealBox || targetRole === 'INCLUDED') ? count : Math.min(PREVIEW_CAP, count)
    return {
      id: `cat-${category.id}`,
      category,
      minSelections: isMealBox ? count : 0,
      maxSelections,
      isMandatory: isMealBox,
      items: items.map((pmi) => {
        const price = isMealBox ? pmi.menuItem.boxPrice : pmi.menuItem.generalPrice
        const includedValue = isMealBox ? price : new Prisma.Decimal(0)
        const adjustmentAmount = Prisma.Decimal.max(price.minus(includedValue), 0)
        return {
          ...pmi.menuItem,
          isSwappable: pmi.isSwappable,
          basePrice: price.toFixed(2),
          itemPrice: price.toFixed(2),
          includedValue: includedValue.toFixed(2),
          adjustmentAmount: adjustmentAmount.toFixed(2),
        }
      }),
    }
  })

  return {
    id: version.id,
    packageId: version.packageId,
    packageName: version.package.name,
    isCustom: false,
    versionNo: version.versionNo,
    basePricePerPlate: version.basePricePerPlate.toFixed(2),
    minGuestCount: version.minGuestCount,
    maxGuestCount: version.maxGuestCount,
    categoryRules,
  }
}

// ── evaluateSelection ──────────────────────────────────────────────────────────

export interface SelectedItem { categoryId: string; menuItemId: string }

async function evaluateSelection(
  version: Awaited<ReturnType<typeof loadVersionConfiguration>>,
  selectedItems: SelectedItem[],
) {
  const errors: string[] = []
  const uniqueKeys = new Set(selectedItems.map((i) => `${i.categoryId}:${i.menuItemId}`))
  if (uniqueKeys.size !== selectedItems.length) errors.push('Duplicate menu selections are not allowed')

  if (version.package.type === 'CUSTOM_PACKAGE') {
    return evaluateCustomSelection(selectedItems, errors)
  }

  const isMealBox = version.package.type === 'MEAL_BOX'
  // For MEAL_BOX we allow selecting any active item in the same category (swap).
  // For FIXED_PACKAGE items must be in the EXTRA pool for this version.
  const allowedByItem = new Map(version.packageMenuItems.map((r) => [r.menuItemId, r]))

  const items = selectedItems.flatMap((sel) => {
    const allowed = allowedByItem.get(sel.menuItemId)
    if (!allowed || !allowed.isAvailable || allowed.categoryId !== sel.categoryId) {
      errors.push(`Menu item ${sel.menuItemId} is not available for the selected package/category`)
      return []
    }
    const price = isMealBox ? allowed.menuItem.boxPrice : allowed.menuItem.generalPrice
    const includedValue = isMealBox ? price : new Prisma.Decimal(0)
    return [{ categoryId: sel.categoryId, menuItemId: sel.menuItemId, menuItemName: allowed.menuItem.name, itemPrice: price, includedValue, adjustmentAmount: Prisma.Decimal.max(price.minus(includedValue), 0) }]
  })

  return { errors, items }
}

async function evaluateCustomSelection(selectedItems: SelectedItem[], errors: string[]) {
  const categories = await prisma.menuCategory.findMany({
    where: { id: { in: selectedItems.map((i) => i.categoryId) } },
  })
  const categoryById = new Map(categories.map((c) => [c.id, c]))
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: selectedItems.map((i) => i.menuItemId) }, isActive: true, deletedAt: null },
    include: { category: true },
  })
  const menuItemById = new Map(menuItems.map((i) => [i.id, i]))
  const items = selectedItems.flatMap((sel) => {
    const menuItem = menuItemById.get(sel.menuItemId)
    const category = categoryById.get(sel.categoryId)
    if (!menuItem || !category || menuItem.categoryId !== sel.categoryId) {
      errors.push(`Menu item ${sel.menuItemId} is not available for the selected category`)
      return []
    }
    return [{ categoryId: sel.categoryId, menuItemId: sel.menuItemId, menuItemName: menuItem.name, itemPrice: menuItem.generalPrice, includedValue: new Prisma.Decimal(0), adjustmentAmount: menuItem.generalPrice }]
  })
  return { errors, items }
}

// ── Public API ─────────────────────────────────────────────────────────────────

export async function listPackages() {
  const packages = await prisma.package.findMany({
    where: { isActive: true, deletedAt: null },
    include: { versions: { where: { isActive: true, publishedAt: { not: null } }, orderBy: { versionNo: 'desc' }, take: 1 } },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
  })
  return packages.map((pkg) => ({
    id: pkg.id,
    name: pkg.name,
    description: pkg.description,
    displayOrder: pkg.displayOrder,
    type: pkg.type as 'MEAL_BOX' | 'FIXED_PACKAGE' | 'CUSTOM_PACKAGE',
    isCustom: pkg.type === 'CUSTOM_PACKAGE',
    activeVersion: pkg.versions[0] ? serializeVersion(pkg.versions[0]) : null,
  }))
}

export async function getActiveVersion(packageId: string) {
  const version = await prisma.packageVersion.findFirst({
    where: { packageId, isActive: true, publishedAt: { not: null }, package: { isActive: true, deletedAt: null } },
    include: { package: true },
    orderBy: { versionNo: 'desc' },
  })
  if (!version) notFound('Active package version not found')
  return { ...serializeVersion(version), packageName: version.package.name, isCustom: version.package.type === 'CUSTOM_PACKAGE' }
}

export async function getConfiguration(versionId: string) {
  const version = await loadVersionConfiguration(versionId, true)
  return serializeConfiguration(version)
}

export async function validateSelection(versionId: string, selectedItems: SelectedItem[]) {
  const version = await loadVersionConfiguration(versionId, true)
  const result = await evaluateSelection(version, selectedItems)
  return { valid: result.errors.length === 0, errors: result.errors }
}

export async function priceSelection(versionId: string, selectedItems: SelectedItem[]) {
  const version = await loadVersionConfiguration(versionId, true)
  const result = await evaluateSelection(version, selectedItems)
  const totalCustomizationCharges = result.items.reduce((t, i) => t.plus(i.adjustmentAmount), new Prisma.Decimal(0))
  return {
    valid: result.errors.length === 0,
    errors: result.errors,
    basePricePerPlate: version.basePricePerPlate.toFixed(2),
    totalCustomizationCharges: totalCustomizationCharges.toFixed(2),
    finalPerPlatePrice: version.basePricePerPlate.plus(totalCustomizationCharges).toFixed(2),
    items: result.items.map((i) => ({
      ...i,
      itemPrice: i.itemPrice.toFixed(2),
      includedValue: i.includedValue.toFixed(2),
      adjustmentAmount: i.adjustmentAmount.toFixed(2),
    })),
  }
}

// ── Admin API ──────────────────────────────────────────────────────────────────

export function listAdminPackages() {
  return prisma.package.findMany({
    where: { deletedAt: null },
    include: { versions: { orderBy: { versionNo: 'desc' } } },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
  })
}

export interface CreatePackageInput { name: string; description?: string; displayOrder?: number; isActive?: boolean }

export function createPackage(dto: CreatePackageInput) {
  return prisma.package.create({
    data: { name: dto.name.trim(), description: dto.description?.trim(), displayOrder: dto.displayOrder ?? 0, isActive: dto.isActive ?? true },
  })
}

export async function updatePackage(id: string, dto: Partial<CreatePackageInput>) {
  await assertPackage(id)
  return prisma.package.update({
    where: { id },
    data: {
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.description !== undefined ? { description: dto.description?.trim() } : {}),
      ...(dto.displayOrder !== undefined ? { displayOrder: dto.displayOrder } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    },
  })
}

export interface CreateVersionInput { versionNo: number; basePricePerPlate: number; minGuestCount?: number; maxGuestCount?: number | null; isActive?: boolean; publishedAt?: string | null }

export async function createVersion(packageId: string, dto: CreateVersionInput) {
  await assertPackage(packageId)
  assertGuestRange(dto.minGuestCount ?? 10, dto.maxGuestCount)
  return prisma.packageVersion.create({
    data: {
      packageId,
      versionNo: dto.versionNo,
      basePricePerPlate: new Prisma.Decimal(dto.basePricePerPlate),
      minGuestCount: dto.minGuestCount ?? 10,
      maxGuestCount: dto.maxGuestCount,
      isActive: dto.isActive ?? true,
      publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : null,
    },
  })
}

export async function updateVersion(id: string, dto: Partial<CreateVersionInput>) {
  const current = await assertVersion(id)
  assertGuestRange(dto.minGuestCount ?? current.minGuestCount, dto.maxGuestCount ?? current.maxGuestCount)
  return prisma.packageVersion.update({
    where: { id },
    data: {
      ...(dto.versionNo !== undefined ? { versionNo: dto.versionNo } : {}),
      ...(dto.basePricePerPlate !== undefined ? { basePricePerPlate: new Prisma.Decimal(dto.basePricePerPlate) } : {}),
      ...(dto.minGuestCount !== undefined ? { minGuestCount: dto.minGuestCount } : {}),
      ...(dto.maxGuestCount !== undefined ? { maxGuestCount: dto.maxGuestCount } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      ...(dto.publishedAt !== undefined ? { publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : null } : {}),
    },
  })
}
