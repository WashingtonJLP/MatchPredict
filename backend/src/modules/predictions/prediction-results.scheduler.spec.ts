import { Logger } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { FixtureStatus } from '@prisma/client';

import { PrismaService } from '../../common/prisma/prisma.service';
import { DailyGamesService } from '../daily-games/daily-games.service';
import {
  DailyGame,
  DailyGamesCompetition,
  DailyGamesResponse,
} from '../daily-games/types/daily-game.types';
import { FootballService } from '../football/football.service';
import { PredictionProcessorService } from './prediction-processor.service';
import { PredictionResultsScheduler } from './prediction-results.scheduler';

describe('PredictionResultsScheduler', () => {
  let scheduler: PredictionResultsScheduler;
  let findDailyGames: jest.Mock;
  let syncResults: jest.Mock;
  let processFixture: jest.Mock;
  let fixtureFindMany: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-09-01T12:00:00.000Z'));
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);

    findDailyGames = jest.fn().mockResolvedValue(createResponse());
    syncResults = jest.fn().mockResolvedValue(emptySyncResult());
    processFixture = jest.fn().mockResolvedValue({});
    fixtureFindMany = jest.fn().mockResolvedValue([]);

    scheduler = createScheduler();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('configura o cron de cinco minutos para nao sobrepor execucoes', () => {
    const options = Reflect.getMetadata(
      'SCHEDULE_CRON_OPTIONS',
      // eslint-disable-next-line @typescript-eslint/unbound-method
      PredictionResultsScheduler.prototype.syncAndProcessFinishedFixtures,
    ) as { cronTime: string; waitForCompletion?: boolean };

    expect(options).toMatchObject({
      cronTime: CronExpression.EVERY_5_MINUTES,
      waitForCompletion: true,
    });
  });

  it('nao inicia fluxo PostgreSQL sem evento relevante no ciclo normal', async () => {
    await completeStartup();

    await scheduler.syncAndProcessFinishedFixtures();

    expect(syncResults).not.toHaveBeenCalled();
    expect(fixtureFindMany).not.toHaveBeenCalled();
    expect(processFixture).not.toHaveBeenCalled();
  });

  it('ignora defensivamente eventos de outra competicao', async () => {
    await completeStartup();
    findDailyGames.mockResolvedValue(
      createResponse([createCompetition('uefa.champions', [createGame()])]),
    );

    await scheduler.syncAndProcessFinishedFixtures();

    expect(syncResults).not.toHaveBeenCalled();
    expect(fixtureFindMany).not.toHaveBeenCalled();
  });

  it('sincroniza somente o ID de uma partida LIVE com fingerprint novo', async () => {
    await completeStartup();
    findDailyGames.mockResolvedValue(
      createResponse([
        createCompetition('eng.1', [createGame({ status: 'LIVE' })]),
      ]),
    );

    await scheduler.syncAndProcessFinishedFixtures();

    expect(syncResults).toHaveBeenCalledWith([401860308]);
    expect(fixtureFindMany).toHaveBeenCalledWith({
      where: {
        status: FixtureStatus.FT,
        processedAt: null,
        apiFixtureId: { in: [401860308] },
      },
      select: { id: true },
    });
    expect(processFixture).not.toHaveBeenCalled();
  });

  it('processa uma partida FINAL pendente', async () => {
    await completeStartup();
    findDailyGames.mockResolvedValue(
      createResponse([
        createCompetition('eng.1', [createGame({ status: 'FINAL' })]),
      ]),
    );
    fixtureFindMany.mockResolvedValue([{ id: 'fixture-id' }]);

    await scheduler.syncAndProcessFinishedFixtures();

    expect(syncResults).toHaveBeenCalledWith([401860308]);
    expect(processFixture).toHaveBeenCalledWith('fixture-id');
  });

  it('nao toca PostgreSQL novamente quando o fingerprint permanece igual', async () => {
    await completeStartup();
    const response = createResponse([
      createCompetition('eng.1', [createGame({ status: 'LIVE' })]),
    ]);
    findDailyGames.mockResolvedValue(response);

    await scheduler.syncAndProcessFinishedFixtures();
    clearDatabaseMocks();
    await scheduler.syncAndProcessFinishedFixtures();

    expect(syncResults).not.toHaveBeenCalled();
    expect(fixtureFindMany).not.toHaveBeenCalled();
    expect(processFixture).not.toHaveBeenCalled();
  });

  it('sincroniza novamente quando o placar muda', async () => {
    await completeStartup();
    findDailyGames.mockResolvedValue(
      createResponse([
        createCompetition('eng.1', [createGame({ status: 'LIVE' })]),
      ]),
    );
    await scheduler.syncAndProcessFinishedFixtures();
    clearDatabaseMocks();
    findDailyGames.mockResolvedValue(
      createResponse([
        createCompetition('eng.1', [
          createGame({ status: 'LIVE', score: { home: 1, away: 0 } }),
        ]),
      ]),
    );

    await scheduler.syncAndProcessFinishedFixtures();

    expect(syncResults).toHaveBeenCalledWith([401860308]);
  });

  it('sincroniza e processa quando o status muda de LIVE para FINAL', async () => {
    await completeStartup();
    findDailyGames.mockResolvedValue(
      createResponse([
        createCompetition('eng.1', [createGame({ status: 'LIVE' })]),
      ]),
    );
    await scheduler.syncAndProcessFinishedFixtures();
    clearDatabaseMocks();
    fixtureFindMany.mockResolvedValue([{ id: 'fixture-id' }]);
    findDailyGames.mockResolvedValue(
      createResponse([
        createCompetition('eng.1', [createGame({ status: 'FINAL' })]),
      ]),
    );

    await scheduler.syncAndProcessFinishedFixtures();

    expect(syncResults).toHaveBeenCalledWith([401860308]);
    expect(processFixture).toHaveBeenCalledWith('fixture-id');
  });

  it('sincroniza novamente quando o kickoff muda', async () => {
    await completeStartup();
    findDailyGames.mockResolvedValue(
      createResponse([createCompetition('eng.1', [createGame()])]),
    );
    await scheduler.syncAndProcessFinishedFixtures();
    clearDatabaseMocks();
    findDailyGames.mockResolvedValue(
      createResponse([
        createCompetition('eng.1', [
          createGame({ kickoff: '2026-09-01T23:30:00.000Z' }),
        ]),
      ]),
    );

    await scheduler.syncAndProcessFinishedFixtures();

    expect(syncResults).toHaveBeenCalledWith([401860308]);
  });

  it.each(['POSTPONED', 'CANCELED'] as const)(
    'nao repete acesso PostgreSQL para estado %s estavel',
    async (status) => {
      await completeStartup();
      findDailyGames.mockResolvedValue(
        createResponse([createCompetition('eng.1', [createGame({ status })])]),
      );

      await scheduler.syncAndProcessFinishedFixtures();
      clearDatabaseMocks();
      await scheduler.syncAndProcessFinishedFixtures();

      expect(syncResults).not.toHaveBeenCalled();
      expect(fixtureFindMany).not.toHaveBeenCalled();
    },
  );

  it('nao faz fallback amplo em falha ESPN durante ciclo normal', async () => {
    await completeStartup();
    findDailyGames.mockRejectedValue(new Error('ESPN indisponivel'));

    await expect(
      scheduler.syncAndProcessFinishedFixtures(),
    ).resolves.toBeUndefined();
    expect(syncResults).not.toHaveBeenCalled();
    expect(fixtureFindMany).not.toHaveBeenCalled();
  });

  it('nao reconhece fingerprint quando syncResults falha', async () => {
    await completeStartup();
    findDailyGames.mockResolvedValue(
      createResponse([
        createCompetition('eng.1', [createGame({ status: 'LIVE' })]),
      ]),
    );
    syncResults.mockRejectedValueOnce(new Error('sync falhou'));

    await scheduler.syncAndProcessFinishedFixtures();
    syncResults.mockResolvedValue(emptySyncResult());
    await scheduler.syncAndProcessFinishedFixtures();

    expect(syncResults).toHaveBeenCalledTimes(2);
  });

  it('nao reconhece fingerprint quando processFixture falha', async () => {
    await completeStartup();
    findDailyGames.mockResolvedValue(
      createResponse([
        createCompetition('eng.1', [createGame({ status: 'FINAL' })]),
      ]),
    );
    fixtureFindMany.mockResolvedValue([{ id: 'fixture-id' }]);
    processFixture.mockRejectedValueOnce(new Error('processamento falhou'));

    await scheduler.syncAndProcessFinishedFixtures();
    processFixture.mockResolvedValue({});
    await scheduler.syncAndProcessFinishedFixtures();

    expect(syncResults).toHaveBeenCalledTimes(2);
    expect(processFixture).toHaveBeenCalledTimes(2);
  });

  it('executa reconciliacao ampla apenas no primeiro ciclo do startup', async () => {
    await scheduler.syncAndProcessFinishedFixtures();

    expect(syncResults).toHaveBeenCalledTimes(1);
    expect(syncResults).toHaveBeenCalledWith(undefined);
    clearDatabaseMocks();

    await scheduler.syncAndProcessFinishedFixtures();

    expect(syncResults).not.toHaveBeenCalled();
    expect(fixtureFindMany).not.toHaveBeenCalled();
  });

  it('faz no maximo uma tentativa ampla por dia, inclusive quando falha', async () => {
    await scheduler.syncAndProcessFinishedFixtures();
    clearDatabaseMocks();
    jest.setSystemTime(new Date('2026-09-02T12:00:00.000Z'));
    syncResults.mockRejectedValueOnce(new Error('falha diaria'));

    await scheduler.syncAndProcessFinishedFixtures();
    syncResults.mockResolvedValue(emptySyncResult());
    await scheduler.syncAndProcessFinishedFixtures();

    expect(syncResults).toHaveBeenCalledTimes(1);
    expect(syncResults).toHaveBeenCalledWith(undefined);
  });

  it('nova instancia recupera FINAL recente sem depender de fingerprint anterior', async () => {
    findDailyGames.mockResolvedValue(
      createResponse([
        createCompetition('eng.1', [createGame({ status: 'FINAL' })]),
      ]),
    );
    fixtureFindMany.mockResolvedValue([{ id: 'fixture-id' }]);

    await scheduler.syncAndProcessFinishedFixtures();

    expect(syncResults).toHaveBeenCalledWith(undefined);
    expect(processFixture).toHaveBeenCalledWith('fixture-id');
  });

  it('ignora sourceEventId invalido', async () => {
    await completeStartup();
    findDailyGames.mockResolvedValue(
      createResponse([
        createCompetition('eng.1', [
          createGame({ sourceEventId: 'evento-invalido' }),
        ]),
      ]),
    );

    await scheduler.syncAndProcessFinishedFixtures();

    expect(syncResults).not.toHaveBeenCalled();
    expect(fixtureFindMany).not.toHaveBeenCalled();
  });

  it('consulta exatamente D-2, D-1, D e D+1 em Sao Paulo', async () => {
    await scheduler.syncAndProcessFinishedFixtures();

    expect(findDailyGames.mock.calls).toEqual([
      ['2026-08-30', 'eng.1'],
      ['2026-08-31', 'eng.1'],
      ['2026-09-01', 'eng.1'],
      ['2026-09-02', 'eng.1'],
    ]);
  });

  function createScheduler() {
    return new PredictionResultsScheduler(
      { findDailyGames } as unknown as DailyGamesService,
      { syncResults } as unknown as FootballService,
      { processFixture } as unknown as PredictionProcessorService,
      {
        fixture: { findMany: fixtureFindMany },
      } as unknown as PrismaService,
    );
  }

  async function completeStartup() {
    findDailyGames.mockResolvedValue(createResponse());
    await scheduler.syncAndProcessFinishedFixtures();
    clearDatabaseMocks();
  }

  function clearDatabaseMocks() {
    syncResults.mockClear();
    fixtureFindMany.mockClear();
    processFixture.mockClear();
  }
});

function createGame(overrides: Partial<DailyGame> = {}): DailyGame {
  return {
    id: 'espn:eng.1:401860308',
    sourceEventId: '401860308',
    kickoff: '2026-09-01T22:30:00.000Z',
    localDate: '2026-09-01',
    localTime: '19:30',
    status: 'SCHEDULED',
    statusLabel: 'Pre-jogo',
    minute: null,
    period: null,
    homeTeam: {
      id: '359',
      name: 'Arsenal',
      abbreviation: 'ARS',
      logo: null,
    },
    awayTeam: {
      id: '363',
      name: 'Chelsea',
      abbreviation: 'CHE',
      logo: null,
    },
    score: { home: null, away: null },
    shootoutScore: null,
    stage: null,
    ...overrides,
  };
}

function createCompetition(
  id: DailyGamesCompetition['id'],
  games: DailyGame[],
): DailyGamesCompetition {
  return {
    id,
    name: id,
    logo: null,
    games,
  };
}

function createResponse(
  competitions: DailyGamesCompetition[] = [],
): DailyGamesResponse {
  return {
    date: '2026-09-01',
    timezone: 'America/Sao_Paulo',
    competitions,
    meta: {
      generatedAt: '2026-09-01T12:00:00.000Z',
      cacheTtlSeconds: 60,
      requestedCompetitions: 1,
      successfulCompetitions: 1,
      failedCompetitions: 0,
    },
  };
}

function emptySyncResult() {
  return {
    checked: 0,
    updated: 0,
    finished: 0,
    unchanged: 0,
  };
}
