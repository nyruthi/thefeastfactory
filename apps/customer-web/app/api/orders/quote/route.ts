import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleError } from '../../../../lib/api-error'
import { requireCustomer } from '../../../../lib/auth'
import { orderQuote } from '../../../../lib/services/orders'

const schema = z.object({
  eventId: z.string().uuid(),
  selectedItems: z.array(z.object({ categoryId: z.string().uuid(), menuItemId: z.string().uuid() })).min(1),
})

export async function POST(req: NextRequest) {
  const { error, payload } = await requireCustomer(req)
  if (error) return error
  try {
    const body = schema.parse(await req.json())
    return NextResponse.json(await orderQuote(payload!.sub, body))
  } catch (err) {
    return handleError(err)
  }
}
