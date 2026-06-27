import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleError } from '../../../lib/api-error'
import { requireCustomer } from '../../../lib/auth'
import { createOrder, listOrders } from '../../../lib/services/orders'

const selectionSchema = z.object({
  eventId: z.string().uuid(),
  selectedItems: z.array(z.object({ categoryId: z.string().uuid(), menuItemId: z.string().uuid() })).min(1),
})

export async function GET(req: NextRequest) {
  const { error, payload } = await requireCustomer(req)
  if (error) return error
  try {
    return NextResponse.json(await listOrders(payload!.sub))
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(req: NextRequest) {
  const { error, payload } = await requireCustomer(req)
  if (error) return error
  try {
    const body = selectionSchema.parse(await req.json())
    return NextResponse.json(await createOrder(payload!.sub, body), { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
