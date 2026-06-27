import { NextRequest, NextResponse } from 'next/server'
import { handleError } from '../../../../../lib/api-error'
import { getActiveVersion } from '../../../../../lib/services/packages'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    return NextResponse.json(await getActiveVersion(id))
  } catch (err) {
    return handleError(err)
  }
}
