import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

import { IsStrongPassword } from '../../../common/validation/password-validation';

export class CreateUserDto {
  @ApiProperty({ example: 'Ada Lovelace' })
  @IsString({ message: 'O nome deve ser um texto.' })
  @IsNotEmpty({ message: 'O nome é obrigatório.' })
  name!: string;

  @ApiProperty({ example: 'ada@example.com' })
  @IsEmail({}, { message: 'E-mail inválido.' })
  email!: string;

  @ApiProperty({ example: 'NovaSenha123', minLength: 8 })
  @IsStrongPassword()
  password!: string;
}
