import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { R2AvatarStorage } from './r2-avatar-storage';

describe('R2 storage (SDK mocked; no network)', () => {
  afterEach(() => jest.restoreAllMocks());
  it('starts without configuration and reports a controlled error on upload', async () => {
    const storage = new R2AvatarStorage(new ConfigService({}));
    await expect(
      storage.upload('key', Buffer.from('test'), 'image/png'),
    ).rejects.toMatchObject({ status: 503 });
  });
  it('uses explicit R2 credentials, content type, immutable URL and key deletion', async () => {
    const send = jest
      .spyOn(S3Client.prototype, 'send')
      .mockReturnValue(Promise.resolve({}) as never);
    const storage = new R2AvatarStorage(
      new ConfigService({
        R2_ACCOUNT_ID: 'a'.repeat(32),
        R2_ACCESS_KEY_ID: 'fake-key',
        R2_SECRET_ACCESS_KEY: 'fake-secret',
        R2_BUCKET_NAME: 'fake-bucket',
        R2_PUBLIC_BASE_URL: 'https://avatars.example.test/',
      }),
    );
    expect(
      await storage.upload(
        'avatars/test.png',
        Buffer.from('test'),
        'image/png',
      ),
    ).toBe('https://avatars.example.test/avatars/test.png');
    expect(send.mock.calls[0][0]).toBeInstanceOf(PutObjectCommand);
    expect((send.mock.calls[0][0] as PutObjectCommand).input).toMatchObject({
      Bucket: 'fake-bucket',
      Key: 'avatars/test.png',
      ContentType: 'image/png',
      CacheControl: 'public, max-age=31536000, immutable',
    });
    await storage.delete('avatars/test.png');
    expect(send.mock.calls[1][0]).toBeInstanceOf(DeleteObjectCommand);
  });
});
