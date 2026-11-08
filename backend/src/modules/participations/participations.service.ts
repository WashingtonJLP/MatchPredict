import { Injectable } from '@nestjs/common';
import {
  ParticipationPeriodStatus,
  ParticipationStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  MONTHLY_PARTICIPATION_FEE_CENTS,
  PARTICIPATION_CURRENCY,
} from './participation-period';
import { ParticipationPeriodsService } from './participation-periods.service';
import { ParticipationRequiredException } from './participation-required.exception';
import { FutureParticipationPeriodException } from './future-participation-period.exception';

@Injectable()
export class ParticipationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly periodsService: ParticipationPeriodsService,
  ) {}

  async findCurrentForUser(userId: string, now = new Date()) {
    const descriptor = this.periodsService.getDescriptor(now);
    const period = await this.prisma.participationPeriod.findUnique({
      where: {
        referenceYear_referenceMonth: {
          referenceYear: descriptor.referenceYear,
          referenceMonth: descriptor.referenceMonth,
        },
      },
      select: {
        referenceYear: true,
        referenceMonth: true,
        startsAt: true,
        endsAt: true,
        participationFeeCents: true,
        status: true,
        participations: {
          where: {
            userId,
            status: ParticipationStatus.ACTIVE,
          },
          select: {
            status: true,
            activatedAt: true,
          },
          take: 1,
        },
      },
    });
    const participation = period?.participations[0] ?? null;

    return {
      active:
        period?.status === ParticipationPeriodStatus.OPEN &&
        participation?.status === ParticipationStatus.ACTIVE,
      status: participation?.status ?? null,
      activatedAt: participation?.activatedAt ?? null,
      period: {
        referenceYear: period?.referenceYear ?? descriptor.referenceYear,
        referenceMonth: period?.referenceMonth ?? descriptor.referenceMonth,
        startsAt: period?.startsAt ?? descriptor.startsAt,
        endsAt: period?.endsAt ?? descriptor.endsAt,
        participationFeeCents:
          period?.participationFeeCents ?? MONTHLY_PARTICIPATION_FEE_CENTS,
        currency: PARTICIPATION_CURRENCY,
      },
    };
  }

  async assertActiveForFixture(
    userId: string,
    kickoff: Date,
    db: Pick<Prisma.TransactionClient, 'participation'> = this.prisma,
  ) {
    const fixturePeriod = this.periodsService.getDescriptor(kickoff);
    const currentPeriod = this.periodsService.getDescriptor(new Date());

    if (fixturePeriod.startsAt.getTime() > currentPeriod.startsAt.getTime()) {
      throw new FutureParticipationPeriodException(kickoff);
    }

    const participation = await db.participation.findFirst({
      where: {
        userId,
        status: ParticipationStatus.ACTIVE,
        period: {
          status: ParticipationPeriodStatus.OPEN,
          referenceYear: fixturePeriod.referenceYear,
          referenceMonth: fixturePeriod.referenceMonth,
          startsAt: { lte: kickoff },
          endsAt: { gt: kickoff },
        },
      },
      select: {
        id: true,
      },
    });

    if (!participation) {
      throw new ParticipationRequiredException(kickoff);
    }
  }
}
