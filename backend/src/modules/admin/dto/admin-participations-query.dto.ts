import { ApiPropertyOptional } from '@nestjs/swagger';
import { ParticipationStatus } from '@prisma/client';
import { Transform, TransformFnParams } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AdminPaginationQueryDto } from './admin-pagination-query.dto';

export class AdminParticipationsQueryDto extends AdminPaginationQueryDto {
  @ApiPropertyOptional({ enum: ParticipationStatus })
  @IsOptional()
  @IsEnum(ParticipationStatus)
  status?: ParticipationStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  periodId?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @Transform(({ value }: TransformFnParams): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(100)
  user?: string;
}
