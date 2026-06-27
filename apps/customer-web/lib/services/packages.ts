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

async function assertCategory(id: string) {
  const cat = await prisma.menuCategory.findUnique({ where: { id } })
  if (!cat) notFound('Menu category not found')
  return cat
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
      categoryRules: { include: { category: true }, orderBy: { category: { displayOrder: 'asc' } } },
      packageMenuItems: {
        where: publicOnly ? { isAvailable: true, menuItem: { isActive: true, deletedAt: null } } : {},
        include: { menuItem: true, category: true },
      },
      packageMenuItemPricing: true,
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
      basePrice: item.basePrice.toFixed(2),
      itemPrice: item.basePrice.toFixed(2),
      includedValue: '0.00',
      adjustmentAmount: item.basePrice.toFixed(2),
    })),
  }))
}

// ── serializeConfiguration ─────────────────────────────────────────────────────

async function serializeConfiguration(version: Awaited<ReturnType<typeof loadVersionConfiguration>>) {
  const pricing = new Map(version.packageMenuItemPricing.map((row) => [row.menuItemId, row]))
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
      ? await customCategoryRules()
      : version.categoryRules.map((rule) => ({
          id: rule.id,
          category: rule.category,
          minSelections: rule.minSelections,
          maxSelections: rule.maxSelections,
          isMandatory: rule.isMandatory,
          items: version.packageMenuItems
            .filter((a) => a.categoryId === rule.categoryId)
            .map((a) => {
              const row = pricing.get(a.menuItemId)
              const itemPrice = row?.itemPrice ?? a.menuItem.basePrice
              const includedValue = row?.includedValue ?? a.menuItem.basePrice
              return {
                ...a.menuItem,
                basePrice: a.menuItem.basePrice.toFixed(2),
                itemPrice: itemPrice.toFixed(2),
                includedValue: includedValue.toFixed(2),
                adjustmentAmount: Prisma.Decimal.max(itemPrice.minus(includedValue), 0).toFixed(2),
              }
            }),
        })),
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

  if (version.package.isCustom) {
    return evaluateCustomSelection(selectedItems, errors)
  }

  const allowedByItem = new Map(version.packageMenuItems.map((r) => [r.menuItemId, r]))
  const pricingByItem = new Map(version.packageMenuItemPricing.map((r) => [r.menuItemId, r]))

  for (const rule of version.categoryRules) {
    const count = selectedItems.filter((i) => i.categoryId === rule.categoryId).length
    if (rule.isMandatory && count < rule.minSelections) {
      errors.push(`${rule.category.name} requires at least ${rule.minSelections} selection(s)`)
    }
    if (count > rule.maxSelections) {
      errors.push(`${rule.category.name} allows at most ${rule.maxSelections} selection(s)`)
    }
  }

  const items = selectedItems.flatMap((sel) => {
    const allowed = allowedByItem.get(sel.menuItemId)
    if (!allowed || !allowed.isAvailable || allowed.categoryId !== sel.categoryId) {
      errors.push(`Menu item ${sel.menuItemId} is not available for the selected package/category`)
      return []
    }
    const price = pricingByItem.get(sel.menuItemId)
    const itemPrice = price?.itemPrice ?? allowed.menuItem.basePrice
    const includedValue = price?.includedValue ?? allowed.menuItem.basePrice
    return [{ categoryId: sel.categoryId, menuItemId: sel.menuItemId, menuItemName: allowed.menuItem.name, itemPrice, includedValue, adjustmentAmount: Prisma.Decimal.max(itemPrice.minus(includedValue), 0) }]
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
    return [{ categoryId: sel.categoryId, menuItemId: sel.menuItemId, menuItemName: menuItem.name, itemPrice: menuItem.basePrice, includedValue: new Prisma.Decimal(0), adjustmentAmount: menuItem.basePrice }]
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
    isCustom: pkg.isCustom,
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
  return { ...serializeVersion(version), packageName: version.package.name, isCustom: version.package.isCustom }
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

export interface UpsertCategoryRuleInput { categoryId: string; minSelections?: number; maxSelections: number; isMandatory?: boolean }

export async function upsertCategoryRule(versionId: string, dto: UpsertCategoryRuleInput) {
  await Promise.all([assertVersion(versionId), assertCategory(dto.categoryId)])
  const min = dto.minSelections ?? 1
  if (dto.maxSelections < min) badRequest('Maximum selections must be at least minimum selections')
  return prisma.packageCategoryRule.upsert({
    where: { packageVersionId_categoryId: { packageVersionId: versionId, categoryId: dto.categoryId } },
    update: { minSelections: min, maxSelections: dto.maxSelections, isMandatory: dto.isMandatory ?? true },
    create: { packageVersionId: versionId, categoryId: dto.categoryId, minSelections: min, maxSelections: dto.maxSelections, isMandatory: dto.isMandatory ?? true },
  })
}

export interface UpsertMenuItemInput { menuItemId: string; categoryId: string; isAvailable?: boolean }

export async function upsertMenuItem(versionId: string, dto: UpsertMenuItemInput) {
  await assertVersion(versionId)
  const item = await prisma.menuItem.findFirst({ where: { id: dto.menuItemId, categoryId: dto.categoryId, deletedAt: null } })
  if (!item) badRequest('Menu item does not belong to the selected category')
  return prisma.packageMenuItem.upsert({
    where: { packageVersionId_menuItemId: { packageVersionId: versionId, menuItemId: dto.menuItemId } },
    update: { categoryId: dto.categoryId, isAvailable: dto.isAvailable ?? true },
    create: { packageVersionId: versionId, categoryId: dto.categoryId, menuItemId: dto.menuItemId, isAvailable: dto.isAvailable ?? true },
  })
}

export interface UpsertItemPricingInput { menuItemId: string; itemPrice: number; includedValue: number }

export async function upsertItemPricing(versionId: string, dto: UpsertItemPricingInput) {
  await assertVersion(versionId)
  const allowed = await prisma.packageMenuItem.findUnique({ where: { packageVersionId_menuItemId: { packageVersionId: versionId, menuItemId: dto.menuItemId } } })
  if (!allowed) badRequest('Add the menu item to this package version first')
  return prisma.packageMenuItemPricing.upsert({
    where: { packageVersionId_menuItemId: { packageVersionId: versionId, menuItemId: dto.menuItemId } },
    update: { itemPrice: new Prisma.Decimal(dto.itemPrice), includedValue: new Prisma.Decimal(dto.includedValue) },
    create: { packageVersionId: versionId, menuItemId: dto.menuItemId, itemPrice: new Prisma.Decimal(dto.itemPrice), includedValue: new Prisma.Decimal(dto.includedValue) },
  })
}
