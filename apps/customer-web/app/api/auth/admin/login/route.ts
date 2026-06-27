import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleError } from '../../../../../lib/api-error'
import { loginAdmin } from '../../../../../lib/services/auth'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json())
    const result = await loginAdmin(body.email, body.password)
    return NextResponse.json(result)
  } catch (err) {
    return handleError(err)
  }
}
