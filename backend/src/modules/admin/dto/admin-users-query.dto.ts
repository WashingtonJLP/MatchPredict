import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { Role } from '@prisma/client';
import { AdminPaginationQueryDto } from './admin-pagination-query.dto';

export enum AdminAccountStatus {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
}

export class AdminUsersQueryDto extends AdminPaginationQueryDto {
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @Transform(({ value }: TransformFnParams): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ enum: AdminAccountStatus })
  @IsOptional()
  @IsEnum(AdminAccountStatus)
  accountStatus?: AdminAccountStatus;
}
