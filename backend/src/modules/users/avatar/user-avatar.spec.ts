import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { Server } from 'node:http';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { JwtStrategy } from '../../auth/strategies/jwt.strategy';
import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';
import { AvatarStorage } from './avatar-storage';
import { UserAvatarService } from './user-avatar.service';
import { AVATAR_MAX_BYTES } from './avatar-validation';

const userId = '11111111-1111-4111-8111-111111111111';
const oldKey = `avatars/${userId}/22222222-2222-4222-8222-222222222222.png`;
const oldUrl = 'https://avatars.example.test/old.png';
const png = Buffer.from('89504e470d0a1a0a00000000', 'hex');

describe('Authenticated avatar HTTP flow (fake storage and database)', () => {
  let app: INestApplication;
  let token: string;
  let server: Server;
  let state: { avatarKey: string | null; avatarUrl: string | null };
  const prisma = { user: { findUnique: jest.fn(), updateMany: jest.fn() } };
  const storage = { upload: jest.fn(), delete: jest.fn() };

  beforeAll(async () => {
    const secret = 'avatar-test-only-secret-never-production';
    const module = await Test.createTestingModule({
      imports: [PassportModule],
      controllers: [UsersController],
      providers: [
        UserAvatarService,
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: new ConfigService({ JWT_SECRET: secret }),
        },
        { provide: PrismaService, useValue: prisma },
        { provide: AvatarStorage, useValue: storage },
        {
          provide: UsersService,
          useValue: {
            findAuthStateById: jest.fn().mockResolvedValue({
              id: userId,
              name: 'Washington Junio',
              role: 'USER',
              authVersion: 0,
              disabledAt: null,
            }),
          },
        },
      ],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
    server = app.getHttpServer() as Server;
    token = new JwtService({ secret }).sign({ sub: userId, authVersion: 0 });
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(() => {
    jest.clearAllMocks();
    state = { avatarKey: oldKey, avatarUrl: oldUrl };
    prisma.user.findUnique.mockImplementation(() =>
      Promise.resolve({ ...state }),
    );
    prisma.user.updateMany.mockImplementation(
      ({ data }: { data: typeof state }) => {
        state = { ...data };
        return Promise.resolve({ count: 1 });
      },
    );
    storage.upload.mockImplementation((key: string) =>
      Promise.resolve(`https://avatars.example.test/${key}`),
    );
    storage.delete.mockResolvedValue(undefined);
  });
  const put = () =>
    request(server)
      .put('/api/v1/users/me/avatar')
      .auth(token, { type: 'bearer' });
  const remove = () =>
    request(server)
      .delete('/api/v1/users/me/avatar')
      .auth(token, { type: 'bearer' });

  it.each([
    ['image/png', png, 'png'],
    ['image/jpeg', Buffer.from('ffd8ffe000000000', 'hex'), 'jpg'],
    ['image/webp', Buffer.from('RIFF0000WEBP0000'), 'webp'],
  ])(
    'accepts authenticated %s and replaces only own reference',
    async (contentType, body, extension) => {
      const response = await put()
        .attach('file', body, { filename: '../../other-user.png', contentType })
        .expect(200);
      expect(response.body.avatarUrl).toMatch(
        new RegExp(`avatars/${userId}/[a-f0-9-]+\\.${extension}$`),
      );
      expect(Object.keys(response.body as object)).toEqual(['avatarUrl']);
      expect(prisma.user.updateMany.mock.calls[0][0].where).toEqual({
        id: userId,
        avatarKey: oldKey,
        avatarUrl: oldUrl,
      });
      expect(storage.delete).toHaveBeenCalledWith(oldKey);
      expect(state.avatarUrl).toBe(response.body.avatarUrl);
    },
  );
  it('requires JWT on upload and removal', async () => {
    await request(server)
      .put('/api/v1/users/me/avatar')
      .attach('file', png, 'test.png')
      .expect(401);
    await request(server).delete('/api/v1/users/me/avatar').expect(401);
    expect(storage.upload).not.toHaveBeenCalled();
  });
  it('rejects an invalid JWT', async () => {
    await request(server)
      .delete('/api/v1/users/me/avatar')
      .auth('invalid', { type: 'bearer' })
      .expect(401);
  });
  it('has no arbitrary user route and rejects multipart userId', async () => {
    await request(server)
      .put('/api/v1/users/someone-else/avatar')
      .auth(token, { type: 'bearer' })
      .attach('file', png, 'test.png')
      .expect(404);
    await put()
      .field('userId', 'someone-else')
      .attach('file', png, 'test.png')
      .expect(400);
    expect(storage.upload).not.toHaveBeenCalled();
  });
  it.each([
    ['text/plain', png],
    ['image/png', Buffer.from('<script>alert(1)</script>')],
    ['image/svg+xml', Buffer.from('<svg/>')],
  ])('rejects MIME/content %s', async (contentType, body) => {
    await put()
      .attach('file', body, { filename: 'test.png', contentType })
      .expect(400);
    expect(storage.upload).not.toHaveBeenCalled();
  });
  it('rejects missing, empty and oversized files', async () => {
    await put().expect(400);
    await put().attach('file', Buffer.alloc(0), 'test.png').expect(400);
    await put()
      .attach('file', Buffer.alloc(AVATAR_MAX_BYTES + 1), 'test.png')
      .expect(413);
    expect(storage.upload).not.toHaveBeenCalled();
  });
  it('preserves existing avatar when upload fails', async () => {
    const { ServiceUnavailableException } = await import('@nestjs/common');
    storage.upload.mockRejectedValueOnce(
      new ServiceUnavailableException('Storage unavailable'),
    );
    await put().attach('file', png, 'test.png').expect(503);
    expect(state.avatarUrl).toBe(oldUrl);
    expect(prisma.user.updateMany).not.toHaveBeenCalled();
    expect(storage.delete).not.toHaveBeenCalled();
  });
  it('cleans new object if database write fails', async () => {
    prisma.user.updateMany.mockResolvedValueOnce({ count: 0 });
    await put().attach('file', png, 'test.png').expect(409);
    expect(storage.delete).toHaveBeenCalledWith(
      storage.upload.mock.calls[0][0],
    );
    expect(state.avatarUrl).toBe(oldUrl);
  });
  it('keeps new avatar even if old object deletion fails', async () => {
    storage.delete.mockRejectedValueOnce(new Error('fake deletion error'));
    await put().attach('file', png, 'test.png').expect(200);
    expect(state.avatarUrl).not.toBe(oldUrl);
  });
  it('cleans new upload when database throws without deleting previous object', async () => {
    prisma.user.updateMany.mockRejectedValueOnce(
      new Error('fake database failure'),
    );
    await put().attach('file', png, 'test.png').expect(500);
    expect(storage.delete).toHaveBeenCalledWith(
      storage.upload.mock.calls[0][0],
    );
    expect(storage.delete).not.toHaveBeenCalledWith(oldKey);
    expect(state.avatarUrl).toBe(oldUrl);
  });
  it('preserves concurrent replacement during removal', async () => {
    prisma.user.updateMany.mockResolvedValueOnce({ count: 0 });
    await remove().expect(409);
    expect(storage.delete).not.toHaveBeenCalled();
    expect(state.avatarUrl).toBe(oldUrl);
  });
  it('removes immediately and is idempotent with null fallback', async () => {
    await remove().expect(200, { avatarUrl: null });
    expect(state).toEqual({ avatarKey: null, avatarUrl: null });
    expect(storage.delete).toHaveBeenCalledWith(oldKey);
    await remove().expect(200, { avatarUrl: null });
    expect(storage.delete).toHaveBeenCalledTimes(1);
  });
  it('removes reference even if storage deletion fails', async () => {
    storage.delete.mockRejectedValueOnce(new Error('fake failure'));
    await remove().expect(200, { avatarUrl: null });
    expect(state.avatarUrl).toBeNull();
  });
  it('never deletes another user object or a legacy URL', async () => {
    state.avatarKey = 'avatars/33333333-3333-4333-8333-333333333333/file.png';
    await remove().expect(200);
    state = { avatarKey: null, avatarUrl: oldUrl };
    await remove().expect(200);
    expect(storage.delete).not.toHaveBeenCalled();
  });
});
