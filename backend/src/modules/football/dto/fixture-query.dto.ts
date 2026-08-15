import { ApiPropertyOptional } from '@nestjs/swagger';
import { FixtureStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

export class FixtureQueryDto {
  @ApiPropertyOptional({ enum: FixtureStatus, example: FixtureStatus.NS })
  @IsOptional()
  @IsEnum(FixtureStatus)
  status?: FixtureStatus;

  @ApiPropertyOptional({ example: 12, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  round?: number;

  @ApiPropertyOptional({
    example: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  })
  @IsOptional()
  @IsUUID('4')
  teamId?: string;

  @ApiPropertyOptional({ example: '2026-08-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-08-31T23:59:59.999Z' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, minimum: 1, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
