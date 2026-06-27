import { NextRequest, NextResponse } from 'next/server'
import { handleError } from '../../../../../lib/api-error'
import { requireAdmin } from '../../../../../lib/auth'
import { readiness } from '../../../../../lib/services/operations'

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin(req)
  if (error) return error
  try {
    return NextResponse.json(readiness())
  } catch (err) {
    return handleError(err)
  }
}
