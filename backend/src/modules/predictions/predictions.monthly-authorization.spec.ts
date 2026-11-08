import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  FixtureStatus,
  ParticipationPeriodStatus,
  ParticipationStatus,
  PaymentStatus,
  Prisma,
  Role,
} from '@prisma/client';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ScoreEngineService } from '../../common/score-engine/score-engine.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { getParticipationPeriodForDate } from '../participations/participation-period';
import { ParticipationPeriodsService } from '../participations/participation-periods.service';
import { ParticipationsService } from '../participations/participations.service';
import { PredictionProcessorService } from './prediction-processor.service';
import { PredictionsController } from './predictions.controller';
import { PredictionsService } from './predictions.service';

const userId = '11111111-1111-4111-8111-111111111111';
const fixtureId = '22222222-2222-4222-8222-222222222222';
const predictionId = '33333333-3333-4333-8333-333333333333';
const novemberNow = '2026-11-08T15:00:00.000Z';

type Entitlement = {
  userId: string;
  status: ParticipationStatus;
  paymentId: string | null;
  period: ReturnType<typeof getParticipationPeriodForDate> & {
    status: ParticipationPeriodStatus;
  };
};
type ParticipationQuery = {
  where: {
    userId: string;
    status: ParticipationStatus;
    period: {
      status: ParticipationPeriodStatus;
      referenceYear: number;
      referenceMonth: number;
      startsAt: { lte: Date };
      endsAt: { gt: Date };
    };
  };
};

describe('Prediction monthly authorization over HTTP', () => {
  let app: INestApplication<App>;
  let entitlements: Entitlement[];
  let fixture: ReturnType<typeof makeFixture>;
  let predictions: Array<ReturnType<typeof makePrediction>>;
  let participationFindFirst: jest.Mock;
  let predictionCreate: jest.Mock;
  let predictionUpdate: jest.Mock;
  let beforeFixtureLock: (() => void) | undefined;
  let paymentStatus: PaymentStatus | null;
  let authenticatedRole: Role;

  beforeAll(async () => {
    participationFindFirst = jest.fn(({ where }: ParticipationQuery) => {
      const found = entitlements.find(
        (entry) =>
          entry.userId === where.userId &&
          entry.status === where.status &&
          entry.period.status === where.period.status &&
          entry.period.referenceYear === where.period.referenceYear &&
          entry.period.referenceMonth === where.period.referenceMonth &&
          entry.period.startsAt <= where.period.startsAt.lte &&
          entry.period.endsAt > where.period.endsAt.gt,
      );
      return Promise.resolve(found ? { id: 'entitlement' } : null);
    });
    predictionCreate = jest.fn(
      ({ data }: { data: { homeGoals: number; awayGoals: number } }) => {
        if (predictions.length) {
          throw new Prisma.PrismaClientKnownRequestError(
            'Duplicate prediction',
            {
              code: 'P2002',
              clientVersion: '6.19.3',
            },
          );
        }
        const prediction = { ...makePrediction(fixture), ...data };
        predictions.push(prediction);
        return Promise.resolve(prediction);
      },
    );
    predictionUpdate = jest.fn(
      ({ data }: { data: Prisma.PredictionUpdateInput }) => {
        Object.assign(predictions[0], data);
        return Promise.resolve(predictions[0]);
      },
    );
    const prisma = {
      $transaction: jest.fn((callback: (tx: unknown) => Promise<unknown>) =>
        callback({
          fixture: {
            updateMany: jest.fn(() => {
              fixture.processedAt = new Date();
              return Promise.resolve({ count: 1 });
            }),
          },
          prediction: {
            findMany: jest.fn(() => Promise.resolve(predictions)),
            update: predictionUpdate,
          },
          standing: {
            findUnique: jest.fn(() => Promise.resolve(null)),
            upsert: jest.fn(() => Promise.resolve({})),
          },
        }),
      ),
      fixture: {
        findUnique: jest.fn(() => Promise.resolve(structuredClone(fixture))),
      },
      participation: { findFirst: participationFindFirst },
      payment: {
        findFirst: jest.fn(() =>
          Promise.resolve(paymentStatus ? { status: paymentStatus } : null),
        ),
      },
      prediction: {
        findUnique: jest.fn(
          ({
            where,
          }: {
            where: {
              id?: string;
              userId_fixtureId?: { userId: string; fixtureId: string };
            };
          }) => {
            const prediction = predictions.find((prediction) =>
              where.id
                ? prediction.id === where.id
                : prediction.userId === where.userId_fixtureId?.userId &&
                  prediction.fixtureId === where.userId_fixtureId?.fixtureId,
            );
            return Promise.resolve(
              prediction ? structuredClone({ ...prediction, fixture }) : null,
            );
          },
        ),
        findMany: jest.fn(
          ({ where }: { where: { userId?: string; fixtureId?: string } }) =>
            Promise.resolve(
              predictions.filter(
                (prediction) =>
                  (!where.userId || prediction.userId === where.userId) &&
                  (!where.fixtureId ||
                    prediction.fixtureId === where.fixtureId),
              ),
            ),
        ),
        create: predictionCreate,
        update: predictionUpdate,
        delete: jest.fn(() => {
          predictions.splice(0, 1);
          return Promise.resolve();
        }),
      },
    };
    const processorTransaction = prisma.$transaction.getMockImplementation()!;
    const predictionTx = {
      prediction: prisma.prediction,
      participation: prisma.participation,
      $executeRaw: jest.fn(() => Promise.resolve(0)),
      $queryRaw: jest.fn((sql: TemplateStringsArray) => {
        expect(sql.join('?')).toMatch(/WHERE id = \?::uuid FOR SHARE/);
        // Simulate the rescheduler committing before the blocking SELECT obtains its lock.
        beforeFixtureLock?.();
        return Promise.resolve([structuredClone(fixture)]);
      }),
    };
    prisma.$transaction.mockImplementation(
      (callback: (tx: unknown) => Promise<unknown>, options?: unknown) =>
        options ? callback(predictionTx) : processorTransaction(callback),
    );
    const module = await Test.createTestingModule({
      controllers: [PredictionsController],
      providers: [
        PredictionsService,
        ParticipationsService,
        ParticipationPeriodsService,
        ScoreEngineService,
        { provide: PrismaService, useValue: prisma },
        PredictionProcessorService,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate(context: ExecutionContext) {
          context
            .switchToHttp()
            .getRequest<{ user: { id: string; role: Role } }>().user = {
            id: userId,
            role: authenticatedRole,
          };
          return true;
        },
      })
      .compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  beforeEach(() => {
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
      .setSystemTime(new Date(novemberNow));
    entitlements = [];
    fixture = makeFixture('2026-11-20T19:00:00Z');
    predictions = [];
    beforeFixtureLock = undefined;
    paymentStatus = PaymentStatus.PAID;
    authenticatedRole = Role.USER;
    jest.clearAllMocks();
  });
  afterEach(() => jest.useRealTimers());
  afterAll(async () => {
    await app.close();
  });

  function addParticipation(
    year = 2026,
    month = 11,
    status: ParticipationStatus = ParticipationStatus.ACTIVE,
  ) {
    const entry: Entitlement = {
      userId,
      status,
      paymentId: 'paid-payment',
      period: {
        ...getParticipationPeriodForDate(
          new Date(Date.UTC(year, month - 1, 15, 12)),
        ),
        status: ParticipationPeriodStatus.OPEN,
      },
    };
    entitlements.push(entry);
    return entry;
  }

  async function write(
    method: 'post' | 'patch',
    expectedStatus: number,
    code?: string,
  ) {
    if (method === 'patch') predictions.push(makePrediction(fixture));
    const before = JSON.stringify(predictions);
    const response = await request(app.getHttpServer())
      [method](
        method === 'post'
          ? '/api/v1/predictions'
          : `/api/v1/predictions/${predictionId}`,
      )
      .send({
        ...(method === 'post' ? { fixtureId } : {}),
        homeGoals: 3,
        awayGoals: 2,
      })
      .expect(expectedStatus);
    if (code) expect(response.body).toMatchObject({ code });
    if (expectedStatus >= 400) {
      expect(predictionCreate).not.toHaveBeenCalled();
      expect(predictionUpdate).not.toHaveBeenCalled();
      expect(JSON.stringify(predictions)).toBe(before);
    }
    return response;
  }

  describe.each(['post', 'patch'] as const)('%s', (method) => {
    it('permite novembro pago, em novembro, antes do kickoff', async () => {
      addParticipation();
      await write(method, method === 'post' ? 201 : 200);
      expect(predictions[0]).toMatchObject({ homeGoals: 3, awayGoals: 2 });
    });
    it.each(['2026-12-20T19:00:00Z', '2027-01-20T19:00:00Z'])(
      'bloqueia novembro pago para %s',
      async (kickoff) => {
        addParticipation();
        fixture = makeFixture(kickoff);
        await write(method, 403, 'FUTURE_PARTICIPATION_PERIOD');
        expect(participationFindFirst).not.toHaveBeenCalled();
      },
    );
    it('bloqueia até participação ACTIVE futura já existente', async () => {
      addParticipation(2026, 12);
      fixture = makeFixture('2026-12-20T19:00:00Z');
      const response = await write(method, 403, 'FUTURE_PARTICIPATION_PERIOD');
      expect(response.body).toMatchObject({
        period: { referenceYear: 2026, referenceMonth: 12 },
      });
    });
    it('libera dezembro pago apenas quando dezembro começa em São Paulo', async () => {
      addParticipation(2026, 12);
      fixture = makeFixture('2026-12-20T19:00:00Z');
      jest.setSystemTime(new Date('2026-12-01T02:59:59.999Z'));
      await write(method, 403, 'FUTURE_PARTICIPATION_PERIOD');
      predictions = [];
      jest.setSystemTime(new Date('2026-12-01T03:00:00.000Z'));
      await write(method, method === 'post' ? 201 : 200);
    });
    it('dezembro pago não autoriza janeiro do ano seguinte', async () => {
      addParticipation(2026, 12);
      fixture = makeFixture('2027-01-20T19:00:00Z');
      jest.setSystemTime(new Date('2026-12-20T15:00:00Z'));
      await write(method, 403, 'FUTURE_PARTICIPATION_PERIOD');
      predictions = [];
      jest.setSystemTime(new Date('2027-01-01T03:00:00Z'));
      await write(method, 402, 'PARTICIPATION_REQUIRED');
    });
    it('classifica kickoff antes da meia-noite local como novembro', async () => {
      addParticipation();
      fixture = makeFixture('2026-12-01T02:59:59.999Z');
      await write(method, method === 'post' ? 201 : 200);
    });
    it('kickoff exatamente na virada é futuro antes do limite e fechado no limite', async () => {
      addParticipation(2026, 12);
      fixture = makeFixture('2026-12-01T03:00:00.000Z');
      jest.setSystemTime(new Date('2026-12-01T02:59:59.999Z'));
      await write(method, 403, 'FUTURE_PARTICIPATION_PERIOD');
      predictions = [];
      jest.setSystemTime(new Date('2026-12-01T03:00:00.000Z'));
      await write(method, 409);
    });
    it('pagamento PENDING sem Participation ACTIVE não autoriza', async () => {
      paymentStatus = PaymentStatus.PENDING;
      await write(method, 402, 'PARTICIPATION_REQUIRED');
    });
    it('participação cancelada não autoriza', async () => {
      addParticipation(2026, 11, ParticipationStatus.CANCELLED);
      await write(method, 402, 'PARTICIPATION_REQUIRED');
    });
    it('período CLOSED não autoriza', async () => {
      addParticipation().period.status = ParticipationPeriodStatus.CLOSED;
      await write(method, 402, 'PARTICIPATION_REQUIRED');
    });
    it('exige competência mesmo com intervalo inconsistente abrangendo o kickoff', async () => {
      const entry = addParticipation(2026, 10);
      entry.period.endsAt = new Date('2027-02-01T03:00:00Z');
      await write(method, 402, 'PARTICIPATION_REQUIRED');
    });
    it('exige intervalo mesmo com competência correta', async () => {
      addParticipation().period.endsAt = fixture.kickoff;
      await write(method, 402, 'PARTICIPATION_REQUIRED');
    });
    it.each(['2026-11-08T15:00:00Z', '2026-11-08T14:59:59.999Z'])(
      'preserva bloqueio por kickoff %s',
      async (kickoff) => {
        addParticipation();
        fixture = makeFixture(kickoff);
        await write(method, 409);
        expect(participationFindFirst).not.toHaveBeenCalled();
      },
    );
    it.each([FixtureStatus.LIVE, FixtureStatus.FT])(
      'preserva bloqueio por status %s',
      async (status) => {
        addParticipation();
        fixture.status = status;
        await write(method, 409);
      },
    );
  });

  describe('PUNK: payload, dados inconsistentes e caminhos alternativos', () => {
    it('ADMIN também não cria palpite de competência futura', async () => {
      authenticatedRole = Role.ADMIN;
      addParticipation(2026, 12);
      fixture = makeFixture('2026-12-20T19:00:00Z');
      await write('post', 403, 'FUTURE_PARTICIPATION_PERIOD');
    });
    it.each(['post', 'patch'] as const)(
      '%s recusa campos adulterados sem gravar',
      async (method) => {
        addParticipation();
        predictions = method === 'patch' ? [makePrediction(fixture)] : [];
        for (const field of [
          'kickoff',
          'userId',
          'periodId',
          'fixture',
          'referenceYear',
          'referenceMonth',
          'status',
          'totalPoints',
        ]) {
          await request(app.getHttpServer())
            [method](
              method === 'post'
                ? '/api/v1/predictions'
                : `/api/v1/predictions/${predictionId}`,
            )
            .send({
              ...(method === 'post' ? { fixtureId } : {}),
              homeGoals: 2,
              awayGoals: 1,
              [field]: field === 'kickoff' ? novemberNow : userId,
            })
            .expect(400);
        }
        if (method === 'patch') {
          await request(app.getHttpServer())
            .patch(`/api/v1/predictions/${predictionId}`)
            .send({ fixtureId, homeGoals: 2 })
            .expect(400);
        }
        expect(predictionCreate).not.toHaveBeenCalled();
        expect(predictionUpdate).not.toHaveBeenCalled();
      },
    );

    it('usuário A não altera nem exclui palpite do usuário B', async () => {
      addParticipation();
      predictions = [
        {
          ...makePrediction(fixture),
          userId: '44444444-4444-4444-8444-444444444444',
        },
      ];
      await request(app.getHttpServer())
        .patch(`/api/v1/predictions/${predictionId}`)
        .send({ homeGoals: 2 })
        .expect(403);
      await request(app.getHttpServer())
        .delete(`/api/v1/predictions/${predictionId}`)
        .expect(403);
      expect(predictionUpdate).not.toHaveBeenCalled();
      expect(predictions[0].homeGoals).toBe(1);
    });

    it.each(['post', 'patch'] as const)(
      '%s não aceita novembro com endsAt invadindo dezembro',
      async (method) => {
        const entry = addParticipation();
        entry.period.endsAt = new Date('2027-02-01T03:00:00Z');
        fixture = makeFixture('2026-12-20T19:00:00Z');
        jest.setSystemTime(new Date('2026-12-01T03:00:00Z'));
        await write(method, 402, 'PARTICIPATION_REQUIRED');
      },
    );

    it.each(['post', 'patch'] as const)(
      '%s não aceita dezembro com startsAt invadindo novembro',
      async (method) => {
        addParticipation(2026, 12).period.startsAt = new Date(
          '2026-11-01T03:00:00Z',
        );
        await write(method, 402, 'PARTICIPATION_REQUIRED');
      },
    );

    it('reagendamento concluído novembro -> dezembro bloqueia edição; dezembro -> novembro libera', async () => {
      addParticipation();
      predictions = [makePrediction(fixture)];
      fixture.kickoff = new Date('2026-12-20T19:00:00Z');
      await request(app.getHttpServer())
        .patch(`/api/v1/predictions/${predictionId}`)
        .send({ homeGoals: 2 })
        .expect(403);
      fixture.kickoff = new Date('2026-11-20T19:00:00Z');
      await request(app.getHttpServer())
        .patch(`/api/v1/predictions/${predictionId}`)
        .send({ homeGoals: 2 })
        .expect(200);
      expect(predictions).toHaveLength(1);
    });

    it('ACTIVE sem Payment associado autoriza somente o seu mês, conforme fonte de verdade atual', async () => {
      paymentStatus = null;
      addParticipation().paymentId = null;
      await write('post', 201);
      fixture = makeFixture('2026-12-20T19:00:00Z');
      await request(app.getHttpServer())
        .patch(`/api/v1/predictions/${predictionId}`)
        .send({ homeGoals: 2 })
        .expect(403);
    });

    it('Payment PAID sem Participation ACTIVE não autoriza', async () => {
      paymentStatus = PaymentStatus.PAID;
      await write('post', 402, 'PARTICIPATION_REQUIRED');
      predictions = [];
      addParticipation(2026, 11, ParticipationStatus.CANCELLED);
      await write('patch', 402, 'PARTICIPATION_REQUIRED');
    });

    it('delete de palpite futuro continua permitido ao proprietário antes do kickoff, sem criar acesso', async () => {
      fixture = makeFixture('2026-12-20T19:00:00Z');
      predictions = [makePrediction(fixture)];
      await request(app.getHttpServer())
        .delete(`/api/v1/predictions/${predictionId}`)
        .expect(200);
      expect(predictions).toHaveLength(0);
      expect(participationFindFirst).not.toHaveBeenCalled();
      await write('post', 403, 'FUTURE_PARTICIPATION_PERIOD');
    });

    it('USER não usa cálculo ou processamento administrativo como edição alternativa', async () => {
      predictions = [makePrediction(fixture)];
      await request(app.getHttpServer())
        .post(`/api/v1/predictions/calculate/${predictionId}`)
        .expect(403);
      await request(app.getHttpServer())
        .post(`/api/v1/predictions/process/${fixtureId}`)
        .expect(403);
      expect(predictionUpdate).not.toHaveBeenCalled();
    });

    it('ADMIN não processa jogo futuro NS como resultado final', async () => {
      authenticatedRole = Role.ADMIN;
      fixture = makeFixture('2026-12-20T19:00:00Z');
      predictions = [makePrediction(fixture)];
      await request(app.getHttpServer())
        .post(`/api/v1/predictions/process/${fixtureId}`)
        .expect(400);
      expect(predictionUpdate).not.toHaveBeenCalled();
    });

    it('cálculo ADMIN de palpite legado altera apenas pontos, sem reescrever placar previsto', async () => {
      fixture = makeFixture('2026-12-20T19:00:00Z');
      fixture.status = FixtureStatus.FT;
      fixture.homeGoals = 1;
      fixture.awayGoals = 0;
      predictions = [makePrediction(fixture)];
      authenticatedRole = Role.ADMIN;
      await request(app.getHttpServer())
        .post(`/api/v1/predictions/calculate/${predictionId}`)
        .expect(201);
      expect(predictions[0]).toMatchObject({
        homeGoals: 1,
        awayGoals: 0,
        totalPoints: 3,
      });
      expect(participationFindFirst).not.toHaveBeenCalled();
    });

    it('processamento de legado FT preserva placar previsto e não aplica autorização mensal retroativa', async () => {
      authenticatedRole = Role.ADMIN;
      fixture = makeFixture('2026-12-20T19:00:00Z');
      fixture.status = FixtureStatus.FT;
      fixture.homeGoals = 1;
      fixture.awayGoals = 0;
      predictions = [makePrediction(fixture)];
      const response = await request(app.getHttpServer())
        .post(`/api/v1/predictions/process/${fixtureId}`)
        .expect(201);
      expect(response.body).toMatchObject({
        predictionsProcessed: 1,
        standingsUpdated: 1,
      });
      expect(predictions[0]).toMatchObject({
        homeGoals: 1,
        awayGoals: 0,
        totalPoints: 3,
      });
      expect(participationFindFirst).not.toHaveBeenCalled();
    });

    it('Transparência não depende de participação mensal nem da competência futura', async () => {
      fixture = makeFixture('2026-12-20T19:00:00Z');
      predictions = [
        makePrediction(fixture),
        {
          ...makePrediction(fixture),
          id: 'other-prediction',
          userId: '44444444-4444-4444-8444-444444444444',
        },
      ];
      const open = await request(app.getHttpServer())
        .get(`/api/v1/predictions/fixture/${fixtureId}/transparency`)
        .expect(200);
      expect(open.body).toMatchObject({ isClosedForPrediction: false });
      expect(open.body.predictions).toHaveLength(1);
      expect(open.body.predictions[0].id).toBe(predictionId);
      fixture.status = FixtureStatus.LIVE;
      const closed = await request(app.getHttpServer())
        .get(`/api/v1/predictions/fixture/${fixtureId}/transparency`)
        .expect(200);
      expect(closed.body).toMatchObject({ isClosedForPrediction: true });
      expect(closed.body.predictions).toHaveLength(2);
      expect(participationFindFirst).not.toHaveBeenCalled();
    });

    it('dez POST concorrentes futuros não gravam; dez válidos não duplicam usuário/fixture', async () => {
      addParticipation();
      fixture = makeFixture('2026-12-20T19:00:00Z');
      const send = () =>
        request(app.getHttpServer())
          .post('/api/v1/predictions')
          .send({ fixtureId, homeGoals: 2, awayGoals: 1 });
      const future = await Promise.all(Array.from({ length: 10 }, send));
      expect(future.map((response) => response.status)).toEqual(
        Array(10).fill(403),
      );
      expect(predictions).toHaveLength(0);
      fixture = makeFixture('2026-11-20T19:00:00Z');
      const current = await Promise.all(Array.from({ length: 10 }, send));
      expect(
        current.filter((response) => response.status === 201),
      ).toHaveLength(1);
      expect(
        current.filter((response) => response.status === 409),
      ).toHaveLength(9);
      expect(predictions).toHaveLength(1);
    });

    // Keep both P1 rejection assertions. The mocked rescheduler wins before lock
    // acquisition; the opposite order is tested with real PostgreSQL row locks.
    it.each(['post', 'patch'] as const)(
      'P1: %s deve recusar reagendamento concorrente novembro -> dezembro',
      async (method) => {
        addParticipation();
        beforeFixtureLock = () => {
          fixture.kickoff = new Date('2026-12-20T19:00:00Z');
        };
        await write(method, 403, 'FUTURE_PARTICIPATION_PERIOD');
      },
    );
  });

  it('mantém históricos e palpites futuros legíveis e inalterados sem participação', async () => {
    const historical = {
      ...makePrediction(makeFixture('2026-10-20T19:00:00Z')),
      totalPoints: 10,
    };
    historical.fixture.status = FixtureStatus.FT;
    predictions = [
      historical,
      makePrediction(makeFixture('2026-12-20T19:00:00Z')),
    ];
    const before = JSON.stringify(predictions);
    const response = await request(app.getHttpServer())
      .get('/api/v1/predictions/my')
      .expect(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0]).toMatchObject({
      homeGoals: 1,
      awayGoals: 0,
      totalPoints: 10,
    });
    expect(JSON.stringify(predictions)).toBe(before);
    expect(participationFindFirst).not.toHaveBeenCalled();
    expect(predictionUpdate).not.toHaveBeenCalled();
  });
});

function makeFixture(kickoff: string) {
  return {
    id: fixtureId,
    apiFixtureId: 123,
    kickoff: new Date(kickoff),
    status: FixtureStatus.NS as FixtureStatus,
    homeGoals: null as number | null,
    awayGoals: null as number | null,
    processedAt: null as Date | null,
    homeTeam: { name: 'Casa' },
    awayTeam: { name: 'Visitante' },
  };
}
function makePrediction(fixture: ReturnType<typeof makeFixture>) {
  return {
    id: predictionId,
    fixtureId,
    userId,
    homeGoals: 1,
    awayGoals: 0,
    totalPoints: 0,
    fixture: structuredClone(fixture),
  };
}
