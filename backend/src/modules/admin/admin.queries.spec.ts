import { NotFoundException } from '@nestjs/common';
import { PaymentStatus, ParticipationStatus } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { standingRankingOrderBy } from '../../common/prisma/query-presets';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AdminService } from './admin.service';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';
import { AdminPaginationQueryDto } from './dto/admin-pagination-query.dto';
import { AdminPaymentsQueryDto } from './dto/admin-payments-query.dto';

describe('AdminService paginated queries', () => {
  it('pagina, limita e parametriza busca com caracteres especiais', async () => {
    const prisma = queryPrisma();
    const service = new AdminService(prisma as unknown as PrismaService);

    await expect(
      service.getUsers(
        { page: 2, limit: 10, search: "José_%'" },
        new Date('2026-10-09T12:00:00.000Z'),
      ),
    ).resolves.toEqual({
      data: [],
      meta: { page: 2, limit: 10, total: 0, totalPages: 0 },
    });

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        where: expect.objectContaining({
          OR: [
            { name: { contains: "José_%'", mode: 'insensitive' } },
            { email: { contains: "José_%'", mode: 'insensitive' } },
          ],
        }),
      }),
    );
  });

  it('aplica filtros de pagamento sem N+1', async () => {
    const prisma = queryPrisma();
    const service = new AdminService(prisma as unknown as PrismaService);

    await service.getPayments({
      page: 1,
      limit: 20,
      status: PaymentStatus.PAID,
      periodId,
      user: 'ada@example.com',
    });

    expect(prisma.payment.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.payment.count).toHaveBeenCalledTimes(1);
    expect(prisma.payment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: PaymentStatus.PAID,
          periodId,
          user: expect.any(Object),
        }),
        select: expect.objectContaining({
          user: expect.any(Object),
          period: expect.any(Object),
        }),
      }),
    );
  });

  it('aplica filtros de participacao e retorna lista vazia', async () => {
    const prisma = queryPrisma();
    const service = new AdminService(prisma as unknown as PrismaService);

    await expect(
      service.getParticipations({
        page: 3,
        limit: 5,
        status: ParticipationStatus.ACTIVE,
        periodId,
      }),
    ).resolves.toEqual({
      data: [],
      meta: { page: 3, limit: 5, total: 0, totalPages: 0 },
    });
    expect(prisma.participation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 5 }),
    );
  });

  it('usa ordenacao estavel nas pendencias financeiras paginadas', async () => {
    const prisma = queryPrisma();
    const service = new AdminService(prisma as unknown as PrismaService);

    await service.getFinancialReviews({ page: 1, limit: 20 });

    expect(prisma.payment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
      }),
    );
  });

  it('retorna 404 para usuario inexistente', async () => {
    const prisma = queryPrisma();
    prisma.user.findUnique.mockResolvedValue(null);
    const service = new AdminService(prisma as unknown as PrismaService);

    await expect(service.getUser(userId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('calcula em lote a posicao oficial, ignora position legado e usa totalPoints ja ajustado', async () => {
    const prisma = queryPrisma();
    const secondSeasonId = '33333333-3333-4333-8333-333333333333';
    const naturalPoints = 40;
    const adjustmentPoints = -5;
    const adjustedTotalPoints = naturalPoints + adjustmentPoints;
    prisma.user.findUnique.mockResolvedValue({
      id: userId,
      name: 'Ada',
      standings: [
        {
          id: 'target-current',
          position: 1,
          totalPoints: adjustedTotalPoints,
          exactScores: 8,
          correctWinners: 14,
          season: {
            id: periodId,
            name: '2026/27',
            year: 2026,
            isActive: true,
          },
        },
        {
          id: 'target-previous',
          position: 1,
          totalPoints: 20,
          exactScores: 4,
          correctWinners: 8,
          season: {
            id: secondSeasonId,
            name: '2025/26',
            year: 2025,
            isActive: false,
          },
        },
      ],
    });
    prisma.standing.findMany.mockResolvedValue([
      { id: 'leader-current', seasonId: periodId },
      { id: 'leader-previous', seasonId: secondSeasonId },
      { id: 'target-current', seasonId: periodId },
      { id: 'runner-up-previous', seasonId: secondSeasonId },
      { id: 'target-previous', seasonId: secondSeasonId },
    ]);
    const service = new AdminService(prisma as unknown as PrismaService);

    const detail = await service.getUser(userId);

    expect(detail.standings).toEqual([
      expect.objectContaining({
        id: 'target-current',
        position: 2,
        totalPoints: adjustedTotalPoints,
      }),
      expect.objectContaining({ id: 'target-previous', position: 3 }),
    ]);
    expect(prisma.standing.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.standing.findMany).toHaveBeenCalledWith({
      where: { seasonId: { in: [periodId, secondSeasonId] } },
      orderBy: standingRankingOrderBy,
      select: { id: true, seasonId: true },
    });
  });

  it('preserva integralmente os criterios oficiais sem adicionar desempate por id', () => {
    expect(standingRankingOrderBy).toEqual([
      { totalPoints: 'desc' },
      { exactScores: 'desc' },
      { correctWinners: 'desc' },
      { wrongPredictions: 'asc' },
      { createdAt: 'asc' },
    ]);
  });

  it('rejeita pagina, limite e busca acima dos maximos do DTO', () => {
    const dto = plainToInstance(AdminUsersQueryDto, {
      page: 10_001,
      limit: 51,
      search: 'x'.repeat(101),
    });
    expect(validateSync(dto).length).toBeGreaterThanOrEqual(3);
  });

  it.each([0, -1, 999_999_999, 'NaN', 'texto', '1.5'])(
    'rejeita paginacao maliciosa: %p',
    (value) => {
      const pageDto = plainToInstance(AdminPaginationQueryDto, {
        page: value,
      });
      const limitDto = plainToInstance(AdminPaginationQueryDto, {
        limit: value,
      });

      expect(validateSync(pageDto)).not.toHaveLength(0);
      expect(validateSync(limitDto)).not.toHaveLength(0);
    },
  );

  it('rejeita status e periodo invalidos na listagem de pagamentos', () => {
    const dto = plainToInstance(AdminPaymentsQueryDto, {
      status: 'FORCE_PAID',
      periodId: 'not-a-uuid',
    });

    expect(validateSync(dto).length).toBeGreaterThanOrEqual(2);
  });
});

function queryPrisma() {
  return {
    user: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findUnique: jest.fn().mockResolvedValue(null),
    },
    payment: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    participation: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    standing: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };
}

const periodId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';
