import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleError } from '../../../../../../lib/api-error'
import { requireAdmin } from '../../../../../../lib/auth'
import { addOrderNote, listOrderNotes } from '../../../../../../lib/services/operations'

const schema = z.object({ body: z.string().min(1).max(2000) })

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin(req)
  if (error) return error
  try {
    const { id } = await params
    return NextResponse.json(await listOrderNotes(id))
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, payload } = await requireAdmin(req)
  if (error) return error
  try {
    const { id } = await params
    const { body } = schema.parse(await req.json())
    return NextResponse.json(await addOrderNote(payload!.sub, id, body), { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
