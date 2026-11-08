import { ConflictException } from '@nestjs/common';
import { FixtureStatus, Prisma, PrismaClient } from '@prisma/client';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { ScoreEngineService } from '../src/common/score-engine/score-engine.service';
import { FutureParticipationPeriodException } from '../src/modules/participations/future-participation-period.exception';
import { getParticipationPeriodForDate } from '../src/modules/participations/participation-period';
import { ParticipationPeriodsService } from '../src/modules/participations/participation-periods.service';
import { ParticipationsService } from '../src/modules/participations/participations.service';
import { PredictionsService } from '../src/modules/predictions/predictions.service';

// No project connection configuration is read: this suite owns a disposable,
// loopback-only Docker database and always supplies its URL explicitly.
const container = `matchpredict-p1-${randomUUID()}`;
const databaseName = 'matchpredict_p1_disposable';
const userId = randomUUID();
const fixtureId = randomUUID();
const otherFixtureId = randomUUID();
const novemberKickoff = new Date('2026-11-20T19:00:00Z');
const decemberKickoff = new Date('2026-12-20T19:00:00Z');
const now = new Date('2026-11-08T15:00:00Z');

function deferred<T>() {
  let resolvePromise!: (value: T) => void;
  const promise = new Promise<T>((resolveValue) => {
    resolvePromise = resolveValue;
  });
  return { promise, resolve: resolvePromise };
}

function docker(...args: string[]) {
  return execFileSync('docker', args, {
    encoding: 'utf8',
    timeout: 120_000,
    windowsHide: true,
  }).trim();
}

describe('Monthly authorization with real PostgreSQL fixture locks', () => {
  let db: PrismaClient;
  let sync: PrismaClient;
  let observer: PrismaClient;
  let createdContainer = false;
  let releases: Array<() => void>;
  let inFlight: Array<Promise<unknown>>;

  beforeAll(async () => {
    docker(
      'run',
      '--detach',
      '--rm',
      '--name',
      container,
      '--publish',
      '127.0.0.1::5432',
      '--env',
      'POSTGRES_PASSWORD=local-p1-test-only',
      '--env',
      `POSTGRES_DB=${databaseName}`,
      'postgres:17',
    );
    createdContainer = true;
    const address = docker('port', container, '5432/tcp');
    if (!/^127\.0\.0\.1:\d+$/.test(address))
      throw new Error('Expected an isolated loopback PostgreSQL port.');
    const url = `postgresql://postgres:local-p1-test-only@${address}/${databaseName}?connection_limit=4&connect_timeout=5&pool_timeout=3`;
    const parsed = new URL(url);
    if (
      parsed.hostname !== '127.0.0.1' ||
      parsed.pathname !== `/${databaseName}`
    )
      throw new Error('Refusing a non-disposable database.');
    for (let attempt = 0; ; attempt++) {
      try {
        docker(
          'exec',
          container,
          'pg_isready',
          '-h',
          '127.0.0.1',
          '-U',
          'postgres',
          '-d',
          databaseName,
        );
        break;
      } catch (error) {
        if (attempt === 30) throw error;
        await new Promise((done) => setTimeout(done, 100));
      }
    }
    db = new PrismaClient({ datasources: { db: { url } } });
    sync = new PrismaClient({ datasources: { db: { url } } });
    observer = new PrismaClient({ datasources: { db: { url } } });
    await db.$executeRaw`CREATE EXTENSION IF NOT EXISTS pg_trgm`;
    // Materialize the unchanged schema only in the fresh container. No migration
    // files, production data, or project DATABASE_URL are used or modified.
    execFileSync(
      process.execPath,
      [
        resolve(__dirname, '../node_modules/prisma/build/index.js'),
        'db',
        'push',
        '--schema',
        resolve(__dirname, '../prisma/schema.prisma'),
        '--skip-generate',
      ],
      {
        env: { ...process.env, DATABASE_URL: url },
        timeout: 60_000,
        windowsHide: true,
        stdio: 'pipe',
      },
    );
    await db.user.create({
      data: {
        id: userId,
        name: 'Local P1',
        email: 'p1@example.test',
        password: 'unused',
      },
    });
    const league = await db.league.create({
      data: { apiLeagueId: 1, name: 'Local', country: 'BR', logo: '' },
    });
    const season = await db.season.create({
      data: {
        leagueId: league.id,
        year: 2026,
        name: 'Local 2026',
        startDate: now,
        endDate: decemberKickoff,
      },
    });
    const home = await db.team.create({
      data: { apiTeamId: 1, name: 'Home', country: 'BR', logo: '' },
    });
    const away = await db.team.create({
      data: { apiTeamId: 2, name: 'Away', country: 'BR', logo: '' },
    });
    for (const [id, apiFixtureId] of [
      [fixtureId, 1],
      [otherFixtureId, 2],
    ] as const) {
      await db.fixture.create({
        data: {
          id,
          apiFixtureId,
          seasonId: season.id,
          homeTeamId: home.id,
          awayTeamId: away.id,
          round: 1,
          kickoff: novemberKickoff,
        },
      });
    }
    for (const date of [novemberKickoff, decemberKickoff]) {
      const period = await db.participationPeriod.create({
        data: {
          ...getParticipationPeriodForDate(date),
          participationFeeCents: 2500,
        },
      });
      await db.participation.create({ data: { userId, periodId: period.id } });
    }
  }, 180_000);

  beforeEach(async () => {
    releases = [];
    inFlight = [];
    jest
      .useFakeTimers({
        doNotFake: [
          'nextTick',
          'setImmediate',
          'setTimeout',
          'clearTimeout',
          'setInterval',
          'clearInterval',
        ],
      })
      .setSystemTime(now);
    await db.prediction.deleteMany();
    await db.fixture.updateMany({
      data: { kickoff: novemberKickoff, status: FixtureStatus.NS, round: 1 },
    });
  });

  afterEach(async () => {
    releases?.forEach((release) => release());
    await Promise.allSettled(inFlight ?? []);
    jest.useRealTimers();
  });

  afterAll(async () => {
    await Promise.allSettled([
      db?.$disconnect(),
      sync?.$disconnect(),
      observer?.$disconnect(),
    ]);
    if (createdContainer) docker('rm', '--force', container);
  });

  function track<T>(promise: Promise<T>) {
    inFlight.push(promise);
    void promise.catch(() => undefined);
    return promise;
  }

  function instrument(pauseAfterLock = false) {
    const pid = deferred<number>();
    const attempting = deferred<void>();
    const locked = deferred<void>();
    const release = deferred<void>();
    releases.push(() => release.resolve());
    if (!pauseAfterLock) release.resolve();
    let lockAttempts = 0;
    const prisma = {
      $transaction: <T>(
        operation: (tx: Prisma.TransactionClient) => Promise<T>,
        options: {
          isolationLevel: Prisma.TransactionIsolationLevel;
          maxWait: number;
          timeout: number;
        },
      ) =>
        db.$transaction(async (tx) => {
          const [connection] = await tx.$queryRaw<
            Array<{ pid: number }>
          >`SELECT pg_backend_pid() AS pid`;
          pid.resolve(connection.pid);
          const wrapped = new Proxy(tx, {
            get(target, key) {
              if (key === '$queryRaw')
                return async (
                  sql: TemplateStringsArray,
                  ...values: unknown[]
                ) => {
                  expect(sql.join('?')).toMatch(
                    /WHERE id = \?::uuid FOR SHARE/,
                  );
                  expect(values).toEqual([fixtureId]);
                  lockAttempts++;
                  attempting.resolve();
                  const result = await target.$queryRaw(sql, ...values);
                  locked.resolve();
                  await release.promise;
                  return result;
                };
              const value: unknown = Reflect.get(target, key);
              return value;
            },
          });
          return operation(wrapped);
        }, options),
    } as unknown as PrismaService;
    const participations = new ParticipationsService(
      prisma,
      new ParticipationPeriodsService(prisma),
    );
    return {
      service: new PredictionsService(
        prisma,
        new ScoreEngineService(),
        participations,
      ),
      pid,
      attempting,
      locked,
      release,
      lockAttempts: () => lockAttempts,
    };
  }

  async function blockedBy(waiter: number, blocker: number) {
    // Bounded observation only in this disposable test; never application polling.
    for (let attempt = 0; attempt < 40; attempt++) {
      const [row] = await observer.$queryRaw<
        Array<{ blocked: boolean }>
      >`SELECT ${blocker}::int = ANY(pg_blocking_pids(${waiter}::int)) AS blocked`;
      if (row.blocked) return;
      await new Promise((done) => setTimeout(done, 15));
    }
    throw new Error(
      'Expected real PostgreSQL lock contention was not observed.',
    );
  }

  function holdSync(data: Prisma.FixtureUpdateInput) {
    const ready = deferred<number>();
    const release = deferred<void>();
    releases.push(() => release.resolve());
    const done = track(
      sync.$transaction(
        async (tx) => {
          const [connection] = await tx.$queryRaw<
            Array<{ pid: number }>
          >`SELECT pg_backend_pid() AS pid`;
          await tx.fixture.update({ where: { id: fixtureId }, data });
          ready.resolve(connection.pid);
          await release.promise;
        },
        { timeout: 10_000 },
      ),
    );
    return { ready, release, done };
  }

  async function operation(
    method: 'POST' | 'PATCH',
    service: PredictionsService,
    homeGoals = 2,
  ) {
    if (method === 'POST')
      return service.create(userId, { fixtureId, homeGoals, awayGoals: 1 });
    const prediction = await db.prediction.findUniqueOrThrow({
      where: { userId_fixtureId: { userId, fixtureId } },
    });
    return service.update(userId, prediction.id, { homeGoals });
  }

  async function seedPrediction() {
    return db.prediction.create({
      data: { userId, fixtureId, homeGoals: 1, awayGoals: 0 },
    });
  }

  it('sem concorrência preserva criação, edição e duplicidade', async () => {
    const { service } = instrument();
    const created = await operation('POST', service);
    await expect(operation('POST', service)).rejects.toBeInstanceOf(
      ConflictException,
    );
    const updated = await operation('PATCH', service, 3);
    expect(updated).toMatchObject({ id: created.id, homeGoals: 3 });
    expect(await db.prediction.count()).toBe(1);
  });

  describe.each(['POST', 'PATCH'] as const)('%s', (method) => {
    it('sincronização vence: aguarda commit e recusa o novo kickoff de dezembro', async () => {
      if (method === 'PATCH') await seedPrediction();
      const scheduling = holdSync({ kickoff: decemberKickoff });
      const blocker = await scheduling.ready.promise;
      const attempt = instrument();
      const result = track(operation(method, attempt.service));
      await attempt.attempting.promise;
      await blockedBy(await attempt.pid.promise, blocker);
      scheduling.release.resolve();
      await scheduling.done;
      await expect(result).rejects.toBeInstanceOf(
        FutureParticipationPeriodException,
      );
      expect(await db.prediction.count()).toBe(method === 'POST' ? 0 : 1);
      if (method === 'PATCH')
        expect(await db.prediction.findFirst()).toMatchObject({ homeGoals: 1 });
    });

    it('palpite vence: sincronização aguarda; registro permanece e volta a ser editável em dezembro', async () => {
      if (method === 'PATCH') await seedPrediction();
      const attempt = instrument(true);
      const result = track(operation(method, attempt.service));
      await attempt.locked.promise;
      const schedulingPid = deferred<number>();
      const scheduling = track(
        sync.$transaction(
          async (tx) => {
            const [connection] = await tx.$queryRaw<
              Array<{ pid: number }>
            >`SELECT pg_backend_pid() AS pid`;
            schedulingPid.resolve(connection.pid);
            return tx.fixture.update({
              where: { id: fixtureId },
              data: { kickoff: decemberKickoff },
            });
          },
          { timeout: 10_000 },
        ),
      );
      await blockedBy(await schedulingPid.promise, await attempt.pid.promise);
      attempt.release.resolve();
      const prediction = await result;
      await scheduling;
      expect(await db.prediction.count()).toBe(1);
      await expect(
        instrument().service.update(userId, prediction.id, { homeGoals: 4 }),
      ).rejects.toBeInstanceOf(FutureParticipationPeriodException);
      jest.setSystemTime(new Date('2026-12-01T03:00:00Z'));
      await expect(
        instrument().service.update(userId, prediction.id, { homeGoals: 4 }),
      ).resolves.toMatchObject({ id: prediction.id, homeGoals: 4 });
      expect(await db.prediction.count()).toBe(1);
    });

    it.each([
      { kickoff: new Date('2026-11-08T14:59:59Z') },
      { status: FixtureStatus.LIVE },
      { status: FixtureStatus.FT },
    ])('usa kickoff/status atualizado depois da espera: %j', async (data) => {
      if (method === 'PATCH') await seedPrediction();
      const scheduling = holdSync(data);
      const blocker = await scheduling.ready.promise;
      const attempt = instrument();
      const result = track(operation(method, attempt.service));
      await attempt.attempting.promise;
      await blockedBy(await attempt.pid.promise, blocker);
      scheduling.release.resolve();
      await scheduling.done;
      await expect(result).rejects.toBeInstanceOf(ConflictException);
      expect(await db.prediction.count()).toBe(method === 'POST' ? 0 : 1);
    });
  });

  it('consulta o relógio após aguardar o lock', async () => {
    const scheduling = holdSync({ round: 2 });
    const blocker = await scheduling.ready.promise;
    const attempt = instrument();
    const result = track(operation('POST', attempt.service));
    await attempt.attempting.promise;
    await blockedBy(await attempt.pid.promise, blocker);
    jest.setSystemTime(novemberKickoff);
    scheduling.release.resolve();
    await scheduling.done;
    await expect(result).rejects.toBeInstanceOf(ConflictException);
    expect(await db.prediction.count()).toBe(0);
  });

  it('POST concorrentes preservam a constraint real de duplicidade', async () => {
    const first = instrument(true);
    const second = instrument(true);
    const one = track(operation('POST', first.service));
    const two = track(operation('POST', second.service));
    await Promise.all([first.locked.promise, second.locked.promise]);
    first.release.resolve();
    second.release.resolve();
    const results = await Promise.allSettled([one, two]);
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === 'rejected'),
    ).toHaveLength(1);
    const rejected = results.find(
      (result) => result.status === 'rejected',
    ) as PromiseRejectedResult;
    expect(rejected.reason).toBeInstanceOf(ConflictException);
    expect(await db.prediction.count()).toBe(1);
  });

  it('PATCH concorrentes compartilham o lock da Fixture e serializam a escrita da Prediction', async () => {
    const existing = await seedPrediction();
    const first = instrument(true);
    const second = instrument(true);
    const one = track(operation('PATCH', first.service, 2));
    const two = track(operation('PATCH', second.service, 3));
    await Promise.all([first.locked.promise, second.locked.promise]);
    first.release.resolve();
    second.release.resolve();
    await Promise.all([one, two]);
    const prediction = await db.prediction.findUniqueOrThrow({
      where: { id: existing.id },
    });
    expect([2, 3]).toContain(prediction.homeGoals);
    expect(prediction.awayGoals).toBe(0);
    expect(await db.prediction.count()).toBe(1);
  });

  it('o lock não bloqueia atualização de outra Fixture', async () => {
    const attempt = instrument(true);
    const result = track(operation('POST', attempt.service));
    await attempt.locked.promise;
    await expect(
      sync.fixture.update({
        where: { id: otherFixtureId },
        data: { kickoff: decemberKickoff },
      }),
    ).resolves.toMatchObject({ id: otherFixtureId });
    attempt.release.resolve();
    await result;
  });

  it('timeout desfaz a requisição, libera a conexão e não repete a tentativa automaticamente', async () => {
    const scheduling = holdSync({ round: 2 });
    await scheduling.ready.promise;
    const attempt = instrument();
    await expect(operation('POST', attempt.service)).rejects.toThrow(
      'Partida em atualização. Tente novamente.',
    );
    expect(attempt.lockAttempts()).toBe(1);
    expect(await db.prediction.count()).toBe(0);
    scheduling.release.resolve();
    await scheduling.done;
    await expect(
      operation('POST', instrument().service),
    ).resolves.toMatchObject({ userId, fixtureId });
  });
});
