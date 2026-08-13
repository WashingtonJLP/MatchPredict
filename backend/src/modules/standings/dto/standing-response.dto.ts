import { ApiProperty } from '@nestjs/swagger';

export class StandingResponseDto {
  @ApiProperty({ example: 1 })
  position: number;

  @ApiProperty({ example: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' })
  userId: string;

  @ApiProperty({ example: 'Maria Silva' })
  name: string;

  @ApiProperty({
    example: 'https://example.com/avatar.png',
    nullable: true,
  })
  avatarUrl: string | null;

  @ApiProperty({ example: 39 })
  scorePoints: number;

  @ApiProperty({ example: 42 })
  totalPoints: number;

  @ApiProperty({ example: 6 })
  exactScores: number;

  @ApiProperty({ example: 17 })
  correctWinners: number;

  @ApiProperty({ example: 5 })
  wrongPredictions: number;
}
