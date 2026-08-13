import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

export class CreatePredictionDto {
  @ApiProperty({
    example: '2bb0f2b4-44f7-4f55-a149-58b4d79f4b4f',
  })
  @IsUUID('4', { message: 'fixtureId inválido.' })
  @IsNotEmpty({ message: 'fixtureId é obrigatório.' })
  fixtureId!: string;

  @ApiProperty({ example: 2, minimum: 0 })
  @IsInt({ message: 'homeGoals deve ser um número inteiro.' })
  @Min(0, { message: 'homeGoals não pode ser negativo.' })
  homeGoals!: number;

  @ApiProperty({ example: 1, minimum: 0 })
  @IsInt({ message: 'awayGoals deve ser um número inteiro.' })
  @Min(0, { message: 'awayGoals não pode ser negativo.' })
  awayGoals!: number;
}
