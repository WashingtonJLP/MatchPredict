import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { IsStrongPassword } from '../../../common/validation/password-validation';

export class CreateUserDto {
  @ApiProperty({ example: 'Ada Lovelace', minLength: 3, maxLength: 80 })
  @IsString({ message: 'O nome deve ser um texto.' })
  @IsNotEmpty({ message: 'O nome e obrigatorio.' })
  @MinLength(3, { message: 'O nome deve possuir pelo menos 3 caracteres.' })
  @MaxLength(80, { message: 'O nome deve possuir no maximo 80 caracteres.' })
  name!: string;

  @ApiProperty({ example: 'ada@example.com', maxLength: 254 })
  @IsEmail({}, { message: 'E-mail invalido.' })
  @MaxLength(254, { message: 'E-mail deve possuir no maximo 254 caracteres.' })
  email!: string;

  @ApiProperty({ example: 'NovaSenha123', minLength: 8, maxLength: 72 })
  @IsStrongPassword()
  password!: string;
}
