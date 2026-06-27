import { NextRequest, NextResponse } from 'next/server'
import { handleError } from '../../../../lib/api-error'
import { listCategories } from '../../../../lib/services/menu'

export async function GET(_req: NextRequest) {
  try {
    return NextResponse.json(await listCategories())
  } catch (err) {
    return handleError(err)
  }
}
