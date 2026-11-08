import { ConfigService } from '@nestjs/config';
import { Writable } from 'node:stream';
import {
  v2 as cloudinary,
  UploadApiOptions,
  UploadApiResponse,
  UploadApiErrorResponse,
} from 'cloudinary';
import { CloudinaryAvatarStorage } from './cloudinary-avatar-storage';

jest.mock('cloudinary', () => ({
  v2: { uploader: { upload_stream: jest.fn(), destroy: jest.fn() } },
}));

const key =
  'matchpredict/avatars/11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222';
const secureUrl = `https://res.cloudinary.com/fake-cloud/image/upload/v123/${key}.png`;
const settings = {
  CLOUDINARY_CLOUD_NAME: 'fake-cloud',
  CLOUDINARY_API_KEY: 'fake-api-key',
  CLOUDINARY_API_SECRET: 'fake-api-secret',
};
const uploadStream = cloudinary.uploader.upload_stream as jest.Mock;
const destroy = cloudinary.uploader.destroy as jest.Mock;
type Callback = (
  error?: UploadApiErrorResponse,
  result?: UploadApiResponse,
) => void;

describe('Cloudinary avatar storage (SDK mocked; no network)', () => {
  let storage: CloudinaryAvatarStorage;
  let chunks: Buffer[];
  let result: Partial<UploadApiResponse> | undefined;

  beforeEach(() => {
    jest.resetAllMocks();
    storage = new CloudinaryAvatarStorage(new ConfigService(settings));
    chunks = [];
    result = { public_id: key, secure_url: secureUrl };
    uploadStream.mockImplementation(
      (_options: UploadApiOptions, callback: Callback) =>
        new Writable({
          write(chunk: Buffer, _encoding, done) {
            chunks.push(chunk);
            done();
          },
          final(done) {
            callback(undefined, result as UploadApiResponse | undefined);
            done();
          },
        }),
    );
    destroy.mockResolvedValue({ result: 'ok' });
  });
  afterEach(() => jest.restoreAllMocks());

  it.each(Object.keys(settings))(
    'requires %s only when an action is requested',
    async (name) => {
      storage = new CloudinaryAvatarStorage(
        new ConfigService({ ...settings, [name]: ' ' }),
      );
      await expect(
        storage.upload(key, Buffer.from('test'), 'image/png'),
      ).rejects.toMatchObject({ status: 503 });
      await expect(storage.delete(key)).rejects.toMatchObject({ status: 503 });
      expect(uploadStream).not.toHaveBeenCalled();
      expect(destroy).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['image/png', 'png'],
    ['image/jpeg', 'jpg'],
    ['image/webp', 'webp'],
  ])(
    'uploads the buffer as %s with authenticated options and returns secure_url',
    async (mime, format) => {
      const body = Buffer.from('fake image bytes');
      await expect(storage.upload(key, body, mime)).resolves.toBe(secureUrl);
      expect(Buffer.concat(chunks)).toEqual(body);
      expect(uploadStream).toHaveBeenCalledWith(
        {
          cloud_name: 'fake-cloud',
          api_key: 'fake-api-key',
          api_secret: 'fake-api-secret',
          secure: true,
          timeout: 30_000,
          resource_type: 'image',
          type: 'upload',
          public_id: key,
          asset_folder: key.slice(0, key.lastIndexOf('/')),
          overwrite: false,
          allowed_formats: [format],
        },
        expect.any(Function),
      );
    },
  );

  it.each([
    undefined,
    { public_id: 'another-user/image', secure_url: secureUrl },
    { public_id: key, secure_url: 'http://example.test/image.png' },
    { public_id: key, secure_url: 'invalid' },
    { public_id: key },
    { public_id: key, secure_url: secureUrl, existing: true },
  ])(
    'rejects an invalid upload response or existing asset (%j)',
    async (response) => {
      result = response;
      await expect(
        storage.upload(key, Buffer.from('test'), 'image/png'),
      ).rejects.toMatchObject({ status: 503 });
      expect(destroy).not.toHaveBeenCalled();
    },
  );

  it('sanitizes upload callback errors', async () => {
    uploadStream.mockImplementation(
      (_options: UploadApiOptions, callback: Callback) =>
        new Writable({
          write(_chunk, _encoding, done) {
            callback({
              name: 'Error',
              message: 'fake sensitive SDK details',
              http_code: 401,
            });
            done();
          },
        }),
    );
    await expect(
      storage.upload(key, Buffer.from('test'), 'image/png'),
    ).rejects.toThrow('Não foi possível enviar a foto. Tente novamente.');
  });

  it('handles stream errors', async () => {
    uploadStream.mockReturnValue(
      new Writable({
        write(_chunk, _encoding, done) {
          done(new Error('fake stream failure'));
        },
      }),
    );
    await expect(
      storage.upload(key, Buffer.from('test'), 'image/png'),
    ).rejects.toMatchObject({ status: 503 });
  });

  it('handles synchronous SDK failures', async () => {
    uploadStream.mockImplementation(() => {
      throw new Error('fake SDK failure');
    });
    await expect(
      storage.upload(key, Buffer.from('test'), 'image/png'),
    ).rejects.toMatchObject({ status: 503 });
  });

  it.each(['ok', 'not found'])(
    'deletes the exact public_id with CDN invalidation (%s)',
    async (result) => {
      destroy.mockResolvedValue({ result });
      await expect(storage.delete(key)).resolves.toBeUndefined();
      expect(destroy).toHaveBeenCalledWith(key, {
        cloud_name: 'fake-cloud',
        api_key: 'fake-api-key',
        api_secret: 'fake-api-secret',
        secure: true,
        timeout: 30_000,
        resource_type: 'image',
        type: 'upload',
        invalidate: true,
      });
    },
  );

  it.each([undefined, {}, { result: 'error' }])(
    'rejects unsuccessful deletion responses (%j)',
    async (result) => {
      destroy.mockResolvedValue(result);
      await expect(storage.delete(key)).rejects.toMatchObject({ status: 503 });
    },
  );

  it('sanitizes deletion errors', async () => {
    destroy.mockRejectedValue(new Error('fake sensitive SDK details'));
    await expect(storage.delete(key)).rejects.toThrow(
      'Não foi possível excluir a foto do storage.',
    );
  });
});
