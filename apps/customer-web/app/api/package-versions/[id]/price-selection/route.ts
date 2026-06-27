import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleError } from '../../../../../lib/api-error'
import { priceSelection } from '../../../../../lib/services/packages'

const schema = z.object({
  selectedItems: z.array(z.object({ categoryId: z.string().uuid(), menuItemId: z.string().uuid() })).min(1),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { selectedItems } = schema.parse(await req.json())
    return NextResponse.json(await priceSelection(id, selectedItems))
  } catch (err) {
    return handleError(err)
  }
}
