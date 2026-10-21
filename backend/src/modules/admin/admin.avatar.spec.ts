import {
  INestApplication,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AdminAuditAction, Role } from '@prisma/client';
import { agent } from 'supertest';
import { Server } from 'node:http';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UsersService } from '../users/users.service';
import { AvatarStorage } from '../users/avatar/avatar-storage';
import { UserAvatarService } from '../users/avatar/user-avatar.service';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

const adminId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';
const key = `avatars/${userId}/33333333-3333-4333-8333-333333333333.png`;
const url = 'https://avatars.example.test/photo.png';
const path = `/api/v1/admin/users/${userId}/avatar`;
type State = {
  avatarKey: string | null;
  avatarUrl: string | null;
  name: string;
  email: string;
  role: Role;
  disabledAt: null;
};

describe('Admin avatar moderation (real JWT/role guards, fake database/storage)', () => {
  let app: INestApplication;
  let server: Server;
  let adminToken: string;
  let userToken: string;
  let state: State;
  let committedAudits: unknown[];
  let warn: jest.SpyInstance;
  const storage = { upload: jest.fn(), delete: jest.fn() };
  const prisma = {
    user: { findUnique: jest.fn(), updateMany: jest.fn() },
    adminAuditLog: { create: jest.fn() },
    $transaction: jest.fn(),
  };

  beforeAll(async () => {
    const secret = 'fake-admin-avatar-test-secret';
    const module = await Test.createTestingModule({
      imports: [PassportModule],
      controllers: [AdminController],
      providers: [
        UserAvatarService,
        JwtStrategy,
        RolesGuard,
        { provide: AdminService, useValue: {} },
        {
          provide: ConfigService,
          useValue: new ConfigService({ JWT_SECRET: secret }),
        },
        { provide: PrismaService, useValue: prisma },
        { provide: AvatarStorage, useValue: storage },
        {
          provide: UsersService,
          useValue: {
            findAuthStateById: jest.fn().mockImplementation((id: string) =>
              Promise.resolve({
                id,
                role: id === adminId ? Role.ADMIN : Role.USER,
                authVersion: 0,
                disabledAt: null,
              }),
            ),
          },
        },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();
    app = module.createNestApplication();
    app.useLogger(false);
    app.setGlobalPrefix('api/v1');
    await app.init();
    server = app.getHttpServer() as Server;
    const jwt = new JwtService({ secret });
    adminToken = jwt.sign({ sub: adminId, authVersion: 0 });
    userToken = jwt.sign({ sub: userId, authVersion: 0 });
  });
  afterAll(() => app.close());
  beforeEach(() => {
    jest.clearAllMocks();
    state = {
      avatarKey: key,
      avatarUrl: url,
      name: 'Ana Silva',
      email: 'fake@example.test',
      role: Role.USER,
      disabledAt: null,
    };
    committedAudits = [];
    warn = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    prisma.user.findUnique.mockImplementation(() =>
      Promise.resolve({
        avatarKey: state.avatarKey,
        avatarUrl: state.avatarUrl,
      }),
    );
    prisma.user.updateMany.mockImplementation(
      ({ data }: { data: Pick<State, 'avatarKey' | 'avatarUrl'> }) => {
        Object.assign(state, data);
        return Promise.resolve({ count: 1 });
      },
    );
    prisma.adminAuditLog.create.mockImplementation((input: unknown) => {
      committedAudits.push(input);
      return Promise.resolve({});
    });
    prisma.$transaction.mockImplementation(
      async (operation: (tx: unknown) => Promise<unknown>) => {
        const before = { ...state };
        const logsBefore = [...committedAudits];
        try {
          return await operation(prisma);
        } catch (error) {
          state = before;
          committedAudits = logsBefore;
          throw error;
        }
      },
    );
    storage.delete.mockResolvedValue(undefined);
  });
  afterEach(() => warn.mockRestore());
  const remove = () =>
    agent(server).delete(path).auth(adminToken, { type: 'bearer' });

  it('allows ADMIN, changes only avatar fields and audits before storage deletion', async () => {
    const before = { ...state };
    storage.delete.mockImplementationOnce(() => {
      expect(state.avatarUrl).toBeNull();
      expect(committedAudits).toHaveLength(1);
      return Promise.resolve();
    });
    await remove().expect(200, { avatarUrl: null });
    expect(state).toEqual({ ...before, avatarUrl: null, avatarKey: null });
    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: userId, avatarUrl: url, avatarKey: key },
      data: { avatarUrl: null, avatarKey: null },
    });
    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith({
      data: {
        adminUserId: adminId,
        action: AdminAuditAction.USER_AVATAR_REMOVED,
        targetType: 'USER',
        targetId: userId,
        metadata: { hadAvatar: true },
      },
    });
    expect(storage.delete).toHaveBeenCalledWith(key);
    expect(storage.upload).not.toHaveBeenCalled();
  });
  it('rejects unauthenticated, invalid JWT and USER requests before querying target', async () => {
    await agent(server).delete(path).expect(401);
    await agent(server)
      .delete(path)
      .auth('invalid', { type: 'bearer' })
      .expect(401);
    await agent(server)
      .delete(path)
      .auth(userToken, { type: 'bearer' })
      .expect(403);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.adminAuditLog.create).not.toHaveBeenCalled();
  });
  it('rejects invalid target UUID', async () => {
    await agent(server)
      .delete('/api/v1/admin/users/invalid/avatar')
      .auth(adminToken, { type: 'bearer' })
      .expect(400);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
  it('returns 404 for missing user without any mutation', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);
    await remove().expect(404);
    expect(prisma.user.updateMany).not.toHaveBeenCalled();
    expect(storage.delete).not.toHaveBeenCalled();
    expect(committedAudits).toEqual([]);
  });
  it('is idempotent without avatar and audits each successful administrative action', async () => {
    state.avatarKey = null;
    state.avatarUrl = null;
    await remove().expect(200, { avatarUrl: null });
    await remove().expect(200, { avatarUrl: null });
    expect(prisma.user.updateMany).not.toHaveBeenCalled();
    expect(storage.delete).not.toHaveBeenCalled();
    expect(committedAudits).toHaveLength(2);
    expect(prisma.adminAuditLog.create.mock.calls[0][0].data.metadata).toEqual({
      hadAvatar: false,
    });
  });
  it('keeps reference removed and audit committed when storage fails, and logs the failure', async () => {
    storage.delete.mockRejectedValueOnce(new Error('fake R2 failure'));
    await remove().expect(200, { avatarUrl: null });
    expect(state.avatarKey).toBeNull();
    expect(state.avatarUrl).toBeNull();
    expect(committedAudits).toHaveLength(1);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(storage.delete).toHaveBeenCalledTimes(1);
  });
  it('rolls back reference removal when audit write fails and never touches storage', async () => {
    prisma.adminAuditLog.create.mockRejectedValueOnce(
      new ServiceUnavailableException('fake audit failure'),
    );
    await remove().expect(503);
    expect(state.avatarUrl).toBe(url);
    expect(state.avatarKey).toBe(key);
    expect(storage.delete).not.toHaveBeenCalled();
    expect(committedAudits).toEqual([]);
  });
  it('does not delete storage or audit when database update fails', async () => {
    prisma.user.updateMany.mockRejectedValueOnce(
      new ServiceUnavailableException('fake database failure'),
    );
    await remove().expect(503);
    expect(state.avatarUrl).toBe(url);
    expect(storage.delete).not.toHaveBeenCalled();
    expect(prisma.adminAuditLog.create).not.toHaveBeenCalled();
  });
  it('preserves a concurrent avatar replacement', async () => {
    prisma.user.updateMany.mockResolvedValueOnce({ count: 0 });
    await remove().expect(409);
    expect(state.avatarUrl).toBe(url);
    expect(storage.delete).not.toHaveBeenCalled();
    expect(prisma.adminAuditLog.create).not.toHaveBeenCalled();
  });
  it('never deletes a foreign persisted key or guesses a key from a legacy URL', async () => {
    state.avatarKey = `avatars/${adminId}/33333333-3333-4333-8333-333333333333.png`;
    await remove().expect(200);
    state.avatarKey = null;
    state.avatarUrl = url;
    await remove().expect(200);
    expect(storage.delete).not.toHaveBeenCalled();
  });
  it('rejects client keys, query parameters and multipart files', async () => {
    await remove().send({ avatarKey: 'avatars/other/key.png' }).expect(400);
    await remove().query({ avatarKey: key }).expect(400);
    await remove()
      .attach('file', Buffer.from('fake image'), 'photo.png')
      .expect(400);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(storage.delete).not.toHaveBeenCalled();
  });
  it.each(['put', 'post'] as const)(
    'has no administrative %s upload endpoint',
    async (method) => {
      await agent(server)
        [method](path)
        .auth(adminToken, { type: 'bearer' })
        .attach('file', Buffer.from('fake'), 'photo.png')
        .expect(404);
      expect(storage.upload).not.toHaveBeenCalled();
    },
  );
});
