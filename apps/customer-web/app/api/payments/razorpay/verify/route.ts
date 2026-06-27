import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleError } from '../../../../../lib/api-error'
import { requireCustomer } from '../../../../../lib/auth'
import { verifyPayment } from '../../../../../lib/services/payments'

const schema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const { error, payload } = await requireCustomer(req)
  if (error) return error
  try {
    const body = schema.parse(await req.json())
    return NextResponse.json(await verifyPayment(payload!.sub, body))
  } catch (err) {
    return handleError(err)
  }
}
