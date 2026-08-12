import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdatePredictionDto {
  @IsOptional()
  @IsInt({ message: 'homeGoals deve ser um número inteiro.' })
  @Min(0, { message: 'homeGoals não pode ser negativo.' })
  homeGoals?: number;

  @IsOptional()
  @IsInt({ message: 'awayGoals deve ser um número inteiro.' })
  @Min(0, { message: 'awayGoals não pode ser negativo.' })
  awayGoals?: number;
}
