import { Storage } from '@google-cloud/storage'
import { createReadStream, promises as fs } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { extname, join, resolve } from 'node:path'

const allowedTypes = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
])

export type UploadedImage = {
  buffer: Buffer
  mimetype: string
  size: number
}

const localDirectory = resolve('.local-uploads/menu')

function matchesMagicBytes(buffer: Buffer, mimeType: string) {
  if (mimeType === 'image/jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8
  if (mimeType === 'image/png')
    return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  if (mimeType === 'image/webp')
    return buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP'
  return false
}

export async function uploadMenuImage(file?: UploadedImage) {
  if (!file) throw Object.assign(new Error('Image file is required'), { status: 400 })
  if (file.size > 5 * 1024 * 1024) throw Object.assign(new Error('Image must be 5 MB or smaller'), { status: 400 })
  const extension = allowedTypes.get(file.mimetype)
  if (!extension || !matchesMagicBytes(file.buffer, file.mimetype)) {
    throw Object.assign(new Error('Only valid JPEG, PNG, and WebP images are allowed'), { status: 400 })
  }

  const objectName = `menu/${randomUUID()}${extension}`
  const projectId = process.env.GCP_PROJECT_ID
  const bucketName = process.env.GCP_STORAGE_BUCKET

  if (projectId && bucketName) {
    const storage = new Storage({ projectId })
    const object = storage.bucket(bucketName).file(objectName)
    await object.save(file.buffer, {
      resumable: false,
      contentType: file.mimetype,
      metadata: { cacheControl: 'public, max-age=31536000, immutable' },
    })
    return {
      objectName,
      url: `https://storage.googleapis.com/${bucketName}/${objectName}`,
      provider: 'gcs',
    }
  }

  await fs.mkdir(localDirectory, { recursive: true })
  const filename = `${randomUUID()}${extension}`
  await fs.writeFile(join(localDirectory, filename), file.buffer, { flag: 'wx' })
  return {
    objectName: `menu/${filename}`,
    url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/uploads/menu/${filename}`,
    provider: 'local',
  }
}

export async function localFile(filename: string) {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '')
  if (!safeName || extname(safeName) === '') throw Object.assign(new Error('Image not found'), { status: 404 })
  const path = join(localDirectory, safeName)
  try {
    await fs.access(path)
  } catch {
    throw Object.assign(new Error('Image not found'), { status: 404 })
  }
  return createReadStream(path)
}
