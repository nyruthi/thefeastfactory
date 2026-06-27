import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleError } from '../../../../../lib/api-error'
import { requireAdmin } from '../../../../../lib/auth'
import { createCategory, listAdminCategories } from '../../../../../lib/services/menu'

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin(req)
  if (error) return error
  try {
    return NextResponse.json(await listAdminCategories())
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin(req)
  if (error) return error
  try {
    const body = createSchema.parse(await req.json())
    return NextResponse.json(await createCategory(body), { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
