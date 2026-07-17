import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    return this.usersService.create(registerDto);
  }

  async login(loginDto: LoginDto) {
    // Procura o usuário pelo e-mail
    const user = await this.usersService.findByEmail(loginDto.email);

    // Se não existir, retorna erro
    if (!user) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    // Compara a senha informada com a senha criptografada do banco
    const passwordMatches = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    // Se a senha estiver incorreta, retorna erro
    if (!passwordMatches) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    // Dados que serão armazenados dentro do JWT
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    // Gera e retorna o token
    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }
}