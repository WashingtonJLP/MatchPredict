import { ConflictException, ForbiddenException } from '@nestjs/common';
import { Fixture, FixtureStatus, Prediction } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ScoreEngineService } from '../../common/score-engine/score-engine.service';
import { PredictionsService } from './predictions.service';

describe('PredictionsService', () => {
  let service: PredictionsService;
  let fixtureFindUnique: jest.Mock;
  let predictionFindUnique: jest.Mock;
  let predictionFindMany: jest.Mock;
  let predictionCreate: jest.Mock;
  let predictionUpdate: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-20T15:00:00.000Z'));

    fixtureFindUnique = jest.fn();
    predictionFindUnique = jest.fn();
    predictionFindMany = jest.fn();
    predictionCreate = jest.fn();
    predictionUpdate = jest.fn();

    const prisma = {
      fixture: {
        findUnique: fixtureFindUnique,
      },
      prediction: {
        findUnique: predictionFindUnique,
        findMany: predictionFindMany,
        create: predictionCreate,
        update: predictionUpdate,
      },
    } as unknown as PrismaService;

    service = new PredictionsService(prisma, new ScoreEngineService());
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('permite criar palpite antes do início da partida', async () => {
    const fixture = createFixture({
      kickoff: new Date('2026-08-20T16:00:00.000Z'),
    });
    const createdPrediction = createPrediction({ fixtureId: fixture.id });

    fixtureFindUnique.mockResolvedValue(fixture);
    predictionFindUnique.mockResolvedValue(null);
    predictionCreate.mockResolvedValue(createdPrediction);

    await expect(
      service.create(userId, {
        fixtureId: fixture.id,
        homeGoals: 2,
        awayGoals: 1,
      }),
    ).resolves.toBe(createdPrediction);
    expect(predictionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          userId,
          fixtureId: fixture.id,
          homeGoals: 2,
          awayGoals: 1,
        },
      }),
    );
  });

  it('rejeita criação exatamente no horário de início da partida', async () => {
    fixtureFindUnique.mockResolvedValue(
      createFixture({
        kickoff: new Date('2026-08-20T15:00:00.000Z'),
      }),
    );

    await expect(
      service.create(userId, {
        fixtureId,
        homeGoals: 2,
        awayGoals: 1,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(predictionCreate).not.toHaveBeenCalled();
  });

  it('rejeita criação depois do início da partida', async () => {
    fixtureFindUnique.mockResolvedValue(
      createFixture({
        kickoff: new Date('2026-08-20T14:59:59.999Z'),
      }),
    );

    await expect(
      service.create(userId, {
        fixtureId,
        homeGoals: 2,
        awayGoals: 1,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(predictionCreate).not.toHaveBeenCalled();
  });

  it('rejeita edição depois do início da partida', async () => {
    predictionFindUnique.mockResolvedValue(
      createPrediction({
        fixture: createFixture({
          kickoff: new Date('2026-08-20T14:59:59.999Z'),
        }),
      }),
    );

    await expect(
      service.update(userId, predictionId, {
        homeGoals: 3,
        awayGoals: 1,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(predictionUpdate).not.toHaveBeenCalled();
  });

  it('rejeita palpite quando o status indica partida ao vivo mesmo com kickoff futuro', async () => {
    fixtureFindUnique.mockResolvedValue(
      createFixture({
        kickoff: new Date('2026-08-20T16:00:00.000Z'),
        status: FixtureStatus.LIVE,
      }),
    );

    await expect(
      service.create(userId, {
        fixtureId,
        homeGoals: 2,
        awayGoals: 1,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(predictionCreate).not.toHaveBeenCalled();
  });

  it('impede alterar palpite de outro usuário', async () => {
    predictionFindUnique.mockResolvedValue(
      createPrediction({
        userId: otherUserId,
        fixture: createFixture({
          kickoff: new Date('2026-08-20T16:00:00.000Z'),
        }),
      }),
    );

    await expect(
      service.update(userId, predictionId, {
        homeGoals: 3,
        awayGoals: 1,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(predictionUpdate).not.toHaveBeenCalled();
  });
  it('limita endpoint antigo ao palpite prÃ³prio antes do kickoff', async () => {
    const fixture = createFixture({
      kickoff: new Date('2026-08-20T16:00:00.000Z'),
    });

    fixtureFindUnique.mockResolvedValue(fixture);
    predictionFindMany.mockResolvedValue([createPrediction({ fixtureId })]);

    await service.findByFixture(userId, fixtureId);

    expect(predictionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          fixtureId,
          userId,
        },
      }),
    );
  });

  it('retorna somente palpite prÃ³prio na transparÃªncia antes do kickoff', async () => {
    const fixture = createTransparencyFixture({
      kickoff: new Date('2026-08-20T16:00:00.000Z'),
    });
    const predictions = [createTransparencyPrediction({ userId })];

    fixtureFindUnique.mockResolvedValue(fixture);
    predictionFindMany.mockResolvedValue(predictions);

    await expect(
      service.findFixtureTransparency(userId, fixtureId),
    ).resolves.toMatchObject({
      isClosedForPrediction: false,
      finalResult: null,
      predictions,
    });
    expect(predictionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          fixtureId,
          userId,
        },
      }),
    );
  });

  it('retorna lista vazia na transparÃªncia antes do kickoff sem palpite prÃ³prio', async () => {
    fixtureFindUnique.mockResolvedValue(
      createTransparencyFixture({
        kickoff: new Date('2026-08-20T16:00:00.000Z'),
      }),
    );
    predictionFindMany.mockResolvedValue([]);

    await expect(
      service.findFixtureTransparency(userId, fixtureId),
    ).resolves.toMatchObject({
      isClosedForPrediction: false,
      predictions: [],
    });
  });

  it('libera todos os palpites na transparÃªncia apÃ³s o kickoff', async () => {
    fixtureFindUnique.mockResolvedValue(
      createTransparencyFixture({
        kickoff: new Date('2026-08-20T14:59:59.999Z'),
      }),
    );
    predictionFindMany.mockResolvedValue([
      createTransparencyPrediction({ userId }),
      createTransparencyPrediction({ userId: otherUserId }),
    ]);

    await service.findFixtureTransparency(userId, fixtureId);

    expect(predictionFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          fixtureId,
          userId: undefined,
        },
      }),
    );
  });

  it('libera todos os palpites em LIVE sem resultado final', async () => {
    fixtureFindUnique.mockResolvedValue(
      createTransparencyFixture({
        kickoff: new Date('2026-08-20T16:00:00.000Z'),
        status: FixtureStatus.LIVE,
        homeGoals: 1,
        awayGoals: 0,
      }),
    );
    predictionFindMany.mockResolvedValue([createTransparencyPrediction()]);

    await expect(
      service.findFixtureTransparency(userId, fixtureId),
    ).resolves.toMatchObject({
      isClosedForPrediction: true,
      finalResult: null,
    });
  });

  it('retorna resultado final em FT com placar sem recalcular pontos', async () => {
    const predictions = [
      createTransparencyPrediction({
        totalPoints: 3,
      }),
    ];

    fixtureFindUnique.mockResolvedValue(
      createTransparencyFixture({
        status: FixtureStatus.FT,
        homeGoals: 3,
        awayGoals: 1,
        processedAt: null,
      }),
    );
    predictionFindMany.mockResolvedValue(predictions);

    await expect(
      service.findFixtureTransparency(userId, fixtureId),
    ).resolves.toMatchObject({
      finalResult: {
        homeGoals: 3,
        awayGoals: 1,
      },
      predictions,
    });
    expect(predictionUpdate).not.toHaveBeenCalled();
  });
});

const userId = '11111111-1111-4111-8111-111111111111';
const otherUserId = '22222222-2222-4222-8222-222222222222';
const fixtureId = '33333333-3333-4333-8333-333333333333';
const predictionId = '44444444-4444-4444-8444-444444444444';

function createFixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    id: fixtureId,
    apiFixtureId: 123,
    seasonId: '55555555-5555-4555-8555-555555555555',
    homeTeamId: '66666666-6666-4666-8666-666666666666',
    awayTeamId: '77777777-7777-4777-8777-777777777777',
    round: 1,
    kickoff: new Date('2026-08-20T16:00:00.000Z'),
    status: FixtureStatus.NS,
    homeGoals: null,
    awayGoals: null,
    winnerType: null,
    processedAt: null,
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date('2026-08-01T00:00:00.000Z'),
    ...overrides,
  };
}

function createPrediction(
  overrides: Partial<Prediction> & { fixture?: Fixture } = {},
) {
  return {
    id: predictionId,
    userId,
    fixtureId,
    homeGoals: 1,
    awayGoals: 0,
    mvpPlayerId: null,
    scorePoints: 0,
    mvpPoints: 0,
    totalPoints: 0,
    exactScore: false,
    correctWinner: false,
    correctMvp: false,
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date('2026-08-01T00:00:00.000Z'),
    ...overrides,
  };
}

function createTransparencyFixture(
  overrides: Partial<
    Fixture & {
      homeTeam: { id: string; logo: string; name: string };
      awayTeam: { id: string; logo: string; name: string };
    }
  > = {},
) {
  return {
    ...createFixture(),
    homeTeam: {
      id: '66666666-6666-4666-8666-666666666666',
      logo: 'https://example.com/home.png',
      name: 'Arsenal',
    },
    awayTeam: {
      id: '77777777-7777-4777-8777-777777777777',
      logo: 'https://example.com/away.png',
      name: 'Chelsea',
    },
    ...overrides,
  };
}

function createTransparencyPrediction(
  overrides: Partial<{
    awayGoals: number;
    homeGoals: number;
    id: string;
    totalPoints: number;
    user: { avatarUrl: string | null; id: string; name: string };
    userId: string;
  }> = {},
) {
  const selectedUserId = overrides.userId ?? userId;

  return {
    id: overrides.id ?? predictionId,
    homeGoals: overrides.homeGoals ?? 1,
    awayGoals: overrides.awayGoals ?? 0,
    totalPoints: overrides.totalPoints ?? 0,
    user: overrides.user ?? {
      id: selectedUserId,
      name: selectedUserId === userId ? 'Washington' : 'JoÃ£o',
      avatarUrl: null,
    },
  };
}
