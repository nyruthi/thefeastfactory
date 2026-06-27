import { NextRequest, NextResponse } from 'next/server'
import { handleError } from '../../../../../lib/api-error'
import { handleWebhook } from '../../../../../lib/services/payments'

export async function POST(req: NextRequest) {
  try {
    const rawBody = Buffer.from(await req.arrayBuffer())
    const payload = JSON.parse(rawBody.toString()) as Record<string, unknown>
    const signature = req.headers.get('x-razorpay-signature') ?? undefined
    const eventId = req.headers.get('x-razorpay-event-id') ?? undefined
    const result = await handleWebhook(rawBody, payload, signature, eventId)
    return NextResponse.json(result)
  } catch (err) {
    return handleError(err)
  }
}
