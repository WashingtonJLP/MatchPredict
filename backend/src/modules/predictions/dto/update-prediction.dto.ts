import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdatePredictionDto {
  @ApiPropertyOptional({ example: 2, minimum: 0, maximum: 20 })
  @IsOptional()
  @IsInt({ message: 'homeGoals deve ser um numero inteiro.' })
  @Min(0, { message: 'homeGoals nao pode ser negativo.' })
  @Max(20, { message: 'homeGoals deve ser no maximo 20.' })
  homeGoals?: number;

  @ApiPropertyOptional({ example: 1, minimum: 0, maximum: 20 })
  @IsOptional()
  @IsInt({ message: 'awayGoals deve ser um numero inteiro.' })
  @Min(0, { message: 'awayGoals nao pode ser negativo.' })
  @Max(20, { message: 'awayGoals deve ser no maximo 20.' })
  awayGoals?: number;
}
