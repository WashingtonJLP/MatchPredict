import { NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService statistics', () => {
  let service: UsersService;
  let seasonFindFirst: jest.Mock;
  let standingFindUnique: jest.Mock;
  let standingFindMany: jest.Mock;
  let predictionFindMany: jest.Mock;

  beforeEach(() => {
    seasonFindFirst = jest.fn();
    standingFindUnique = jest.fn();
    standingFindMany = jest.fn();
    predictionFindMany = jest.fn();

    const prisma = {
      season: {
        findFirst: seasonFindFirst,
      },
      standing: {
        findUnique: standingFindUnique,
        findMany: standingFindMany,
      },
      prediction: {
        findMany: predictionFindMany,
      },
    } as unknown as PrismaService;

    service = new UsersService(prisma);
  });

  it('retorna estatisticas do usuario usando dados persistidos', async () => {
    seasonFindFirst.mockResolvedValue({ id: activeSeasonId });
    standingFindUnique.mockResolvedValue({
      totalPoints: 14,
      correctWinners: 3,
      exactScores: 2,
      wrongPredictions: 1,
    });
    predictionFindMany.mockResolvedValue([
      createPredictionStatistics({ round: 1, totalPoints: 3 }),
      createPredictionStatistics({ round: 1, totalPoints: 1 }),
      createPredictionStatistics({ round: 2, totalPoints: 0 }),
      createPredictionStatistics({ round: 3, totalPoints: 10 }),
    ]);
    standingFindMany.mockResolvedValue([
      { userId: firstUserId },
      { userId },
      { userId: thirdUserId },
    ]);

    await expect(service.findMyStatistics(userId)).resolves.toEqual({
      totalPredictions: 4,
      totalPoints: 14,
      averagePoints: 3.5,
      accuracy: 75,
      correctWinners: 3,
      exactScores: 2,
      wrongPredictions: 1,
      bestRound: {
        round: 3,
        points: 10,
      },
      worstRound: {
        round: 2,
        points: 0,
      },
      currentPosition: 2,
    });

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
    expect(standingFindUnique).toHaveBeenCalledWith({
      where: {
        seasonId_userId: {
          seasonId: activeSeasonId,
          userId,
        },
      },
      select: {
        totalPoints: true,
        correctWinners: true,
        exactScores: true,
        wrongPredictions: true,
      },
    });
    expect(predictionFindMany).toHaveBeenCalledWith({
      where: {
        userId,
        fixture: {
          seasonId: activeSeasonId,
        },
      },
      select: {
        totalPoints: true,
        fixture: {
          select: {
            round: true,
          },
        },
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
      select: {
        userId: true,
      },
    });
  });

  it('retorna valores zerados quando usuario nao possui standing nem palpites', async () => {
    seasonFindFirst.mockResolvedValue({ id: activeSeasonId });
    standingFindUnique.mockResolvedValue(null);
    predictionFindMany.mockResolvedValue([]);
    standingFindMany.mockResolvedValue([{ userId: firstUserId }]);

    await expect(service.findMyStatistics(userId)).resolves.toEqual({
      totalPredictions: 0,
      totalPoints: 0,
      averagePoints: 0,
      accuracy: 0,
      correctWinners: 0,
      exactScores: 0,
      wrongPredictions: 0,
      bestRound: null,
      worstRound: null,
      currentPosition: null,
    });
  });

  it('rejeita quando nao existe temporada ativa', async () => {
    seasonFindFirst.mockResolvedValue(null);

    await expect(service.findMyStatistics(userId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(standingFindUnique).not.toHaveBeenCalled();
    expect(predictionFindMany).not.toHaveBeenCalled();
    expect(standingFindMany).not.toHaveBeenCalled();
  });

  it('usa a menor rodada como desempate de melhor e pior rodada', async () => {
    seasonFindFirst.mockResolvedValue({ id: activeSeasonId });
    standingFindUnique.mockResolvedValue({
      totalPoints: 8,
      correctWinners: 2,
      exactScores: 1,
      wrongPredictions: 2,
    });
    predictionFindMany.mockResolvedValue([
      createPredictionStatistics({ round: 2, totalPoints: 4 }),
      createPredictionStatistics({ round: 1, totalPoints: 4 }),
      createPredictionStatistics({ round: 4, totalPoints: 0 }),
      createPredictionStatistics({ round: 3, totalPoints: 0 }),
    ]);
    standingFindMany.mockResolvedValue([{ userId }]);

    await expect(service.findMyStatistics(userId)).resolves.toMatchObject({
      bestRound: {
        round: 1,
        points: 4,
      },
      worstRound: {
        round: 3,
        points: 0,
      },
    });
  });
});

const activeSeasonId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';
const firstUserId = '33333333-3333-4333-8333-333333333333';
const thirdUserId = '44444444-4444-4444-8444-444444444444';

function createPredictionStatistics({
  round,
  totalPoints,
}: {
  round: number;
  totalPoints: number;
}) {
  return {
    totalPoints,
    fixture: {
      round,
    },
  };
}
