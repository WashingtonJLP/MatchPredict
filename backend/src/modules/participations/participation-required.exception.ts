import { HttpException, HttpStatus } from '@nestjs/common';
import { getParticipationPeriodForDate } from './participation-period';

export class ParticipationRequiredException extends HttpException {
  constructor(kickoff: Date) {
    const period = getParticipationPeriodForDate(kickoff);

    super(
      {
        statusCode: HttpStatus.PAYMENT_REQUIRED,
        code: 'PARTICIPATION_REQUIRED',
        message:
          'É necessária uma participação mensal ativa para palpitar neste período.',
        period: {
          referenceYear: period.referenceYear,
          referenceMonth: period.referenceMonth,
        },
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }
}
