import { NextRequest, NextResponse } from 'next/server'
import { handleError } from '../../../../../lib/api-error'
import { requireAdmin } from '../../../../../lib/auth'
import { uploadMenuImage } from '../../../../../lib/services/storage'

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin(req)
  if (error) return error
  try {
    const formData = await req.formData()
    const file = formData.get('file')
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Image file is required' }, { status: 400 })
    }
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const result = await uploadMenuImage({
      buffer,
      mimetype: file.type,
      size: buffer.byteLength,
    })
    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
