import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleError } from '../../../../lib/api-error'
import { requireCustomer } from '../../../../lib/auth'
import { createAddress, listAddresses } from '../../../../lib/services/users'

const addressSchema = z.object({
  addressType: z.enum(['HOME', 'OFFICE', 'EVENT_VENUE', 'OTHER']).optional(),
  label: z.string().max(50).optional(),
  addressLine1: z.string().min(1).max(255),
  addressLine2: z.string().max(255).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  landmark: z.string().max(255).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isDefault: z.boolean().optional(),
})

export async function GET(req: NextRequest) {
  const { error, payload } = await requireCustomer(req)
  if (error) return error
  try {
    return NextResponse.json(await listAddresses(payload!.sub))
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(req: NextRequest) {
  const { error, payload } = await requireCustomer(req)
  if (error) return error
  try {
    const body = addressSchema.parse(await req.json())
    return NextResponse.json(await createAddress(payload!.sub, body), { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
