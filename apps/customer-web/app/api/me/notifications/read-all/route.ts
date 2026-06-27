import { NextRequest, NextResponse } from 'next/server'
import { handleError } from '../../../../../lib/api-error'
import { requireCustomer } from '../../../../../lib/auth'
import { markAllNotificationsRead } from '../../../../../lib/services/operations'

export async function POST(req: NextRequest) {
  const { error, payload } = await requireCustomer(req)
  if (error) return error
  try {
    return NextResponse.json(await markAllNotificationsRead(payload!.sub))
  } catch (err) {
    return handleError(err)
  }
}
