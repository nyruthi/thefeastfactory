import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleError } from '../../../../../../lib/api-error'
import { requireAdmin } from '../../../../../../lib/auth'
import { adminRefund } from '../../../../../../lib/services/admin-orders'

const schema = z.object({
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid decimal'),
  reason: z.string().max(500).optional(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, payload } = await requireAdmin(req)
  if (error) return error
  try {
    const { id } = await params
    const body = schema.parse(await req.json())
    return NextResponse.json(await adminRefund(payload!, id, body.amount, body.reason), { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
