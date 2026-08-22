import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'ada@example.com', maxLength: 254 })
  @IsEmail({}, { message: 'E-mail invalido.' })
  @MaxLength(254, { message: 'E-mail deve possuir no maximo 254 caracteres.' })
  email!: string;

  @ApiProperty({ example: 'secret123', maxLength: 72 })
  @IsString({ message: 'A senha e obrigatoria.' })
  @MinLength(1, { message: 'A senha e obrigatoria.' })
  @MaxLength(72, { message: 'A senha deve possuir no maximo 72 caracteres.' })
  password!: string;
}
