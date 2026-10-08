import { ParticipationStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ParticipationPeriodsService } from './participation-periods.service';
import { ParticipationRequiredException } from './participation-required.exception';
import { ParticipationsService } from './participations.service';

describe('ParticipationsService', () => {
  let service: ParticipationsService;
  let participationFindFirst: jest.Mock;
  let periodFindUnique: jest.Mock;

  beforeEach(() => {
    participationFindFirst = jest.fn();
    periodFindUnique = jest.fn();

    const prisma = {
      participation: {
        findFirst: participationFindFirst,
      },
      participationPeriod: {
        findUnique: periodFindUnique,
      },
    } as unknown as PrismaService;
    const periodsService = new ParticipationPeriodsService(prisma);

    service = new ParticipationsService(prisma, periodsService);
  });

  it('permite quando existe Participation ACTIVE no período do kickoff', async () => {
    participationFindFirst.mockResolvedValue({ id: 'participation-id' });
    const kickoff = new Date('2026-10-12T19:00:00.000Z');

    await expect(
      service.assertActiveForFixture(userId, kickoff),
    ).resolves.toBeUndefined();

    expect(participationFindFirst).toHaveBeenCalledWith({
      where: {
        userId,
        status: ParticipationStatus.ACTIVE,
        period: {
          status: 'OPEN',
          startsAt: { lte: kickoff },
          endsAt: { gt: kickoff },
        },
      },
      select: { id: true },
    });
  });

  it('bloqueia quando não há participação, inclusive com Payment PENDING', async () => {
    participationFindFirst.mockResolvedValue(null);

    await expect(
      service.assertActiveForFixture(
        userId,
        new Date('2026-10-12T19:00:00.000Z'),
      ),
    ).rejects.toBeInstanceOf(ParticipationRequiredException);
  });

  it('nÃ£o reaproveita participaÃ§Ã£o de outubro para kickoff de novembro', async () => {
    participationFindFirst.mockResolvedValue(null);
    const novemberKickoff = new Date('2026-11-01T03:00:00.000Z');

    await expect(
      service.assertActiveForFixture(userId, novemberKickoff),
    ).rejects.toBeInstanceOf(ParticipationRequiredException);

    expect(participationFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId,
          period: expect.objectContaining({
            startsAt: { lte: novemberKickoff },
            endsAt: { gt: novemberKickoff },
          }),
        }),
      }),
    );
  });

  it('retorna o período atual sem criar registro durante uma consulta', async () => {
    periodFindUnique.mockResolvedValue(null);

    await expect(
      service.findCurrentForUser(userId, new Date('2026-10-05T15:00:00.000Z')),
    ).resolves.toMatchObject({
      active: false,
      status: null,
      period: {
        referenceYear: 2026,
        referenceMonth: 10,
        participationFeeCents: 2500,
        currency: 'BRL',
      },
    });
  });
});

const userId = '11111111-1111-4111-8111-111111111111';
