import { ConflictException, ForbiddenException } from '@nestjs/common';
import { AdminAuditAction, PaymentStatus, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AdminService } from './admin.service';

describe('AdminService user lifecycle', () => {
  it('permite excluir usuario de teste sem relacoes e registra auditoria', async () => {
    const prisma = mockPrisma();
    const service = new AdminService(prisma as unknown as PrismaService);

    await expect(
      service.deleteUser(adminId, userId, 'EXCLUIR'),
    ).resolves.toEqual({ message: 'Usuário excluído definitivamente.' });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.participation.deleteMany).toHaveBeenCalledWith({
      where: { userId, paymentId: null },
    });
    expect(prisma.payment.deleteMany).toHaveBeenCalledWith({
      where: {
        userId,
        status: { in: [PaymentStatus.FAILED, PaymentStatus.CANCELLED] },
      },
    });
    expect(prisma.prediction.deleteMany).toHaveBeenCalledWith({
      where: { userId },
    });
    expect(prisma.standing.deleteMany).toHaveBeenCalledWith({
      where: { userId },
    });
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: userId } });
    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        adminUserId: adminId,
        action: AdminAuditAction.USER_DELETED,
        targetType: 'USER',
        targetId: userId,
        metadata: {
          targetRole: Role.USER,
          removedRecords: {
            predictions: 0,
            standings: 0,
            participations: 0,
            payments: 0,
            adminAuditLogs: 0,
          },
        },
      }),
    });
  });

  it('inclui Predictions, Standing e Participation sem pagamento no impacto e permite exclusao', async () => {
    const prisma = mockPrisma({
      predictions: 3,
      standings: 1,
      participations: 1,
      activeParticipations: 0,
    });
    const service = new AdminService(prisma as unknown as PrismaService);

    await expect(
      service.getUserDeletionImpact(adminId, userId),
    ).resolves.toMatchObject({
      canDelete: true,
      counts: {
        predictions: 3,
        standings: 1,
        participations: 1,
        payments: 0,
        adminAuditLogs: 0,
      },
    });
  });

  it('bloqueia exclusao quando existe Participation ACTIVE sem Payment', async () => {
    const prisma = mockPrisma({
      participations: 1,
      activeParticipations: 1,
    });
    const service = new AdminService(prisma as unknown as PrismaService);

    await expect(
      service.getUserDeletionImpact(adminId, userId),
    ).resolves.toMatchObject({
      canDelete: false,
      blockers: expect.arrayContaining([
        expect.objectContaining({ code: 'ACTIVE_PARTICIPATION_EXISTS' }),
      ]),
    });
  });

  it.each([PaymentStatus.PAID, PaymentStatus.PENDING, PaymentStatus.EXPIRED])(
    'bloqueia exclusao quando existe Payment %s',
    async (status) => {
      const prisma = mockPrisma({
        payments: 1,
        paymentGroups: [{ status, _count: { _all: 1 } }],
      });
      const service = new AdminService(prisma as unknown as PrismaService);

      await expect(
        service.deleteUser(adminId, userId, 'EXCLUIR'),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.user.delete).not.toHaveBeenCalled();
      expect(prisma.adminAuditLog.create).not.toHaveBeenCalled();
    },
  );

  it('permite analisar multiplos pagamentos terminais sem perder a contagem', async () => {
    const prisma = mockPrisma({
      payments: 3,
      paymentGroups: [
        { status: PaymentStatus.FAILED, _count: { _all: 2 } },
        { status: PaymentStatus.CANCELLED, _count: { _all: 1 } },
      ],
    });
    const service = new AdminService(prisma as unknown as PrismaService);

    await expect(
      service.getUserDeletionImpact(adminId, userId),
    ).resolves.toMatchObject({
      canDelete: true,
      counts: { payments: 3 },
      paymentStatusCounts: { FAILED: 2, CANCELLED: 1 },
    });
  });

  it('recalcula o impacto no DELETE e bloqueia se surgir pagamento apos o preview', async () => {
    const prisma = mockPrisma();
    const service = new AdminService(prisma as unknown as PrismaService);

    await expect(
      service.getUserDeletionImpact(adminId, userId),
    ).resolves.toMatchObject({ canDelete: true });

    prisma.payment.count.mockResolvedValueOnce(1);
    prisma.payment.groupBy.mockResolvedValueOnce([
      { status: PaymentStatus.PAID, _count: { _all: 1 } },
    ]);

    await expect(
      service.deleteUser(adminId, userId, 'EXCLUIR'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.payment.deleteMany).not.toHaveBeenCalled();
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });

  it('bloqueia Participation vinculada a qualquer pagamento', async () => {
    const prisma = mockPrisma({ participations: 1, linkedParticipations: 1 });
    const service = new AdminService(prisma as unknown as PrismaService);

    const impact = await service.getUserDeletionImpact(adminId, userId);
    expect(impact.canDelete).toBe(false);
    expect(impact.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'PAYMENT_LINKED_PARTICIPATION_EXISTS',
        }),
      ]),
    );
  });

  it('bloqueia exclusao quando o usuario identifica auditoria administrativa', async () => {
    const prisma = mockPrisma({ adminAuditLogs: 2 });
    const service = new AdminService(prisma as unknown as PrismaService);

    const impact = await service.getUserDeletionImpact(adminId, userId);
    expect(impact.canDelete).toBe(false);
    expect(impact.counts.adminAuditLogs).toBe(2);
    expect(impact.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'ADMIN_AUDIT_HISTORY_EXISTS' }),
      ]),
    );
  });

  it('bloqueia autoexclusao e exclusao de outro ADMIN', async () => {
    const selfPrisma = mockPrisma();
    const selfService = new AdminService(
      selfPrisma as unknown as PrismaService,
    );
    await expect(
      selfService.deleteUser(adminId, adminId, 'EXCLUIR'),
    ).rejects.toBeInstanceOf(ConflictException);

    const adminPrisma = mockPrisma({ role: Role.ADMIN });
    const adminService = new AdminService(
      adminPrisma as unknown as PrismaService,
    );
    await expect(
      adminService.deleteUser(adminId, userId, 'EXCLUIR'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('nao registra auditoria quando uma etapa da transacao falha', async () => {
    const prisma = mockPrisma();
    prisma.payment.deleteMany.mockRejectedValue(new Error('database failure'));
    const service = new AdminService(prisma as unknown as PrismaService);

    await expect(
      service.deleteUser(adminId, userId, 'EXCLUIR'),
    ).rejects.toThrow('database failure');
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.user.delete).not.toHaveBeenCalled();
    expect(prisma.adminAuditLog.create).not.toHaveBeenCalled();
  });

  it.each([
    ['prediction', 'prediction', 'deleteMany'],
    ['standing', 'standing', 'deleteMany'],
    ['user', 'user', 'delete'],
    ['audit', 'adminAuditLog', 'create'],
  ] as const)(
    'aborta a transacao quando falha na etapa %s',
    async (_step, model, method) => {
      const prisma = mockPrisma();
      prisma[model][method].mockRejectedValueOnce(
        new Error(`failure at ${model}`),
      );
      const service = new AdminService(prisma as unknown as PrismaService);

      await expect(
        service.deleteUser(adminId, userId, 'EXCLUIR'),
      ).rejects.toThrow(`failure at ${model}`);
      expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });

      if (_step !== 'audit') {
        expect(prisma.adminAuditLog.create).not.toHaveBeenCalled();
      }
    },
  );

  it.each(['P2003', 'P2025', 'P2034'])(
    'normaliza corrida de exclusao %s como conflito seguro',
    async (code) => {
      const prisma = mockPrisma();
      prisma.$transaction.mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError('concurrency conflict', {
          code,
          clientVersion: '6.19.3',
        }),
      );
      const service = new AdminService(prisma as unknown as PrismaService);

      await expect(
        service.deleteUser(adminId, userId, 'EXCLUIR'),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 'USER_DELETION_STATE_CHANGED',
        }),
      });
    },
  );

  it('desativa e reativa preservando historico e auditando as duas acoes', async () => {
    const prisma = mockPrisma();
    const service = new AdminService(prisma as unknown as PrismaService);

    await service.disableUser(adminId, userId);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          disabledAt: expect.any(Date),
          authVersion: { increment: 1 },
          resetPasswordToken: null,
          resetPasswordExpiresAt: null,
        },
      }),
    );
    expect(prisma.prediction.deleteMany).not.toHaveBeenCalled();
    expect(prisma.adminAuditLog.create).toHaveBeenLastCalledWith({
      data: expect.objectContaining({
        adminUserId: adminId,
        action: AdminAuditAction.USER_DISABLED,
        targetType: 'USER',
        targetId: userId,
        metadata: { disabledAt: expect.any(String) },
      }),
    });

    prisma.user.findUnique.mockResolvedValueOnce({
      id: userId,
      role: Role.USER,
      disabledAt: new Date('2026-10-09T10:00:00.000Z'),
    });
    await service.reactivateUser(adminId, userId);
    expect(prisma.user.update).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: { disabledAt: null } }),
    );
    expect(prisma.adminAuditLog.create).toHaveBeenLastCalledWith({
      data: expect.objectContaining({
        adminUserId: adminId,
        action: AdminAuditAction.USER_REACTIVATED,
        targetType: 'USER',
        targetId: userId,
        metadata: {
          previousDisabledAt: '2026-10-09T10:00:00.000Z',
        },
      }),
    });
  });

  it('impede desativar outro ADMIN', async () => {
    const prisma = mockPrisma({ role: Role.ADMIN });
    const service = new AdminService(prisma as unknown as PrismaService);

    await expect(service.disableUser(adminId, userId)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});

type MockOptions = {
  role?: Role;
  predictions?: number;
  standings?: number;
  participations?: number;
  linkedParticipations?: number;
  activeParticipations?: number;
  payments?: number;
  paymentGroups?: Array<{
    status: PaymentStatus;
    _count: { _all: number };
  }>;
  adminAuditLogs?: number;
};

function mockPrisma(options: MockOptions = {}) {
  const target = {
    id: userId,
    name: 'Test User',
    email: 'test@example.com',
    role: options.role ?? Role.USER,
    disabledAt: null,
    createdAt: new Date('2026-10-01T00:00:00.000Z'),
  };
  const prisma = {
    user: {
      findUnique: jest.fn().mockResolvedValue(target),
      delete: jest.fn().mockResolvedValue(target),
      update: jest
        .fn()
        .mockImplementation(({ data }) =>
          Promise.resolve({ ...target, ...data }),
        ),
    },
    prediction: {
      count: jest.fn().mockResolvedValue(options.predictions ?? 0),
      deleteMany: jest
        .fn()
        .mockResolvedValue({ count: options.predictions ?? 0 }),
    },
    standing: {
      count: jest.fn().mockResolvedValue(options.standings ?? 0),
      deleteMany: jest
        .fn()
        .mockResolvedValue({ count: options.standings ?? 0 }),
    },
    participation: {
      count: jest
        .fn()
        .mockResolvedValueOnce(options.participations ?? 0)
        .mockResolvedValueOnce(options.linkedParticipations ?? 0)
        .mockResolvedValueOnce(options.activeParticipations ?? 0),
      deleteMany: jest
        .fn()
        .mockResolvedValue({ count: options.participations ?? 0 }),
    },
    payment: {
      count: jest.fn().mockResolvedValue(options.payments ?? 0),
      groupBy: jest.fn().mockResolvedValue(options.paymentGroups ?? []),
      deleteMany: jest.fn().mockResolvedValue({ count: options.payments ?? 0 }),
    },
    adminAuditLog: {
      count: jest.fn().mockResolvedValue(options.adminAuditLogs ?? 0),
      create: jest.fn().mockResolvedValue({ id: 'audit-id' }),
    },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation(
    (callback: (client: typeof prisma) => unknown) => callback(prisma),
  );
  return prisma;
}

const adminId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';
