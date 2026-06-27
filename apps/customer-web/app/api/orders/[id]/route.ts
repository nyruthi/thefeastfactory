import { NextRequest, NextResponse } from 'next/server'
import { handleError } from '../../../../lib/api-error'
import { requireCustomer } from '../../../../lib/auth'
import { getOrder } from '../../../../lib/services/orders'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, payload } = await requireCustomer(req)
  if (error) return error
  try {
    const { id } = await params
    return NextResponse.json(await getOrder(payload!.sub, id))
  } catch (err) {
    return handleError(err)
  }
}
