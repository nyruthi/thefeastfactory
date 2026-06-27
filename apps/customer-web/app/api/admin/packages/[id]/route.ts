import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleError } from '../../../../../lib/api-error'
import { requireAdmin } from '../../../../../lib/auth'
import { updatePackage } from '../../../../../lib/services/packages'

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin(req)
  if (error) return error
  try {
    const { id } = await params
    const body = updateSchema.parse(await req.json())
    return NextResponse.json(await updatePackage(id, body))
  } catch (err) {
    return handleError(err)
  }
}
