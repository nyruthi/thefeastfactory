import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleError } from '../../../../../../lib/api-error'
import { requireAdmin } from '../../../../../../lib/auth'
import { deleteItem, updateItem } from '../../../../../../lib/services/menu'

const updateSchema = z.object({
  categoryId: z.string().uuid().optional(),
  name: z.string().min(1).max(150).optional(),
  description: z.string().max(1000).optional(),
  basePrice: z.number().positive().optional(),
  isVeg: z.boolean().optional(),
  isActive: z.boolean().optional(),
  imageUrl: z.string().url().max(500).nullable().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin(req)
  if (error) return error
  try {
    const { id } = await params
    const body = updateSchema.parse(await req.json())
    return NextResponse.json(await updateItem(id, body))
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin(req)
  if (error) return error
  try {
    const { id } = await params
    return NextResponse.json(await deleteItem(id))
  } catch (err) {
    return handleError(err)
  }
}
