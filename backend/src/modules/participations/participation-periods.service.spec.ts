import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ParticipationPeriodsService } from './participation-periods.service';

describe('ParticipationPeriodsService', () => {
  let periodUpsert: jest.Mock;
  let periodFindUnique: jest.Mock;
  let service: ParticipationPeriodsService;

  beforeEach(() => {
    periodUpsert = jest.fn();
    periodFindUnique = jest.fn();

    const prisma = {
      participationPeriod: {
        upsert: periodUpsert,
        findUnique: periodFindUnique,
      },
    } as unknown as PrismaService;

    service = new ParticipationPeriodsService(prisma);
  });

  it('recupera o periodo vencedor quando duas primeiras requisicoes disputam o mesmo mes', async () => {
    const storedPeriods: (typeof period)[] = [];
    let attempts = 0;
    let releaseBothAttempts: () => void = () => undefined;
    const bothAttemptsStarted = new Promise<void>((resolve) => {
      releaseBothAttempts = resolve;
    });

    periodUpsert.mockImplementation(async () => {
      attempts += 1;
      const attempt = attempts;

      if (attempt === 2) {
        releaseBothAttempts();
      }

      await bothAttemptsStarted;

      if (attempt === 1) {
        storedPeriods.push(period);
        return period;
      }

      throw periodReferenceConflict();
    });
    periodFindUnique.mockImplementation(() => storedPeriods[0] ?? null);

    const [first, second] = await Promise.all([
      service.getOrCreate(referenceDate),
      service.getOrCreate(referenceDate),
    ]);

    expect(first).toEqual(period);
    expect(second).toEqual(period);
    expect(storedPeriods).toHaveLength(1);
    expect(periodFindUnique).toHaveBeenCalledTimes(1);
    expect(periodFindUnique).toHaveBeenCalledWith({
      where: {
        referenceYear_referenceMonth: {
          referenceYear: 2026,
          referenceMonth: 10,
        },
      },
    });
  });

  it('nao ignora P2002 de outra constraint', async () => {
    const unrelatedConflict = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      {
        code: 'P2002',
        clientVersion: '6.19.3',
        meta: {
          modelName: 'ParticipationPeriod',
          target: ['id'],
        },
      },
    );
    periodUpsert.mockRejectedValue(unrelatedConflict);

    await expect(service.getOrCreate(referenceDate)).rejects.toBe(
      unrelatedConflict,
    );
    expect(periodFindUnique).not.toHaveBeenCalled();
  });

  it('propaga o conflito original se o periodo vencedor nao puder ser encontrado', async () => {
    const conflict = periodReferenceConflict();
    periodUpsert.mockRejectedValue(conflict);
    periodFindUnique.mockResolvedValue(null);

    await expect(service.getOrCreate(referenceDate)).rejects.toBe(conflict);
  });
});

const referenceDate = new Date('2026-10-05T15:00:00.000Z');
const period = {
  id: '11111111-1111-4111-8111-111111111111',
  referenceYear: 2026,
  referenceMonth: 10,
  startsAt: new Date('2026-10-01T03:00:00.000Z'),
  endsAt: new Date('2026-11-01T03:00:00.000Z'),
  participationFeeCents: 2500,
  status: 'OPEN',
  createdAt: new Date('2026-10-05T15:00:00.000Z'),
  updatedAt: new Date('2026-10-05T15:00:00.000Z'),
};

function periodReferenceConflict() {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: '6.19.3',
    meta: {
      modelName: 'ParticipationPeriod',
      target: ['reference_year', 'reference_month'],
    },
  });
}
