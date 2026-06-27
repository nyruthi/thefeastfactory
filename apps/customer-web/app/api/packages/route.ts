import { NextRequest, NextResponse } from 'next/server'
import { handleError } from '../../../lib/api-error'
import { listPackages } from '../../../lib/services/packages'

export async function GET(_req: NextRequest) {
  try {
    return NextResponse.json(await listPackages())
  } catch (err) {
    return handleError(err)
  }
}
