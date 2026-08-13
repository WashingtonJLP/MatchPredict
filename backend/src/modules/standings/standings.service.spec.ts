import { NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';
import { StandingsService } from './standings.service';

describe('StandingsService', () => {
  let service: StandingsService;
  let seasonFindFirst: jest.Mock;
  let standingFindMany: jest.Mock;

  beforeEach(() => {
    seasonFindFirst = jest.fn();
    standingFindMany = jest.fn();

    const prisma = {
      season: {
        findFirst: seasonFindFirst,
      },
      standing: {
        findMany: standingFindMany,
      },
    } as unknown as PrismaService;

    service = new StandingsService(prisma);
  });

  it('retorna ranking da temporada ativa com posicoes calculadas', async () => {
    seasonFindFirst.mockResolvedValue({ id: activeSeasonId });
    standingFindMany.mockResolvedValue([
      createStanding({
        userId: firstUserId,
        totalPoints: 42,
        exactScores: 6,
        correctWinners: 17,
        wrongPredictions: 5,
        user: {
          id: firstUserId,
          name: 'Maria Silva',
          avatarUrl: 'https://example.com/maria.png',
        },
      }),
      createStanding({
        userId: secondUserId,
        scorePoints: 36,
        totalPoints: 39,
        exactScores: 5,
        correctWinners: 16,
        wrongPredictions: 6,
        user: {
          id: secondUserId,
          name: 'Joao Souza',
          avatarUrl: null,
        },
      }),
    ]);

    await expect(service.findActiveSeasonRanking()).resolves.toEqual([
      {
        position: 1,
        userId: firstUserId,
        name: 'Maria Silva',
        avatarUrl: 'https://example.com/maria.png',
        scorePoints: 39,
        totalPoints: 42,
        exactScores: 6,
        correctWinners: 17,
        wrongPredictions: 5,
      },
      {
        position: 2,
        userId: secondUserId,
        name: 'Joao Souza',
        avatarUrl: null,
        scorePoints: 36,
        totalPoints: 39,
        exactScores: 5,
        correctWinners: 16,
        wrongPredictions: 6,
      },
    ]);
  });

  it('busca standings pela ordenacao oficial da sprint', async () => {
    seasonFindFirst.mockResolvedValue({ id: activeSeasonId });
    standingFindMany.mockResolvedValue([]);

    await service.findActiveSeasonRanking();

    expect(seasonFindFirst).toHaveBeenCalledWith({
      where: {
        isActive: true,
        league: {
          isActive: true,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
      },
    });
    expect(standingFindMany).toHaveBeenCalledWith({
      where: {
        seasonId: activeSeasonId,
      },
      orderBy: [
        {
          totalPoints: 'desc',
        },
        {
          exactScores: 'desc',
        },
        {
          correctWinners: 'desc',
        },
        {
          wrongPredictions: 'asc',
        },
        {
          createdAt: 'asc',
        },
      ],
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
  });

  it('retorna a posicao do usuario autenticado', async () => {
    seasonFindFirst.mockResolvedValue({ id: activeSeasonId });
    standingFindMany.mockResolvedValue([
      createStanding({
        userId: firstUserId,
        totalPoints: 42,
      }),
      createStanding({
        userId: secondUserId,
        totalPoints: 39,
        exactScores: 5,
        correctWinners: 16,
        user: {
          id: secondUserId,
          name: 'Joao Souza',
          avatarUrl: null,
        },
      }),
    ]);

    await expect(
      service.findMyActiveSeasonStanding(secondUserId),
    ).resolves.toEqual({
      position: 2,
      totalPlayers: 2,
      totalPoints: 39,
      exactScores: 5,
      correctWinners: 16,
    });
  });

  it('rejeita quando nao existe temporada ativa', async () => {
    seasonFindFirst.mockResolvedValue(null);

    await expect(service.findActiveSeasonRanking()).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(standingFindMany).not.toHaveBeenCalled();
  });

  it('rejeita quando usuario autenticado nao possui standing', async () => {
    seasonFindFirst.mockResolvedValue({ id: activeSeasonId });
    standingFindMany.mockResolvedValue([createStanding({ userId: firstUserId })]);

    await expect(
      service.findMyActiveSeasonStanding(secondUserId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

const activeSeasonId = '11111111-1111-4111-8111-111111111111';
const firstUserId = '22222222-2222-4222-8222-222222222222';
const secondUserId = '33333333-3333-4333-8333-333333333333';

function createStanding(overrides: Record<string, unknown> = {}) {
  return {
    id: '44444444-4444-4444-8444-444444444444',
    seasonId: activeSeasonId,
    userId: firstUserId,
    scorePoints: 39,
    mvpPoints: 0,
    totalPoints: 42,
    exactScores: 6,
    correctWinners: 17,
    correctMvps: 0,
    wrongPredictions: 5,
    position: 1,
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date('2026-08-01T00:00:00.000Z'),
    user: {
      id: firstUserId,
      name: 'Maria Silva',
      avatarUrl: null,
    },
    ...overrides,
  };
}
