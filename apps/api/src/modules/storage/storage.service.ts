import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';
import { createReadStream, promises as fs } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { extname, join, resolve } from 'node:path';

const allowedTypes = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
]);

export type UploadedImage = {
  buffer: Buffer;
  mimetype: string;
  size: number;
};

@Injectable()
export class StorageService {
  private readonly localDirectory = resolve('.local-uploads/menu');

  constructor(private readonly config: ConfigService) {}

  async uploadMenuImage(file?: UploadedImage) {
    if (!file) throw new BadRequestException('Image file is required');
    if (file.size > 5 * 1024 * 1024) throw new BadRequestException('Image must be 5 MB or smaller');
    const extension = allowedTypes.get(file.mimetype);
    if (!extension || !this.matchesMagicBytes(file.buffer, file.mimetype)) {
      throw new BadRequestException('Only valid JPEG, PNG, and WebP images are allowed');
    }

    const objectName = `menu/${randomUUID()}${extension}`;
    const projectId = this.config.get<string>('GCP_PROJECT_ID');
    const bucketName = this.config.get<string>('GCP_STORAGE_BUCKET');

    if (projectId && bucketName) {
      const storage = new Storage({ projectId });
      const object = storage.bucket(bucketName).file(objectName);
      await object.save(file.buffer, {
        resumable: false,
        contentType: file.mimetype,
        metadata: { cacheControl: 'public, max-age=31536000, immutable' },
      });
      return {
        objectName,
        url: `https://storage.googleapis.com/${bucketName}/${objectName}`,
        provider: 'gcs',
      };
    }

    await fs.mkdir(this.localDirectory, { recursive: true });
    const filename = `${randomUUID()}${extension}`;
    await fs.writeFile(join(this.localDirectory, filename), file.buffer, { flag: 'wx' });
    return {
      objectName: `menu/${filename}`,
      url: `${this.config.get<string>('API_PUBLIC_URL', 'http://localhost:4000')}/uploads/menu/${filename}`,
      provider: 'local',
    };
  }

  async localFile(filename: string) {
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '');
    if (!safeName || extname(safeName) === '') throw new NotFoundException('Image not found');
    const path = join(this.localDirectory, safeName);
    try {
      await fs.access(path);
    } catch {
      throw new NotFoundException('Image not found');
    }
    return createReadStream(path);
  }

  private matchesMagicBytes(buffer: Buffer, mimeType: string) {
    if (mimeType === 'image/jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8;
    if (mimeType === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    if (mimeType === 'image/webp') {
      return buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP';
    }
    return false;
  }
}
