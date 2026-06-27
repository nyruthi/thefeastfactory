import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleError } from '../../../../../lib/api-error'
import { requireCustomer } from '../../../../../lib/auth'
import { deleteAddress, updateAddress } from '../../../../../lib/services/users'

const updateSchema = z.object({
  addressType: z.enum(['HOME', 'OFFICE', 'EVENT_VENUE', 'OTHER']).optional(),
  label: z.string().max(50).optional(),
  addressLine1: z.string().min(1).max(255).optional(),
  addressLine2: z.string().max(255).optional(),
  city: z.string().min(1).max(100).optional(),
  state: z.string().min(1).max(100).optional(),
  pincode: z.string().regex(/^\d{6}$/).optional(),
  landmark: z.string().max(255).optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  isDefault: z.boolean().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, payload } = await requireCustomer(req)
  if (error) return error
  try {
    const { id } = await params
    const body = updateSchema.parse(await req.json())
    return NextResponse.json(await updateAddress(payload!.sub, id, body))
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, payload } = await requireCustomer(req)
  if (error) return error
  try {
    const { id } = await params
    return NextResponse.json(await deleteAddress(payload!.sub, id))
  } catch (err) {
    return handleError(err)
  }
}
