import { Injectable } from '@nestjs/common';
import { ParticipationPeriodStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  getParticipationPeriodForDate,
  MONTHLY_PARTICIPATION_FEE_CENTS,
} from './participation-period';

@Injectable()
export class ParticipationPeriodsService {
  constructor(private readonly prisma: PrismaService) {}

  getDescriptor(date: Date) {
    return getParticipationPeriodForDate(date);
  }

  async getOrCreate(date: Date) {
    const descriptor = this.getDescriptor(date);
    const where = {
      referenceYear_referenceMonth: {
        referenceYear: descriptor.referenceYear,
        referenceMonth: descriptor.referenceMonth,
      },
    };

    try {
      return await this.prisma.participationPeriod.upsert({
        where,
        update: {},
        create: {
          ...descriptor,
          participationFeeCents: MONTHLY_PARTICIPATION_FEE_CENTS,
          status: ParticipationPeriodStatus.OPEN,
        },
      });
    } catch (error) {
      if (!this.isPeriodReferenceUniquenessConflict(error)) {
        throw error;
      }

      const existingPeriod = await this.prisma.participationPeriod.findUnique({
        where,
      });

      if (!existingPeriod) {
        throw error;
      }

      return existingPeriod;
    }
  }

  private isPeriodReferenceUniquenessConflict(error: unknown) {
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== 'P2002'
    ) {
      return false;
    }

    const modelName = error.meta?.modelName;

    if (modelName !== undefined && modelName !== 'ParticipationPeriod') {
      return false;
    }

    const target = error.meta?.target;

    if (typeof target === 'string') {
      return (
        target === 'participation_periods_reference_year_reference_month_key'
      );
    }

    if (!Array.isArray(target) || target.length !== 2) {
      return false;
    }

    const fields = new Set(target);

    return (
      (fields.has('referenceYear') && fields.has('referenceMonth')) ||
      (fields.has('reference_year') && fields.has('reference_month'))
    );
  }
}
