import { NextRequest, NextResponse } from 'next/server'
import { handleError } from '../../../../../lib/api-error'
import { requireAdmin } from '../../../../../lib/auth'
import { getCalendar } from '../../../../../lib/services/operations'

export async function GET(req: NextRequest) {
  const { error, payload } = await requireAdmin(req)
  if (error) return error
  try {
    const { searchParams } = req.nextUrl
    return NextResponse.json(await getCalendar(
      payload!,
      searchParams.get('from') ?? undefined,
      searchParams.get('to') ?? undefined,
      searchParams.get('regionId') ?? undefined,
      searchParams.get('city') ?? undefined,
    ))
  } catch (err) {
    return handleError(err)
  }
}
