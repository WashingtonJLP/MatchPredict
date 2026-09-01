import { ApiProperty } from '@nestjs/swagger';

import { DailyGameStatus } from '../types/daily-game.types';

export class DailyGameTeamResponseDto {
  @ApiProperty({ example: '17333' })
  id!: string;

  @ApiProperty({ example: 'Londrina' })
  name!: string;

  @ApiProperty({ example: 'LON', nullable: true })
  abbreviation!: string | null;

  @ApiProperty({
    example: 'https://a.espncdn.com/i/teamlogos/soccer/500/17333.png',
    nullable: true,
  })
  logo!: string | null;
}

export class DailyGameScoreResponseDto {
  @ApiProperty({ example: 0, nullable: true })
  home!: number | null;

  @ApiProperty({ example: 0, nullable: true })
  away!: number | null;
}

export class DailyGameResponseDto {
  @ApiProperty({ example: 'espn:bra.2:401860308' })
  id!: string;

  @ApiProperty({ example: '401860308' })
  sourceEventId!: string;

  @ApiProperty({ example: '2026-09-01T22:30:00.000Z' })
  kickoff!: string;

  @ApiProperty({ example: '2026-09-01' })
  localDate!: string;

  @ApiProperty({ example: '19:30' })
  localTime!: string;

  @ApiProperty({
    enum: [
      'SCHEDULED',
      'LIVE',
      'HALFTIME',
      'FINAL',
      'FINAL_PENALTIES',
      'DELAYED',
      'POSTPONED',
      'CANCELED',
      'SUSPENDED',
      'UNKNOWN',
    ],
    example: 'HALFTIME',
  })
  status!: DailyGameStatus;

  @ApiProperty({ example: 'Intervalo' })
  statusLabel!: string;

  @ApiProperty({ example: null, nullable: true })
  minute!: number | null;

  @ApiProperty({ example: 1, nullable: true })
  period!: number | null;

  @ApiProperty({ type: DailyGameTeamResponseDto })
  homeTeam!: DailyGameTeamResponseDto;

  @ApiProperty({ type: DailyGameTeamResponseDto })
  awayTeam!: DailyGameTeamResponseDto;

  @ApiProperty({ type: DailyGameScoreResponseDto })
  score!: DailyGameScoreResponseDto;
}

export class DailyGamesCompetitionResponseDto {
  @ApiProperty({ example: 'bra.2' })
  id!: string;

  @ApiProperty({ example: 'Brasileirão Série B' })
  name!: string;

  @ApiProperty({
    example: 'https://a.espncdn.com/i/leaguelogos/soccer/500/2299.png',
    nullable: true,
  })
  logo!: string | null;

  @ApiProperty({ type: DailyGameResponseDto, isArray: true })
  games!: DailyGameResponseDto[];
}

export class DailyGamesMetaResponseDto {
  @ApiProperty({ example: '2026-09-01T22:30:00.000Z' })
  generatedAt!: string;

  @ApiProperty({ example: 60 })
  cacheTtlSeconds!: number;

  @ApiProperty({ example: 12 })
  requestedCompetitions!: number;

  @ApiProperty({ example: 11 })
  successfulCompetitions!: number;

  @ApiProperty({ example: 1 })
  failedCompetitions!: number;
}

export class DailyGamesResponseDto {
  @ApiProperty({ example: '2026-09-01' })
  date!: string;

  @ApiProperty({ example: 'America/Sao_Paulo' })
  timezone!: string;

  @ApiProperty({ type: DailyGamesCompetitionResponseDto, isArray: true })
  competitions!: DailyGamesCompetitionResponseDto[];

  @ApiProperty({ type: DailyGamesMetaResponseDto })
  meta!: DailyGamesMetaResponseDto;
}
