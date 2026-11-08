import { HttpException, HttpStatus } from '@nestjs/common';
import {
  getParticipationPeriodForDate,
  PARTICIPATION_TIME_ZONE,
} from './participation-period';

export class FutureParticipationPeriodException extends HttpException {
  constructor(kickoff: Date) {
    const period = getParticipationPeriodForDate(kickoff);
    const month = new Intl.DateTimeFormat('pt-BR', {
      timeZone: PARTICIPATION_TIME_ZONE,
      month: 'long',
      year: 'numeric',
    }).format(kickoff);

    super(
      {
        statusCode: HttpStatus.FORBIDDEN,
        code: 'FUTURE_PARTICIPATION_PERIOD',
        message: `Palpites para este jogo estarão disponíveis em ${month}.`,
        period: {
          referenceYear: period.referenceYear,
          referenceMonth: period.referenceMonth,
        },
      },
      HttpStatus.FORBIDDEN,
    );
  }
}
