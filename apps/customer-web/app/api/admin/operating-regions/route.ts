import { NextRequest, NextResponse } from 'next/server'
import { handleError } from '../../../../lib/api-error'
import { requireAdmin } from '../../../../lib/auth'
import { listRegions } from '../../../../lib/services/operating-regions'

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin(req)
  if (error) return error
  try {
    const activeOnly = req.nextUrl.searchParams.get('activeOnly') === 'true'
    return NextResponse.json(await listRegions(activeOnly))
  } catch (err) {
    return handleError(err)
  }
}
