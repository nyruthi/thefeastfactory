import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleError } from '../../../lib/api-error'
import { requireCustomer } from '../../../lib/auth'
import { createEvent, listEvents } from '../../../lib/services/events'

const createSchema = z.object({
  packageVersionId: z.string().uuid(),
  addressId: z.string().uuid(),
  eventName: z.string().max(200).optional(),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  eventTimeStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  guestCount: z.number().int().positive(),
  specialNotes: z.string().max(1000).optional(),
})

export async function GET(req: NextRequest) {
  const { error, payload } = await requireCustomer(req)
  if (error) return error
  try {
    return NextResponse.json(await listEvents(payload!.sub))
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(req: NextRequest) {
  const { error, payload } = await requireCustomer(req)
  if (error) return error
  try {
    const body = createSchema.parse(await req.json())
    return NextResponse.json(await createEvent(payload!.sub, body), { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
