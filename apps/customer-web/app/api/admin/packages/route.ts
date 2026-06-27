import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleError } from '../../../../lib/api-error'
import { requireAdmin } from '../../../../lib/auth'
import { createPackage, listAdminPackages } from '../../../../lib/services/packages'

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin(req)
  if (error) return error
  try {
    return NextResponse.json(await listAdminPackages())
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin(req)
  if (error) return error
  try {
    const body = createSchema.parse(await req.json())
    return NextResponse.json(await createPackage(body), { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
