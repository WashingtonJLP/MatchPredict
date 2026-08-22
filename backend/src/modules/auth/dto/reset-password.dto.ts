import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, MaxLength, MinLength } from 'class-validator';

import { IsStrongPassword } from '../../../common/validation/password-validation';

export class ResetPasswordDto {
  @ApiProperty({ example: 'token-seguro', minLength: 64, maxLength: 64 })
  @IsString({ message: 'Token invalido.' })
  @Length(64, 64, { message: 'Token invalido.' })
  token!: string;

  @ApiProperty({ example: 'NovaSenha123', minLength: 8, maxLength: 72 })
  @IsStrongPassword()
  password!: string;

  @ApiProperty({ example: 'NovaSenha123', maxLength: 72 })
  @IsString({ message: 'A confirmacao de senha e obrigatoria.' })
  @MinLength(1, { message: 'A confirmacao de senha e obrigatoria.' })
  @MaxLength(72, { message: 'A senha deve possuir no maximo 72 caracteres.' })
  confirmPassword!: string;
}
