import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleError } from '../../../../../../lib/api-error'
import { requireAdmin } from '../../../../../../lib/auth'
import { upsertItemPricing } from '../../../../../../lib/services/packages'

const schema = z.object({
  menuItemId: z.string().uuid(),
  itemPrice: z.number().nonnegative(),
  includedValue: z.number().nonnegative(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin(req)
  if (error) return error
  try {
    const { id } = await params
    const body = schema.parse(await req.json())
    return NextResponse.json(await upsertItemPricing(id, body))
  } catch (err) {
    return handleError(err)
  }
}
