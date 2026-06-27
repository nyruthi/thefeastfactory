import { NextRequest, NextResponse } from 'next/server'
import { handleError } from '../../../../../lib/api-error'
import { getItem } from '../../../../../lib/services/menu'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    return NextResponse.json(await getItem(id))
  } catch (err) {
    return handleError(err)
  }
}
