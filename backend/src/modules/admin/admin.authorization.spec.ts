import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import { agent } from 'supertest';
import { App } from 'supertest/types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';

const targetId = '22222222-2222-4222-8222-222222222222';

@Injectable()
class HeaderJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: unknown;
    }>();
    const token = request.headers.authorization;

    if (
      !token ||
      token === 'Bearer invalid' ||
      token === 'Bearer expired' ||
      token === 'Bearer missing-user' ||
      token === 'Bearer disabled'
    ) {
      throw new UnauthorizedException();
    }

    request.user = {
      id: '11111111-1111-4111-8111-111111111111',
      role: token === 'Bearer admin' ? Role.ADMIN : Role.USER,
    };
    return true;
  }
}

describe('AdminController authorization', () => {
  let app: INestApplication;
  const adminService = {
    getDashboard: jest.fn().mockResolvedValue({ ok: true }),
    getPeriods: jest.fn().mockResolvedValue([]),
    getUsers: jest.fn().mockResolvedValue({ data: [], meta: {} }),
    getUserDeletionImpact: jest.fn().mockResolvedValue({ canDelete: false }),
    getUser: jest.fn().mockResolvedValue({ id: targetId }),
    deleteUser: jest.fn().mockResolvedValue({ message: 'ok' }),
    disableUser: jest.fn().mockResolvedValue({ id: targetId }),
    reactivateUser: jest.fn().mockResolvedValue({ id: targetId }),
    getPayments: jest.fn().mockResolvedValue({ data: [], meta: {} }),
    getParticipations: jest.fn().mockResolvedValue({ data: [], meta: {} }),
    getFinancialReviews: jest.fn().mockResolvedValue({ data: [], meta: {} }),
    getAuditLogs: jest.fn().mockResolvedValue({ data: [], meta: {} }),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        RolesGuard,
        { provide: AdminService, useValue: adminService },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(JwtAuthGuard)
      .useClass(HeaderJwtGuard)
      .compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(() => app.close());

  it('autentica e autoriza antes de consumir o rate limit administrativo', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, AdminController)).toEqual([
      JwtAuthGuard,
      RolesGuard,
      ThrottlerGuard,
    ]);
    expect(Reflect.getMetadata(ROLES_KEY, AdminController)).toEqual([
      Role.ADMIN,
    ]);
  });

  it('retorna 401 sem JWT', () =>
    agent(app.getHttpServer() as App)
      .get('/admin/dashboard')
      .expect(401));

  it('retorna 403 para USER, inclusive em chamada direta', async () => {
    await agent(app.getHttpServer() as App)
      .get('/admin/dashboard')
      .set('Authorization', 'Bearer user')
      .expect(403);
    expect(adminService.getDashboard).not.toHaveBeenCalled();
  });

  it('permite ADMIN', async () => {
    await agent(app.getHttpServer() as App)
      .get('/admin/dashboard')
      .set('Authorization', 'Bearer admin')
      .expect(200, { ok: true });
    expect(adminService.getDashboard).toHaveBeenCalledTimes(1);
  });

  it.each(['invalid', 'expired', 'missing-user', 'disabled'])(
    'retorna 401 para JWT %s',
    (token) =>
      agent(app.getHttpServer() as App)
        .get('/admin/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(401),
  );

  it.each([
    ['get', '/admin/dashboard'],
    ['get', '/admin/periods'],
    ['get', '/admin/users'],
    ['get', `/admin/users/${targetId}/deletion-impact`],
    ['get', `/admin/users/${targetId}`],
    ['delete', `/admin/users/${targetId}`],
    ['patch', `/admin/users/${targetId}/disable`],
    ['patch', `/admin/users/${targetId}/reactivate`],
    ['get', '/admin/payments'],
    ['get', '/admin/participations'],
    ['get', '/admin/financial-reviews'],
    ['get', '/admin/audit-logs'],
  ] as const)(
    'protege %s %s contra USER e permite ADMIN',
    async (method, path) => {
      await agent(app.getHttpServer() as App)
        [method](path)
        .set('Authorization', 'Bearer user')
        .send(method === 'delete' ? { confirmation: 'EXCLUIR' } : undefined)
        .expect(403);

      await agent(app.getHttpServer() as App)
        [method](path)
        .set('Authorization', 'Bearer admin')
        .send(method === 'delete' ? { confirmation: 'EXCLUIR' } : undefined)
        .expect(200);
    },
  );

  it('rejeita UUID malformado sem chamar o servico', async () => {
    await agent(app.getHttpServer() as App)
      .get('/admin/users/not-a-uuid')
      .set('Authorization', 'Bearer admin')
      .expect(400);
  });
});
