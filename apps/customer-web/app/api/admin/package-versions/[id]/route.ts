import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleError } from '../../../../../lib/api-error'
import { requireAdmin } from '../../../../../lib/auth'
import { updateVersion } from '../../../../../lib/services/packages'

const updateSchema = z.object({
  versionNo: z.number().int().positive().optional(),
  basePricePerPlate: z.number().positive().optional(),
  minGuestCount: z.number().int().positive().optional(),
  maxGuestCount: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().optional(),
  publishedAt: z.string().datetime().nullable().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin(req)
  if (error) return error
  try {
    const { id } = await params
    const body = updateSchema.parse(await req.json())
    return NextResponse.json(await updateVersion(id, body))
  } catch (err) {
    return handleError(err)
  }
}
