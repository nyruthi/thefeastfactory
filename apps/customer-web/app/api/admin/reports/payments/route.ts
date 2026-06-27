import { NextRequest, NextResponse } from 'next/server'
import { handleError } from '../../../../../lib/api-error'
import { requireAdmin } from '../../../../../lib/auth'
import { paymentsReport } from '../../../../../lib/services/reports'

export async function GET(req: NextRequest) {
  const { error, payload } = await requireAdmin(req)
  if (error) return error
  try {
    const regionId = req.nextUrl.searchParams.get('regionId') ?? undefined
    return NextResponse.json(await paymentsReport(payload!, regionId))
  } catch (err) {
    return handleError(err)
  }
}
