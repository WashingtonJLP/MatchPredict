import { ApiProperty } from '@nestjs/swagger';

export class UserRoundStatisticsDto {
  @ApiProperty({ example: 12 })
  round!: number;

  @ApiProperty({ example: 18 })
  points!: number;
}

export class UserStatisticsResponseDto {
  @ApiProperty({ example: 24 })
  totalPredictions!: number;

  @ApiProperty({ example: 42 })
  totalPoints!: number;

  @ApiProperty({ example: 1.75 })
  averagePoints!: number;

  @ApiProperty({
    description: 'Percentual de palpites com vencedor correto.',
    example: 62.5,
  })
  accuracy!: number;

  @ApiProperty({ example: 15 })
  correctWinners!: number;

  @ApiProperty({ example: 6 })
  exactScores!: number;

  @ApiProperty({ example: 9 })
  wrongPredictions!: number;

  @ApiProperty({
    nullable: true,
    type: UserRoundStatisticsDto,
  })
  bestRound!: UserRoundStatisticsDto | null;

  @ApiProperty({
    nullable: true,
    type: UserRoundStatisticsDto,
  })
  worstRound!: UserRoundStatisticsDto | null;

  @ApiProperty({
    example: 4,
    nullable: true,
  })
  currentPosition!: number | null;
}
