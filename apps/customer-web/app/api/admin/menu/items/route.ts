import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleError } from '../../../../../lib/api-error'
import { requireAdmin } from '../../../../../lib/auth'
import { createItem, listAdminItems } from '../../../../../lib/services/menu'

const createSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(1).max(150),
  description: z.string().max(1000).optional(),
  basePrice: z.number().positive(),
  isVeg: z.boolean().optional(),
  isActive: z.boolean().optional(),
  imageUrl: z.string().url().max(500).optional(),
})

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin(req)
  if (error) return error
  try {
    const { searchParams } = req.nextUrl
    const isVegParam = searchParams.get('isVeg')
    return NextResponse.json(await listAdminItems({
      categoryId: searchParams.get('categoryId') ?? undefined,
      isVeg: isVegParam !== null ? isVegParam === 'true' : undefined,
      search: searchParams.get('search') ?? undefined,
    }))
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin(req)
  if (error) return error
  try {
    const body = createSchema.parse(await req.json())
    return NextResponse.json(await createItem(body), { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
