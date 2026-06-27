import { NextRequest, NextResponse } from 'next/server'
import { handleError } from '../../../../../../../../lib/api-error'
import { requireAdmin } from '../../../../../../../../lib/auth'
import { getDocumentPdf } from '../../../../../../../../lib/services/operations'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; documentId: string }> }) {
  const { error, payload } = await requireAdmin(req)
  if (error) return error
  try {
    const { id, documentId } = await params
    const { filename, buffer } = await getDocumentPdf(payload!.sub, id, documentId, true)
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (err) {
    return handleError(err)
  }
}
