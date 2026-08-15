import { ApiProperty } from '@nestjs/swagger';
import { FixtureStatus, WinnerType } from '@prisma/client';

export class FixtureTeamResponseDto {
  @ApiProperty({ example: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' })
  id!: string;

  @ApiProperty({ example: 'Arsenal' })
  name!: string;

  @ApiProperty({ example: 'https://example.com/arsenal.png' })
  logo!: string;
}

export class FixtureUserPredictionResponseDto {
  @ApiProperty({ example: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' })
  id!: string;

  @ApiProperty({ example: 2 })
  homeGoals!: number;

  @ApiProperty({ example: 1 })
  awayGoals!: number;

  @ApiProperty({ example: 3 })
  totalPoints!: number;
}

export class FixtureResponseDto {
  @ApiProperty({ example: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' })
  id!: string;

  @ApiProperty({ example: 12 })
  round!: number;

  @ApiProperty({ example: '2026-08-14T19:00:00.000Z' })
  kickoff!: Date;

  @ApiProperty({ enum: FixtureStatus, example: FixtureStatus.NS })
  status!: FixtureStatus;

  @ApiProperty({ example: null, nullable: true })
  homeGoals!: number | null;

  @ApiProperty({ example: null, nullable: true })
  awayGoals!: number | null;

  @ApiProperty({ enum: WinnerType, example: null, nullable: true })
  winnerType!: WinnerType | null;

  @ApiProperty({ type: FixtureTeamResponseDto })
  homeTeam!: FixtureTeamResponseDto;

  @ApiProperty({ type: FixtureTeamResponseDto })
  awayTeam!: FixtureTeamResponseDto;

  @ApiProperty({ example: true })
  canPredict!: boolean;

  @ApiProperty({ type: FixtureUserPredictionResponseDto, nullable: true })
  userPrediction!: FixtureUserPredictionResponseDto | null;
}

export class FixturePaginationMetaResponseDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 380 })
  total!: number;

  @ApiProperty({ example: 19 })
  totalPages!: number;
}

export class FixtureListResponseDto {
  @ApiProperty({ type: FixtureResponseDto, isArray: true })
  data!: FixtureResponseDto[];

  @ApiProperty({ type: FixturePaginationMetaResponseDto })
  meta!: FixturePaginationMetaResponseDto;
}
