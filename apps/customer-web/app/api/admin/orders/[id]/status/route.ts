import { OrderStatus } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleError } from '../../../../../../lib/api-error'
import { requireAdmin } from '../../../../../../lib/auth'
import { updateOrderStatus } from '../../../../../../lib/services/admin-orders'

const schema = z.object({
  status: z.nativeEnum(OrderStatus),
  notes: z.string().max(500).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, payload } = await requireAdmin(req)
  if (error) return error
  try {
    const { id } = await params
    const body = schema.parse(await req.json())
    return NextResponse.json(await updateOrderStatus(payload!, id, body.status, body.notes))
  } catch (err) {
    return handleError(err)
  }
}
