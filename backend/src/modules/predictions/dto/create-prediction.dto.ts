import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

export class CreatePredictionDto {
  @IsUUID('4', { message: 'fixtureId inválido.' })
  @IsNotEmpty({ message: 'fixtureId é obrigatório.' })
  fixtureId!: string;

  @IsInt({ message: 'homeGoals deve ser um número inteiro.' })
  @Min(0, { message: 'homeGoals não pode ser negativo.' })
  homeGoals!: number;

  @IsInt({ message: 'awayGoals deve ser um número inteiro.' })
  @Min(0, { message: 'awayGoals não pode ser negativo.' })
  awayGoals!: number;
}
