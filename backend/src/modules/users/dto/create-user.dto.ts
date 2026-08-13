import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Ada Lovelace' })
  @IsString({ message: 'O nome deve ser um texto.' })
  @IsNotEmpty({ message: 'O nome é obrigatório.' })
  name!: string;

  @ApiProperty({ example: 'ada@example.com' })
  @IsEmail({}, { message: 'E-mail inválido.' })
  email!: string;

  @ApiProperty({ example: 'secret123', minLength: 6 })
  @IsString({ message: 'A senha deve ser um texto.' })
  @MinLength(6, {
    message: 'A senha deve possuir pelo menos 6 caracteres.',
  })
  password!: string;
}
