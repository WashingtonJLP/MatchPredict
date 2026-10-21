import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { AvatarStorage } from './avatar-storage';

@Injectable()
export class R2AvatarStorage extends AvatarStorage {
  constructor(private readonly config: ConfigService) {
    super();
  }

  private settings() {
    const value = (name: string) => this.config.get<string>(name)?.trim() ?? '';
    const accountId = value('R2_ACCOUNT_ID');
    const accessKeyId = value('R2_ACCESS_KEY_ID');
    const secretAccessKey = value('R2_SECRET_ACCESS_KEY');
    const bucket = value('R2_BUCKET_NAME');
    const baseUrl = value('R2_PUBLIC_BASE_URL').replace(/\/+$/, '');
    let validUrl = false;
    try {
      const url = new URL(baseUrl);
      validUrl =
        url.protocol === 'https:' &&
        !url.username &&
        !url.password &&
        !url.search &&
        !url.hash;
    } catch {
      /* Configuration is checked only on explicit avatar actions. */
    }
    if (
      !/^[a-f0-9]{32}$/i.test(accountId) ||
      !accessKeyId ||
      !secretAccessKey ||
      !bucket ||
      !validUrl
    ) {
      throw new ServiceUnavailableException(
        'Fotos de perfil indisponíveis: configure o storage R2.',
      );
    }
    return {
      bucket,
      baseUrl,
      client: new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId, secretAccessKey },
        maxAttempts: 2,
        requestHandler: { connectionTimeout: 5000, requestTimeout: 30000 },
      }),
    };
  }

  async upload(key: string, body: Buffer, contentType: string) {
    const { client, bucket, baseUrl } = this.settings();
    try {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );
      return `${baseUrl}/${key}`;
    } catch {
      throw new ServiceUnavailableException(
        'Não foi possível enviar a foto. Tente novamente.',
      );
    } finally {
      client.destroy();
    }
  }

  async delete(key: string) {
    const { client, bucket } = this.settings();
    try {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    } finally {
      client.destroy();
    }
  }
}
