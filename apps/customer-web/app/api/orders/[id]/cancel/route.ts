import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleError } from '../../../../../lib/api-error'
import { requireCustomer } from '../../../../../lib/auth'
import { cancelOrder } from '../../../../../lib/services/orders'

const schema = z.object({ reason: z.string().max(500).optional() })

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, payload } = await requireCustomer(req)
  if (error) return error
  try {
    const { id } = await params
    const body = schema.parse(await req.json())
    return NextResponse.json(await cancelOrder(payload!.sub, id, body.reason))
  } catch (err) {
    return handleError(err)
  }
}
