import { Prisma } from '@prisma/client'
import { prisma } from '../prisma'

function serializeItem<T extends { boxPrice: Prisma.Decimal; generalPrice: Prisma.Decimal }>(item: T) {
  return {
    ...item,
    boxPrice: item.boxPrice.toFixed(2),
    generalPrice: item.generalPrice.toFixed(2),
    basePrice: item.generalPrice.toFixed(2),
  }
}

async function assertCategory(id: string) {
  const cat = await prisma.menuCategory.findUnique({ where: { id } })
  if (!cat) throw Object.assign(new Error('Menu category not found'), { status: 404 })
  return cat
}

async function assertItem(id: string) {
  const item = await prisma.menuItem.findFirst({ where: { id, deletedAt: null } })
  if (!item) throw Object.assign(new Error('Menu item not found'), { status: 404 })
  return item
}

// ── Public routes ──────────────────────────────────────────────────────────────

export function listCategories() {
  return prisma.menuCategory.findMany({
    where: { isActive: true },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, description: true, displayOrder: true, isActive: true },
  })
}

export interface MenuItemsQuery {
  categoryId?: string
  isVeg?: boolean
  search?: string
}

export async function listItems(query: MenuItemsQuery) {
  const items = await prisma.menuItem.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      category: { isActive: true },
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.isVeg !== undefined ? { isVeg: query.isVeg } : {}),
      ...(query.search
        ? { OR: [{ name: { contains: query.search, mode: 'insensitive' } }, { description: { contains: query.search, mode: 'insensitive' } }] }
        : {}),
    },
    include: { category: true },
    orderBy: [{ category: { displayOrder: 'asc' } }, { name: 'asc' }],
  })
  return items.map(serializeItem)
}

export async function getItem(id: string) {
  const item = await prisma.menuItem.findFirst({
    where: { id, isActive: true, deletedAt: null, category: { isActive: true } },
    include: { category: true },
  })
  if (!item) throw Object.assign(new Error('Menu item not found'), { status: 404 })
  return serializeItem(item)
}

// ── Admin routes ───────────────────────────────────────────────────────────────

export function listAdminCategories() {
  return prisma.menuCategory.findMany({ orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }] })
}

export interface CreateCategoryInput {
  name: string
  description?: string
  displayOrder?: number
  isActive?: boolean
}

export function createCategory(dto: CreateCategoryInput) {
  return prisma.menuCategory.create({
    data: {
      name: dto.name.trim(),
      description: dto.description?.trim(),
      displayOrder: dto.displayOrder ?? 0,
      isActive: dto.isActive ?? true,
    },
  })
}

export async function updateCategory(id: string, dto: Partial<CreateCategoryInput>) {
  await assertCategory(id)
  return prisma.menuCategory.update({
    where: { id },
    data: {
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.description !== undefined ? { description: dto.description?.trim() } : {}),
      ...(dto.displayOrder !== undefined ? { displayOrder: dto.displayOrder } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    },
  })
}

export async function listAdminItems(query: MenuItemsQuery) {
  const items = await prisma.menuItem.findMany({
    where: {
      deletedAt: null,
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.isVeg !== undefined ? { isVeg: query.isVeg } : {}),
      ...(query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {}),
    },
    include: { category: true },
    orderBy: [{ category: { displayOrder: 'asc' } }, { name: 'asc' }],
  })
  return items.map(serializeItem)
}

export interface CreateItemInput {
  categoryId: string
  name: string
  description?: string
  boxPrice: number
  generalPrice: number
  isVeg?: boolean
  isActive?: boolean
  imageUrl?: string | null
}

export async function createItem(dto: CreateItemInput) {
  await assertCategory(dto.categoryId)
  const item = await prisma.menuItem.create({
    data: {
      categoryId: dto.categoryId,
      name: dto.name.trim(),
      description: dto.description?.trim(),
      boxPrice: new Prisma.Decimal(dto.boxPrice),
      generalPrice: new Prisma.Decimal(dto.generalPrice),
      isVeg: dto.isVeg ?? true,
      isActive: dto.isActive ?? true,
      imageUrl: dto.imageUrl,
    },
    include: { category: true },
  })
  return serializeItem(item)
}

export async function updateItem(id: string, dto: Partial<CreateItemInput>) {
  await assertItem(id)
  if (dto.categoryId) await assertCategory(dto.categoryId)

  const item = await prisma.menuItem.update({
    where: { id },
    data: {
      ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.description !== undefined ? { description: dto.description?.trim() } : {}),
      ...(dto.boxPrice !== undefined ? { boxPrice: new Prisma.Decimal(dto.boxPrice) } : {}),
      ...(dto.generalPrice !== undefined ? { generalPrice: new Prisma.Decimal(dto.generalPrice) } : {}),
      ...(dto.isVeg !== undefined ? { isVeg: dto.isVeg } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl } : {}),
    },
    include: { category: true },
  })
  return serializeItem(item)
}

export async function deleteItem(id: string) {
  await assertItem(id)
  await prisma.menuItem.update({ where: { id }, data: { isActive: false, deletedAt: new Date() } })
  return { success: true }
}
