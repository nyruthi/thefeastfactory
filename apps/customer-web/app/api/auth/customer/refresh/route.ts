import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleError } from '../../../../../lib/api-error'
import { refreshSession } from '../../../../../lib/services/auth'

const schema = z.object({ refreshToken: z.string().min(1) })

export async function POST(req: NextRequest) {
  try {
    const { refreshToken } = schema.parse(await req.json())
    const result = await refreshSession(refreshToken, 'customer')
    return NextResponse.json(result)
  } catch (err) {
    return handleError(err)
  }
}
