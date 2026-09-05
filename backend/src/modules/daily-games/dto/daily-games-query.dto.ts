import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, Matches } from 'class-validator';

import {
  DAILY_GAMES_COMPETITIONS,
  DailyGamesCompetitionId,
} from '../types/daily-game.types';

const dailyGamesCompetitionIds = DAILY_GAMES_COMPETITIONS.map(
  (competition) => competition.id,
);

export class DailyGamesQueryDto {
  @ApiProperty({
    example: '2026-09-01',
    description: 'Data civil em America/Sao_Paulo no formato YYYY-MM-DD.',
  })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date deve estar no formato YYYY-MM-DD.',
  })
  date!: string;

  @ApiPropertyOptional({
    enum: dailyGamesCompetitionIds,
    example: 'eng.1',
    description:
      'Limita a resposta a uma competicao. Quando omitido, mantem todas as competicoes configuradas.',
  })
  @IsOptional()
  @IsIn(dailyGamesCompetitionIds)
  competition?: DailyGamesCompetitionId;
}
