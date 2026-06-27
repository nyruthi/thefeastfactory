import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleError } from '../../../../lib/api-error'
import { requireCustomer } from '../../../../lib/auth'
import { deleteEvent, getEvent, updateEvent } from '../../../../lib/services/events'

const updateSchema = z.object({
  packageVersionId: z.string().uuid().optional(),
  addressId: z.string().uuid().optional(),
  eventName: z.string().max(200).optional(),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  eventTimeStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  guestCount: z.number().int().positive().optional(),
  specialNotes: z.string().max(1000).optional(),
})

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, payload } = await requireCustomer(req)
  if (error) return error
  try {
    const { id } = await params
    return NextResponse.json(await getEvent(payload!.sub, id))
  } catch (err) {
    return handleError(err)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, payload } = await requireCustomer(req)
  if (error) return error
  try {
    const { id } = await params
    const body = updateSchema.parse(await req.json())
    return NextResponse.json(await updateEvent(payload!.sub, id, body))
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, payload } = await requireCustomer(req)
  if (error) return error
  try {
    const { id } = await params
    return NextResponse.json(await deleteEvent(payload!.sub, id))
  } catch (err) {
    return handleError(err)
  }
}
