import { Type } from 'class-transformer';
import { IsInt, IsUUID, Min } from 'class-validator';

export class RoundStatsParamsDto {
  @IsUUID()
  competitionId!: string;

  @IsUUID()
  seasonId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  round!: number;
}
