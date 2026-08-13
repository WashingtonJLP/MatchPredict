import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'ada@example.com' })
  @IsEmail({}, { message: 'E-mail inválido.' })
  email!: string;

  @ApiProperty({ example: 'secret123' })
  @IsString({ message: 'A senha é obrigatória.' })
  password!: string;
}
