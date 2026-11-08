import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { AvatarStorage } from './avatar-storage';

@Injectable()
export class CloudinaryAvatarStorage extends AvatarStorage {
  constructor(private readonly config: ConfigService) {
    super();
  }

  private settings() {
    const value = (name: string) => this.config.get<string>(name)?.trim() ?? '';
    const cloud_name = value('CLOUDINARY_CLOUD_NAME');
    const api_key = value('CLOUDINARY_API_KEY');
    const api_secret = value('CLOUDINARY_API_SECRET');
    if (!cloud_name || !api_key || !api_secret) {
      throw new ServiceUnavailableException(
        'Fotos de perfil indisponíveis: configure o storage Cloudinary.',
      );
    }
    // Explicit per-request credentials; never mutate the SDK's global config.
    return { cloud_name, api_key, api_secret, secure: true, timeout: 30_000 };
  }

  async upload(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<string> {
    const settings = this.settings();
    try {
      return await new Promise<string>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            ...settings,
            resource_type: 'image',
            type: 'upload',
            public_id: key,
            asset_folder: key.slice(0, key.lastIndexOf('/')),
            overwrite: false,
            allowed_formats: [
              contentType.replace('image/', '').replace('jpeg', 'jpg'),
            ],
          },
          (error, result) => {
            if (error) {
              reject(new Error('Cloudinary upload failed'));
              return;
            }
            if (!result || result.public_id !== key || result.existing) {
              reject(
                new Error(
                  !result
                    ? 'Cloudinary returned no upload result'
                    : result.public_id !== key
                      ? 'Cloudinary public_id differs from requested ID'
                      : 'Cloudinary reported an existing asset',
                ),
              );
              return;
            }
            try {
              const url = new URL(result.secure_url);
              if (url.protocol !== 'https:' || url.username || url.password) {
                throw new Error('Invalid avatar URL');
              }
              resolve(result.secure_url);
            } catch {
              reject(new Error('Invalid avatar URL'));
            }
          },
        );
        stream.once('error', reject);
        stream.end(body);
      });
    } catch {
      throw new ServiceUnavailableException(
        'Não foi possível enviar a foto. Tente novamente.',
      );
    }
  }

  async delete(key: string): Promise<void> {
    const settings = this.settings();
    try {
      const response: unknown = await cloudinary.uploader.destroy(key, {
        ...settings,
        resource_type: 'image',
        type: 'upload',
        invalidate: true,
      });
      if (
        !response ||
        typeof response !== 'object' ||
        !('result' in response) ||
        !['ok', 'not found'].includes(String(response.result))
      ) {
        throw new Error('Unexpected avatar deletion response');
      }
    } catch {
      throw new ServiceUnavailableException(
        'Não foi possível excluir a foto do storage.',
      );
    }
  }
}
