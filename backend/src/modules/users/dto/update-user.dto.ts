import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Ada Lovelace' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @ApiPropertyOptional({ example: 'secret123' })
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @ApiPropertyOptional({ example: 'newsecret123', minLength: 6 })
  @IsOptional()
  @IsString()
  @MinLength(6)
  newPassword?: string;
}
