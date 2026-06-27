import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleError } from '../../../../../lib/api-error'
import { verifyCustomerOtp } from '../../../../../lib/services/auth'

const schema = z.object({
  mobileNumber: z.string().regex(/^\d{10}$/, 'Mobile number must be 10 digits'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
})

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json())
    const result = await verifyCustomerOtp(body.mobileNumber, body.otp)
    return NextResponse.json(result)
  } catch (err) {
    return handleError(err)
  }
}
