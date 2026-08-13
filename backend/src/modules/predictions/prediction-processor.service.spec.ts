import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Fixture, FixtureStatus, Prediction, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ScoreEngineService } from '../../common/score-engine/score-engine.service';
import { PredictionProcessorService } from './prediction-processor.service';

describe('PredictionProcessorService', () => {
  let service: PredictionProcessorService;
  let fixtureFindUnique: jest.Mock;
  let predictionFindMany: jest.Mock;
  let transaction: jest.Mock;
  let tx: Prisma.TransactionClient;
  let txFixtureUpdateMany: jest.Mock;
  let txPredictionFindMany: jest.Mock;
  let txPredictionUpdate: jest.Mock;
  let txStandingUpsert: jest.Mock;

  beforeEach(() => {
    fixtureFindUnique = jest.fn();
    predictionFindMany = jest.fn();
    txFixtureUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
    txPredictionFindMany = jest.fn();
    txPredictionUpdate = jest.fn();
    txStandingUpsert = jest.fn();

    tx = {
      fixture: {
        updateMany: txFixtureUpdateMany,
      },
      prediction: {
        findMany: txPredictionFindMany,
        update: txPredictionUpdate,
      },
      standing: {
        upsert: txStandingUpsert,
      },
    } as unknown as Prisma.TransactionClient;

    transaction = jest.fn((callback) => callback(tx));

    const prisma = {
      fixture: {
        findUnique: fixtureFindUnique,
      },
      prediction: {
        findMany: predictionFindMany,
      },
      $transaction: transaction,
    } as unknown as PrismaService;

    service = new PredictionProcessorService(prisma, new ScoreEngineService());
  });

  it('processa palpites e atualiza standings dos usuários afetados', async () => {
    const fixture = createFixture({
      homeGoals: 2,
      awayGoals: 1,
      status: FixtureStatus.FT,
    });
    const predictions = [
      createPrediction({
        id: '11111111-1111-4111-8111-111111111111',
        userId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        homeGoals: 2,
        awayGoals: 1,
      }),
      createPrediction({
        id: '22222222-2222-4222-8222-222222222222',
        userId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        homeGoals: 1,
        awayGoals: 0,
      }),
    ];

    fixtureFindUnique.mockResolvedValue(fixture);
    predictionFindMany.mockResolvedValue(predictions);
    txPredictionFindMany
      .mockResolvedValueOnce([{ ...predictions[0], fixture }])
      .mockResolvedValueOnce([{ ...predictions[1], fixture }]);

    await expect(service.processFixture(fixture.id)).resolves.toEqual({
      fixtureId: fixture.id,
      alreadyProcessed: false,
      predictionsProcessed: 2,
      standingsUpdated: 2,
    });

    expect(txFixtureUpdateMany).toHaveBeenCalledWith({
      where: {
        id: fixture.id,
        processedAt: null,
      },
      data: {
        processedAt: expect.any(Date),
      },
    });
    expect(txPredictionUpdate).toHaveBeenCalledTimes(2);
    expect(txPredictionUpdate).toHaveBeenNthCalledWith(1, {
      where: {
        id: predictions[0].id,
      },
      data: {
        scorePoints: 3,
        totalPoints: 3,
        exactScore: true,
        correctWinner: true,
      },
    });
    expect(txPredictionUpdate).toHaveBeenNthCalledWith(2, {
      where: {
        id: predictions[1].id,
      },
      data: {
        scorePoints: 1,
        totalPoints: 1,
        exactScore: false,
        correctWinner: true,
      },
    });
    expect(txStandingUpsert).toHaveBeenCalledTimes(2);
  });

  it('retorna alreadyProcessed quando a partida já foi processada', async () => {
    const fixture = createFixture({
      processedAt: new Date('2026-08-12T12:00:00.000Z'),
      status: FixtureStatus.FT,
      homeGoals: 2,
      awayGoals: 1,
    });

    fixtureFindUnique.mockResolvedValue(fixture);

    await expect(service.processFixture(fixture.id)).resolves.toEqual({
      fixtureId: fixture.id,
      alreadyProcessed: true,
      predictionsProcessed: 0,
      standingsUpdated: 0,
    });
    expect(predictionFindMany).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
  });

  it('rejeita partida inexistente', async () => {
    fixtureFindUnique.mockResolvedValue(null);

    await expect(
      service.processFixture('99999999-9999-4999-8999-999999999999'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejeita partida que ainda não terminou', async () => {
    const fixture = createFixture({
      status: FixtureStatus.NS,
      homeGoals: null,
      awayGoals: null,
    });

    fixtureFindUnique.mockResolvedValue(fixture);

    await expect(service.processFixture(fixture.id)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(predictionFindMany).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
  });

  it('rejeita partida finalizada sem placar final', async () => {
    const fixture = createFixture({
      status: FixtureStatus.FT,
      homeGoals: null,
      awayGoals: 1,
    });

    fixtureFindUnique.mockResolvedValue(fixture);

    await expect(service.processFixture(fixture.id)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(predictionFindMany).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
  });

  it('retorna alreadyProcessed quando outro processo marca a fixture na transação', async () => {
    const fixture = createFixture({
      status: FixtureStatus.FT,
      homeGoals: 2,
      awayGoals: 1,
    });

    fixtureFindUnique.mockResolvedValue(fixture);
    predictionFindMany.mockResolvedValue([createPrediction()]);
    txFixtureUpdateMany.mockResolvedValue({ count: 0 });

    await expect(service.processFixture(fixture.id)).resolves.toEqual({
      fixtureId: fixture.id,
      alreadyProcessed: true,
      predictionsProcessed: 0,
      standingsUpdated: 0,
    });
    expect(txPredictionUpdate).not.toHaveBeenCalled();
    expect(txStandingUpsert).not.toHaveBeenCalled();
  });
});

function createFixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    id: '33333333-3333-4333-8333-333333333333',
    apiFixtureId: 123,
    seasonId: '44444444-4444-4444-8444-444444444444',
    homeTeamId: '55555555-5555-4555-8555-555555555555',
    awayTeamId: '66666666-6666-4666-8666-666666666666',
    round: 1,
    kickoff: new Date('2026-08-12T15:00:00.000Z'),
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

function createPrediction(overrides: Partial<Prediction> = {}): Prediction {
  return {
    id: '77777777-7777-4777-8777-777777777777',
    userId: '88888888-8888-4888-8888-888888888888',
    fixtureId: '33333333-3333-4333-8333-333333333333',
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
