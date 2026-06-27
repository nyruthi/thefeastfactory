import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleError } from '../../../../../../lib/api-error'
import { requireAdmin } from '../../../../../../lib/auth'
import { createVersion } from '../../../../../../lib/services/packages'

const createSchema = z.object({
  versionNo: z.number().int().positive(),
  basePricePerPlate: z.number().positive(),
  minGuestCount: z.number().int().positive().optional(),
  maxGuestCount: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().optional(),
  publishedAt: z.string().datetime().optional(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin(req)
  if (error) return error
  try {
    const { id } = await params
    const body = createSchema.parse(await req.json())
    return NextResponse.json(await createVersion(id, body), { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
