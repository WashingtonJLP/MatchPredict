import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { IsStrongPassword } from '../../../common/validation/password-validation';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Ada Lovelace', minLength: 3, maxLength: 80 })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional({ example: 'secret123', maxLength: 72 })
  @IsOptional()
  @IsString()
  @MaxLength(72)
  currentPassword?: string;

  @ApiPropertyOptional({ example: 'NovaSenha123', minLength: 8, maxLength: 72 })
  @IsOptional()
  @IsStrongPassword()
  newPassword?: string;
}
