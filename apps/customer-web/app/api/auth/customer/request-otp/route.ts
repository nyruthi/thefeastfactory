import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleError } from '../../../../../lib/api-error'
import { requestCustomerOtp } from '../../../../../lib/services/auth'

const schema = z.object({
  mobileNumber: z.string().regex(/^\d{10}$/, 'Mobile number must be 10 digits'),
})

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json())
    const result = await requestCustomerOtp(body.mobileNumber)
    return NextResponse.json(result)
  } catch (err) {
    return handleError(err)
  }
}
