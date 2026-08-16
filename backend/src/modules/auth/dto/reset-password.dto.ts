import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

import { IsStrongPassword } from '../../../common/validation/password-validation';

export class ResetPasswordDto {
  @ApiProperty({ example: 'token-seguro' })
  @IsString({ message: 'Token inválido.' })
  @MinLength(1, { message: 'Token inválido.' })
  token!: string;

  @ApiProperty({ example: 'NovaSenha123', minLength: 8 })
  @IsStrongPassword()
  password!: string;

  @ApiProperty({ example: 'NovaSenha123' })
  @IsString({ message: 'A confirmação de senha é obrigatória.' })
  confirmPassword!: string;
}
