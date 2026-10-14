import { FixtureStatus } from '@prisma/client';

import { PrismaService } from '../../common/prisma/prisma.service';
import { RoundsService } from './rounds.service';

describe('RoundsService', () => {
  let service: RoundsService;
  let seasonFindFirst: jest.Mock;
  let seasonFindMany: jest.Mock;
  let fixtureFindMany: jest.Mock;
  let fixtureGroupBy: jest.Mock;
  let predictionFindMany: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-14T12:00:00.000Z'));
    seasonFindFirst = jest.fn().mockResolvedValue(season);
    seasonFindMany = jest.fn();
    fixtureFindMany = jest
      .fn()
      .mockResolvedValue([
        createFixture({ id: firstFixtureId }),
        createFixture({ id: secondFixtureId }),
      ]);
    fixtureGroupBy = jest.fn();
    predictionFindMany = jest.fn().mockResolvedValue([]);

    const prisma = {
      season: {
        findFirst: seasonFindFirst,
        findMany: seasonFindMany,
      },
      fixture: {
        findMany: fixtureFindMany,
        groupBy: fixtureGroupBy,
      },
      prediction: {
        findMany: predictionFindMany,
      },
    } as unknown as PrismaService;

    service = new RoundsService(prisma);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('mantem como padrao a rodada iniciada mais recente ainda em andamento', async () => {
    seasonFindMany.mockResolvedValue([
      {
        ...season,
        isActive: true,
      },
    ]);
    fixtureGroupBy.mockResolvedValue([
      createRoundGroup({ status: FixtureStatus.FT, count: 9 }),
      createRoundGroup({ status: FixtureStatus.LIVE, count: 1 }),
      createRoundGroup({
        round: 8,
        status: FixtureStatus.NS,
        count: 10,
        kickoff: new Date('2026-10-20T19:00:00.000Z'),
      }),
    ]);

    const result = await service.findCatalog();

    expect(result.defaults.round).toBe(7);
    expect(result.competitions[0].seasons[0].rounds[0]).not.toHaveProperty(
      'statuses',
    );
  });

  it('lista rodadas anteriores, a atual e somente a proxima futura', async () => {
    seasonFindMany.mockResolvedValue([{ ...season, isActive: true }]);
    fixtureGroupBy.mockResolvedValue([
      createRoundGroup({
        round: 1,
        status: FixtureStatus.FT,
        count: 10,
        kickoff: new Date('2026-10-01T19:00:00.000Z'),
      }),
      createRoundGroup({
        round: 2,
        status: FixtureStatus.LIVE,
        count: 10,
        kickoff: new Date('2026-10-10T19:00:00.000Z'),
      }),
      createRoundGroup({
        round: 3,
        status: FixtureStatus.NS,
        count: 10,
        kickoff: new Date('2026-10-20T19:00:00.000Z'),
      }),
      createRoundGroup({
        round: 4,
        status: FixtureStatus.NS,
        count: 10,
        kickoff: new Date('2026-10-27T19:00:00.000Z'),
      }),
    ]);

    const result = await service.findCatalog();
    const catalogSeason = result.competitions[0].seasons[0];

    expect(catalogSeason.rounds.map((round) => round.number)).toEqual([
      1, 2, 3,
    ]);
    expect(catalogSeason.defaultRound).toBe(2);
  });

  it('nao presume uma quantidade fixa de rodadas por competicao', async () => {
    seasonFindMany.mockResolvedValue([{ ...season, isActive: true }]);
    fixtureGroupBy.mockResolvedValue(
      Array.from({ length: 6 }, (_, index) =>
        createRoundGroup({
          round: index + 1,
          status: FixtureStatus.FT,
          count: 4,
          kickoff: new Date(
            `2026-09-${String(index + 1).padStart(2, '0')}T19:00:00.000Z`,
          ),
        }),
      ),
    );

    const result = await service.findCatalog();

    expect(
      result.competitions[0].seasons[0].rounds.map((round) => round.number),
    ).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('retorna catalogo vazio quando nao ha temporadas com fixtures', async () => {
    seasonFindMany.mockResolvedValue([]);

    await expect(service.findCatalog()).resolves.toEqual({
      competitions: [],
      defaults: {
        competitionId: null,
        seasonId: null,
        round: null,
      },
    });
    expect(fixtureGroupBy).not.toHaveBeenCalled();
  });

  it('nao inclui usuario sem palpite no ranking', async () => {
    predictionFindMany.mockResolvedValue([
      createPrediction({ userId: firstUserId, fixtureId: firstFixtureId }),
    ]);

    const result = await getStats();

    expect(result.ranking).toHaveLength(1);
    expect(result.ranking[0].userId).toBe(firstUserId);
    expect(result.ranking.some((entry) => entry.userId === secondUserId)).toBe(
      false,
    );
  });

  it('inclui usuario com ao menos um palpite publico', async () => {
    predictionFindMany.mockResolvedValue([
      createPrediction({ userId: secondUserId, fixtureId: firstFixtureId }),
    ]);

    const result = await getStats();

    expect(result.ranking).toEqual([
      expect.objectContaining({
        userId: secondUserId,
        predictionsCount: 1,
        position: 1,
      }),
    ]);
  });

  it('soma somente scorePoints naturais das Predictions', async () => {
    predictionFindMany.mockResolvedValue([
      createPrediction({
        userId: firstUserId,
        fixtureId: firstFixtureId,
        scorePoints: 3,
        exactScore: true,
        correctWinner: true,
      }),
      createPrediction({
        userId: firstUserId,
        fixtureId: secondFixtureId,
        scorePoints: 1,
        correctWinner: true,
      }),
    ]);

    const result = await getStats();

    expect(result.ranking[0]).toEqual(
      expect.objectContaining({
        naturalPoints: 4,
        exactScores: 1,
        correctWinners: 2,
      }),
    );
    expect(result.myPerformance.naturalPoints).toBe(4);
  });

  it('conta placar exato dentro dos resultados corretos sem somar categorias', async () => {
    const fixtureIds = Array.from(
      { length: 6 },
      (_, index) => `score-fixture-${index + 1}`,
    );
    fixtureFindMany.mockResolvedValue(
      fixtureIds.map((id) => createFixture({ id })),
    );
    predictionFindMany.mockResolvedValue([
      createPrediction({
        fixtureId: fixtureIds[0],
        scorePoints: 3,
        exactScore: true,
        correctWinner: true,
      }),
      ...fixtureIds.slice(1, 5).map((fixtureId) =>
        createPrediction({
          fixtureId,
          scorePoints: 1,
          correctWinner: true,
        }),
      ),
      createPrediction({ fixtureId: fixtureIds[5], scorePoints: 0 }),
    ]);

    const result = await getStats();

    expect(result.ranking[0]).toEqual(
      expect.objectContaining({
        naturalPoints: 7,
        exactScores: 1,
        correctWinners: 5,
        wrongPredictions: 1,
      }),
    );
  });

  it('ignora adjustmentPoints porque nao consulta Standing', async () => {
    predictionFindMany.mockResolvedValue([
      createPrediction({ scorePoints: 1, correctWinner: true }),
    ]);

    const result = await getStats();

    expect(result.ranking[0].naturalPoints).toBe(1);
    expect(result.ranking[0]).not.toHaveProperty('adjustmentPoints');
  });

  it('define melhor da rodada pela ordenacao oficial de desempenho', async () => {
    predictionFindMany.mockResolvedValue([
      createPrediction({
        userId: firstUserId,
        fixtureId: firstFixtureId,
        scorePoints: 3,
        exactScore: true,
        correctWinner: true,
      }),
      createPrediction({
        userId: secondUserId,
        fixtureId: firstFixtureId,
        scorePoints: 1,
        correctWinner: true,
      }),
    ]);

    const result = await getStats();

    expect(result.highlights.best).toEqual(
      expect.objectContaining({
        userId: firstUserId,
        value: 3,
        tieBreakCriterion: null,
      }),
    );
  });

  it('desempata por placar exato e depois pela data de cadastro', async () => {
    predictionFindMany.mockResolvedValue([
      createPrediction({
        userId: secondUserId,
        fixtureId: firstFixtureId,
        scorePoints: 3,
        exactScore: true,
        correctWinner: true,
        userCreatedAt: new Date('2026-08-02T00:00:00.000Z'),
      }),
      createPrediction({
        userId: firstUserId,
        fixtureId: firstFixtureId,
        scorePoints: 3,
        exactScore: true,
        correctWinner: true,
        userCreatedAt: new Date('2026-08-01T00:00:00.000Z'),
      }),
    ]);

    const result = await getStats();

    expect(result.ranking.map((entry) => entry.userId)).toEqual([
      firstUserId,
      secondUserId,
    ]);
    expect(result.highlights.best?.tieBreakCriterion).toBe(
      'EARLIER_REGISTRATION',
    );
  });

  it('marca como pior o participante 6/10 com 2 pontos diante de 10/10 com 4 pontos', async () => {
    const fixtureIds = Array.from(
      { length: 10 },
      (_, index) => `fixture-${index + 1}`,
    );
    fixtureFindMany.mockResolvedValue(
      fixtureIds.map((id) => createFixture({ id })),
    );
    predictionFindMany.mockResolvedValue([
      ...fixtureIds.map((fixtureId, index) =>
        createPrediction({
          userId: firstUserId,
          fixtureId,
          scorePoints: index < 4 ? 1 : 0,
          correctWinner: index < 4,
        }),
      ),
      ...fixtureIds.slice(0, 6).map((fixtureId, index) =>
        createPrediction({
          userId: secondUserId,
          fixtureId,
          scorePoints: index < 2 ? 1 : 0,
          correctWinner: index < 2,
        }),
      ),
    ]);

    const result = await getStats();

    expect(result.ranking).toEqual([
      expect.objectContaining({
        userId: firstUserId,
        predictionsCount: 10,
        naturalPoints: 4,
      }),
      expect.objectContaining({
        userId: secondUserId,
        predictionsCount: 6,
        naturalPoints: 2,
      }),
    ]);
    expect(result.ranking.some((entry) => entry.userId === thirdUserId)).toBe(
      false,
    );
    expect(result.highlights.worst).toEqual(
      expect.objectContaining({ userId: secondUserId, value: 2 }),
    );
  });

  it('desempata o menor numero de pontos por mais erros', async () => {
    predictionFindMany.mockResolvedValue([
      createPrediction({
        userId: firstUserId,
        fixtureId: firstFixtureId,
        scorePoints: 3,
        exactScore: true,
        correctWinner: true,
      }),
      createPrediction({
        userId: secondUserId,
        fixtureId: firstFixtureId,
        scorePoints: 1,
        correctWinner: true,
      }),
      createPrediction({
        userId: thirdUserId,
        fixtureId: firstFixtureId,
        scorePoints: 1,
        correctWinner: true,
      }),
      createPrediction({
        userId: thirdUserId,
        fixtureId: secondFixtureId,
        scorePoints: 0,
      }),
    ]);

    const result = await getStats();

    expect(result.ranking.slice(1).map((entry) => entry.naturalPoints)).toEqual(
      [1, 1],
    );
    expect(result.highlights.worst).toEqual(
      expect.objectContaining({ userId: thirdUserId, value: 1 }),
    );
  });

  it('considera menos placares exatos antes de vencedores no desempate do pior', async () => {
    const fixtureIds = Array.from(
      { length: 4 },
      (_, index) => `tie-fixture-${index + 1}`,
    );
    fixtureFindMany.mockResolvedValue(
      fixtureIds.map((id) => createFixture({ id })),
    );
    predictionFindMany.mockResolvedValue([
      createPrediction({
        userId: firstUserId,
        fixtureId: fixtureIds[0],
        scorePoints: 3,
        exactScore: true,
        correctWinner: true,
      }),
      createPrediction({
        userId: firstUserId,
        fixtureId: fixtureIds[1],
        scorePoints: 1,
        correctWinner: true,
      }),
      createPrediction({
        userId: secondUserId,
        fixtureId: fixtureIds[0],
        scorePoints: 3,
        exactScore: true,
        correctWinner: true,
      }),
      ...fixtureIds.slice(0, 3).map((fixtureId) =>
        createPrediction({
          userId: thirdUserId,
          fixtureId,
          scorePoints: 1,
          correctWinner: true,
        }),
      ),
    ]);

    const result = await getStats();

    expect(result.ranking.slice(1).map((entry) => entry.naturalPoints)).toEqual(
      [3, 3],
    );
    expect(result.highlights.worst).toEqual(
      expect.objectContaining({ userId: thirdUserId, value: 3 }),
    );
  });

  it('protege palpites futuros ao calcular o pior durante rodada parcial', async () => {
    fixtureFindMany.mockResolvedValue([
      createFixture({ id: firstFixtureId }),
      createFixture({
        id: secondFixtureId,
        kickoff: new Date('2026-10-20T19:00:00.000Z'),
        status: FixtureStatus.NS,
        processedAt: null,
        homeGoals: null,
        awayGoals: null,
      }),
    ]);
    predictionFindMany.mockResolvedValue([
      createPrediction({
        userId: firstUserId,
        fixtureId: firstFixtureId,
        scorePoints: 1,
        correctWinner: true,
      }),
      createPrediction({ userId: firstUserId, fixtureId: secondFixtureId }),
      createPrediction({ userId: secondUserId, fixtureId: firstFixtureId }),
      createPrediction({
        userId: secondUserId,
        fixtureId: secondFixtureId,
        scorePoints: 3,
        exactScore: true,
        correctWinner: true,
      }),
    ]);

    const result = await getStats();

    expect(result.status).toBe('IN_PROGRESS');
    expect(result.publicFixtures).toBe(1);
    expect(result.ranking).toEqual([
      expect.objectContaining({
        userId: firstUserId,
        predictionsCount: 1,
        naturalPoints: 1,
      }),
      expect.objectContaining({
        userId: secondUserId,
        predictionsCount: 1,
        naturalPoints: 0,
      }),
    ]);
    expect(result.highlights.worst).toEqual(
      expect.objectContaining({ userId: secondUserId, value: 0 }),
    );
  });

  it('retorna desempenho do usuario autenticado e aproveitamento coerente', async () => {
    predictionFindMany.mockResolvedValue([
      createPrediction({
        userId: secondUserId,
        fixtureId: firstFixtureId,
        scorePoints: 1,
        correctWinner: true,
      }),
      createPrediction({
        userId: secondUserId,
        fixtureId: secondFixtureId,
        scorePoints: 0,
      }),
      createPrediction({
        userId: firstUserId,
        fixtureId: firstFixtureId,
        scorePoints: 3,
        exactScore: true,
        correctWinner: true,
      }),
    ]);

    const result = await getStats(secondUserId);

    expect(result.myPerformance).toEqual({
      position: 2,
      naturalPoints: 1,
      predictionsCount: 2,
      evaluatedPredictions: 2,
      exactScores: 0,
      correctWinners: 1,
      wrongPredictions: 1,
      pendingPredictions: 0,
      accuracy: 50,
    });
  });

  it('protege transparencia antes do kickoff sem ocultar dados do proprio usuario', async () => {
    fixtureFindMany.mockResolvedValue([
      createFixture({
        id: firstFixtureId,
        kickoff: new Date('2026-10-20T19:00:00.000Z'),
        status: FixtureStatus.NS,
        processedAt: null,
        homeGoals: null,
        awayGoals: null,
      }),
    ]);
    predictionFindMany.mockResolvedValue([
      createPrediction({ userId: firstUserId, fixtureId: firstFixtureId }),
      createPrediction({ userId: secondUserId, fixtureId: firstFixtureId }),
    ]);

    const result = await getStats(firstUserId);

    expect(result.status).toBe('UPCOMING');
    expect(result.ranking).toEqual([]);
    expect(result.highlights.best).toBeNull();
    expect(result.myPerformance.predictionsCount).toBe(1);
    expect(result.myPerformance.position).toBeNull();
  });

  it('isola consultas por competicao, temporada e rodada', async () => {
    await getStats();

    expect(seasonFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: seasonId,
          leagueId: competitionId,
        },
      }),
    );
    expect(fixtureFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          seasonId,
          round: 7,
        },
      }),
    );
    expect(predictionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          fixtureId: {
            in: [firstFixtureId, secondFixtureId],
          },
        },
      }),
    );
  });

  async function getStats(userId = firstUserId) {
    return service.findRoundStats(userId, competitionId, seasonId, 7);
  }
});

const competitionId = '11111111-1111-4111-8111-111111111111';
const seasonId = '22222222-2222-4222-8222-222222222222';
const firstFixtureId = '33333333-3333-4333-8333-333333333333';
const secondFixtureId = '44444444-4444-4444-8444-444444444444';
const firstUserId = '55555555-5555-4555-8555-555555555555';
const secondUserId = '66666666-6666-4666-8666-666666666666';
const thirdUserId = '77777777-7777-4777-8777-777777777777';

const season = {
  id: seasonId,
  year: 2026,
  name: '2026/2027',
  league: {
    id: competitionId,
    name: 'Premier League',
    logo: 'https://example.com/premier-league.png',
  },
};

function createFixture(overrides: Partial<ReturnTypeFixture> = {}) {
  return {
    id: firstFixtureId,
    kickoff: new Date('2026-10-10T19:00:00.000Z'),
    status: FixtureStatus.FT,
    homeGoals: 2,
    awayGoals: 1,
    processedAt: new Date('2026-10-10T22:00:00.000Z'),
    ...overrides,
  };
}

function createRoundGroup({
  round = 7,
  status,
  count,
  kickoff = new Date('2026-10-10T19:00:00.000Z'),
}: {
  round?: number;
  status: FixtureStatus;
  count: number;
  kickoff?: Date;
}) {
  return {
    seasonId,
    round,
    status,
    _count: { _all: count },
    _min: { kickoff },
    _max: { kickoff },
  };
}

type ReturnTypeFixture = {
  id: string;
  kickoff: Date;
  status: FixtureStatus;
  homeGoals: number | null;
  awayGoals: number | null;
  processedAt: Date | null;
};

function createPrediction({
  userId = firstUserId,
  fixtureId = firstFixtureId,
  scorePoints = 0,
  exactScore = false,
  correctWinner = false,
  userCreatedAt = new Date('2026-08-01T00:00:00.000Z'),
}: {
  userId?: string;
  fixtureId?: string;
  scorePoints?: number;
  exactScore?: boolean;
  correctWinner?: boolean;
  userCreatedAt?: Date;
}) {
  return {
    userId,
    fixtureId,
    scorePoints,
    exactScore,
    correctWinner,
    createdAt: new Date('2026-10-01T00:00:00.000Z'),
    user: {
      id: userId,
      name:
        userId === firstUserId
          ? 'Ana'
          : userId === secondUserId
            ? 'Bruno'
            : 'Carla',
      avatarUrl: null,
      createdAt: userCreatedAt,
    },
  };
}
