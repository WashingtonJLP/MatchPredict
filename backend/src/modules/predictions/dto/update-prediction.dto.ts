import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdatePredictionDto {
  @ApiPropertyOptional({ example: 2, minimum: 0 })
  @IsOptional()
  @IsInt({ message: 'homeGoals deve ser um número inteiro.' })
  @Min(0, { message: 'homeGoals não pode ser negativo.' })
  homeGoals?: number;

  @ApiPropertyOptional({ example: 1, minimum: 0 })
  @IsOptional()
  @IsInt({ message: 'awayGoals deve ser um número inteiro.' })
  @Min(0, { message: 'awayGoals não pode ser negativo.' })
  awayGoals?: number;
}
