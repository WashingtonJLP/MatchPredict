import { ApiProperty } from '@nestjs/swagger';

export class RoundCatalogRoundResponseDto {
  @ApiProperty({ example: 8 })
  number!: number;

  @ApiProperty({ example: 10 })
  fixtureCount!: number;

  @ApiProperty({ example: '2026-10-23T19:00:00.000Z' })
  startsAt!: Date;

  @ApiProperty({ example: '2026-10-25T16:30:00.000Z' })
  endsAt!: Date;
}

export class RoundCatalogSeasonResponseDto {
  @ApiProperty({ example: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' })
  id!: string;

  @ApiProperty({ example: 2026 })
  year!: number;

  @ApiProperty({ example: '2026/2027' })
  name!: string;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: 8, nullable: true })
  defaultRound!: number | null;

  @ApiProperty({ type: RoundCatalogRoundResponseDto, isArray: true })
  rounds!: RoundCatalogRoundResponseDto[];
}

export class RoundCatalogCompetitionResponseDto {
  @ApiProperty({ example: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' })
  id!: string;

  @ApiProperty({ example: 'Premier League' })
  name!: string;

  @ApiProperty({ example: 'https://example.com/premier-league.png' })
  logo!: string;

  @ApiProperty({ type: RoundCatalogSeasonResponseDto, isArray: true })
  seasons!: RoundCatalogSeasonResponseDto[];
}

export class RoundCatalogDefaultsResponseDto {
  @ApiProperty({ nullable: true })
  competitionId!: string | null;

  @ApiProperty({ nullable: true })
  seasonId!: string | null;

  @ApiProperty({ nullable: true })
  round!: number | null;
}

export class RoundsCatalogResponseDto {
  @ApiProperty({ type: RoundCatalogCompetitionResponseDto, isArray: true })
  competitions!: RoundCatalogCompetitionResponseDto[];

  @ApiProperty({ type: RoundCatalogDefaultsResponseDto })
  defaults!: RoundCatalogDefaultsResponseDto;
}

export class RoundParticipantResponseDto {
  @ApiProperty()
  userId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true })
  avatarUrl!: string | null;

  @ApiProperty({ example: 1 })
  position!: number;

  @ApiProperty({ example: 9 })
  naturalPoints!: number;

  @ApiProperty({ example: 7 })
  predictionsCount!: number;

  @ApiProperty({ example: 5 })
  evaluatedPredictions!: number;

  @ApiProperty({ example: 1 })
  exactScores!: number;

  @ApiProperty({ example: 4 })
  correctWinnersOnly!: number;

  @ApiProperty({ example: 0 })
  wrongPredictions!: number;

  @ApiProperty({ example: 100, nullable: true })
  accuracy!: number | null;
}

export class RoundHighlightParticipantResponseDto {
  @ApiProperty()
  userId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true })
  avatarUrl!: string | null;

  @ApiProperty({ example: 1 })
  position!: number;

  @ApiProperty({ example: 9 })
  value!: number;
}

export class RoundBestHighlightParticipantResponseDto extends RoundHighlightParticipantResponseDto {
  @ApiProperty({
    enum: [
      'EXACT_SCORES',
      'CORRECT_WINNERS',
      'FEWER_WRONG_PREDICTIONS',
      'EARLIER_REGISTRATION',
      'EARLIER_PREDICTION',
      'STABLE_ID',
    ],
    nullable: true,
  })
  tieBreakCriterion!:
    | 'EXACT_SCORES'
    | 'CORRECT_WINNERS'
    | 'FEWER_WRONG_PREDICTIONS'
    | 'EARLIER_REGISTRATION'
    | 'EARLIER_PREDICTION'
    | 'STABLE_ID'
    | null;

  @ApiProperty({ example: 1 })
  exactScores!: number;

  @ApiProperty({ example: 4 })
  correctWinnersOnly!: number;

  @ApiProperty({ example: 10 })
  evaluatedPredictions!: number;
}

export class RoundLowestScoreResponseDto {
  @ApiProperty({ example: 2 })
  value!: number;

  @ApiProperty({ example: 3 })
  participantCount!: number;

  @ApiProperty({
    type: RoundHighlightParticipantResponseDto,
    nullable: true,
  })
  participant!: RoundHighlightParticipantResponseDto | null;
}

export class RoundHighlightsResponseDto {
  @ApiProperty({
    type: RoundBestHighlightParticipantResponseDto,
    nullable: true,
  })
  best!: RoundBestHighlightParticipantResponseDto | null;

  @ApiProperty({ type: RoundLowestScoreResponseDto, nullable: true })
  lowestScore!: RoundLowestScoreResponseDto | null;
}

export class RoundMyPerformanceResponseDto {
  @ApiProperty({ nullable: true })
  position!: number | null;

  @ApiProperty()
  naturalPoints!: number;

  @ApiProperty()
  predictionsCount!: number;

  @ApiProperty()
  evaluatedPredictions!: number;

  @ApiProperty()
  exactScores!: number;

  @ApiProperty()
  correctWinnersOnly!: number;

  @ApiProperty()
  wrongPredictions!: number;

  @ApiProperty()
  pendingPredictions!: number;

  @ApiProperty({ nullable: true })
  accuracy!: number | null;
}

export class RoundStatsResponseDto {
  @ApiProperty({ enum: ['UPCOMING', 'IN_PROGRESS', 'COMPLETED'] })
  status!: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED';

  @ApiProperty()
  competition!: { id: string; name: string; logo: string };

  @ApiProperty()
  season!: { id: string; year: number; name: string };

  @ApiProperty()
  round!: number;

  @ApiProperty()
  totalFixtures!: number;

  @ApiProperty()
  publicFixtures!: number;

  @ApiProperty()
  completedFixtures!: number;

  @ApiProperty()
  cancelledFixtures!: number;

  @ApiProperty()
  dataIncomplete!: boolean;

  @ApiProperty({ type: RoundHighlightsResponseDto })
  highlights!: RoundHighlightsResponseDto;

  @ApiProperty({ type: RoundMyPerformanceResponseDto })
  myPerformance!: RoundMyPerformanceResponseDto;

  @ApiProperty({ type: RoundParticipantResponseDto, isArray: true })
  ranking!: RoundParticipantResponseDto[];
}
