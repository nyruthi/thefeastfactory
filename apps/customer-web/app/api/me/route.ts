import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleError } from '../../../lib/api-error'
import { requireCustomer } from '../../../lib/auth'
import { getProfile, updateProfile } from '../../../lib/services/users'

export async function GET(req: NextRequest) {
  const { error, payload } = await requireCustomer(req)
  if (error) return error
  try {
    return NextResponse.json(await getProfile(payload!.sub))
  } catch (err) {
    return handleError(err)
  }
}

const updateSchema = z.object({
  name: z.string().max(100).optional(),
  email: z.string().email().max(255).optional(),
})

export async function PATCH(req: NextRequest) {
  const { error, payload } = await requireCustomer(req)
  if (error) return error
  try {
    const body = updateSchema.parse(await req.json())
    return NextResponse.json(await updateProfile(payload!.sub, body))
  } catch (err) {
    return handleError(err)
  }
}
