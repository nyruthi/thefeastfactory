import { NextRequest, NextResponse } from 'next/server'
import { handleError } from '../../../../../lib/api-error'
import { localFile } from '../../../../../lib/services/storage'
import { extname } from 'node:path'
import { Readable } from 'node:stream'

const mimeTypes: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  try {
    const { filename } = await params
    const stream = await localFile(filename)
    const ext = extname(filename).toLowerCase()
    const contentType = mimeTypes[ext] ?? 'application/octet-stream'
    const readable = Readable.toWeb(stream) as ReadableStream
    return new NextResponse(readable, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (err) {
    return handleError(err)
  }
}
