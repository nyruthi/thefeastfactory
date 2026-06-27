import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleError } from '../../../../../../lib/api-error'
import { requireAdmin } from '../../../../../../lib/auth'
import { upsertCategoryRule } from '../../../../../../lib/services/packages'

const schema = z.object({
  categoryId: z.string().uuid(),
  minSelections: z.number().int().min(0).optional(),
  maxSelections: z.number().int().min(1),
  isMandatory: z.boolean().optional(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin(req)
  if (error) return error
  try {
    const { id } = await params
    const body = schema.parse(await req.json())
    return NextResponse.json(await upsertCategoryRule(id, body))
  } catch (err) {
    return handleError(err)
  }
}
