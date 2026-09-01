import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

export class DailyGamesQueryDto {
  @ApiProperty({
    example: '2026-09-01',
    description: 'Data civil em America/Sao_Paulo no formato YYYY-MM-DD.',
  })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date deve estar no formato YYYY-MM-DD.',
  })
  date!: string;
}
