import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString({ message: 'O nome deve ser um texto.' })
  @IsNotEmpty({ message: 'O nome é obrigatório.' })
  name!: string;

  @IsEmail({}, { message: 'E-mail inválido.' })
  email!: string;

  @IsString({ message: 'A senha deve ser um texto.' })
  @MinLength(6, {
    message: 'A senha deve possuir pelo menos 6 caracteres.',
  })
  password!: string;
}