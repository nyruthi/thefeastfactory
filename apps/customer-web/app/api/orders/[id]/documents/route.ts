import { NextRequest, NextResponse } from 'next/server'
import { handleError } from '../../../../../lib/api-error'
import { requireCustomer } from '../../../../../lib/auth'
import { listDocuments } from '../../../../../lib/services/operations'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, payload } = await requireCustomer(req)
  if (error) return error
  try {
    const { id } = await params
    return NextResponse.json(await listDocuments(payload!.sub, id))
  } catch (err) {
    return handleError(err)
  }
}
