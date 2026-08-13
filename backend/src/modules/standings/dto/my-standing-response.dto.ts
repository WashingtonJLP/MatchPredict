import { ApiProperty } from '@nestjs/swagger';

export class MyStandingResponseDto {
  @ApiProperty({ example: 4 })
  position: number;

  @ApiProperty({ example: 18 })
  totalPlayers: number;

  @ApiProperty({ example: 42 })
  totalPoints: number;

  @ApiProperty({ example: 6 })
  exactScores: number;

  @ApiProperty({ example: 17 })
  correctWinners: number;
}
