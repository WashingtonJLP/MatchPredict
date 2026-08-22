import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsUUID, Max, Min } from 'class-validator';

export class CreatePredictionDto {
  @ApiProperty({
    example: '2bb0f2b4-44f7-4f55-a149-58b4d79f4b4f',
  })
  @IsUUID('4', { message: 'fixtureId invalido.' })
  @IsNotEmpty({ message: 'fixtureId e obrigatorio.' })
  fixtureId!: string;

  @ApiProperty({ example: 2, minimum: 0, maximum: 20 })
  @IsInt({ message: 'homeGoals deve ser um numero inteiro.' })
  @Min(0, { message: 'homeGoals nao pode ser negativo.' })
  @Max(20, { message: 'homeGoals deve ser no maximo 20.' })
  homeGoals!: number;

  @ApiProperty({ example: 1, minimum: 0, maximum: 20 })
  @IsInt({ message: 'awayGoals deve ser um numero inteiro.' })
  @Min(0, { message: 'awayGoals nao pode ser negativo.' })
  @Max(20, { message: 'awayGoals deve ser no maximo 20.' })
  awayGoals!: number;
}
