import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleError } from '../../../../lib/api-error'
import { requireAdmin } from '../../../../lib/auth'
import { listSettings, updateSettings } from '../../../../lib/services/operations'

const updateSchema = z.object({
  settings: z.array(z.object({ key: z.string().min(1), value: z.string() })).min(1),
})

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin(req)
  if (error) return error
  try {
    return NextResponse.json(await listSettings())
  } catch (err) {
    return handleError(err)
  }
}

export async function PATCH(req: NextRequest) {
  const { error } = await requireAdmin(req, 'ADMIN')
  if (error) return error
  try {
    const { settings } = updateSchema.parse(await req.json())
    return NextResponse.json(await updateSettings(settings))
  } catch (err) {
    return handleError(err)
  }
}
