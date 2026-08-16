import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';

import { JwtPayload } from '../../common/types/authenticated-user.type';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

const forgotPasswordMessage =
  'Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
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
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    // Gera e retorna o token
    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);

    if (!user) {
      return {
        message: forgotPasswordMessage,
      };
    }

    const token = this.generatePasswordResetToken();
    const tokenHash = this.hashPasswordResetToken(token);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: tokenHash,
        resetPasswordExpiresAt: expiresAt,
      },
    });

    try {
      await this.emailService.sendPasswordResetEmail({
        email: user.email,
        name: user.name,
        resetUrl: this.createPasswordResetUrl(token),
      });
    } catch (error) {
      this.logger.error(
        `Falha ao enviar e-mail de redefinição para userId=${user.id}`,
        error instanceof Error ? error.stack : undefined,
      );
    }

    return {
      message: forgotPasswordMessage,
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    if (resetPasswordDto.password !== resetPasswordDto.confirmPassword) {
      throw new BadRequestException('As senhas não conferem.');
    }

    const tokenHash = this.hashPasswordResetToken(resetPasswordDto.token);
    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: tokenHash,
      },
      select: {
        id: true,
        resetPasswordExpiresAt: true,
      },
    });

    if (!user) {
      throw new BadRequestException('Token inválido.');
    }

    if (
      !user.resetPasswordExpiresAt ||
      user.resetPasswordExpiresAt.getTime() < Date.now()
    ) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: null,
          resetPasswordExpiresAt: null,
        },
      });

      throw new BadRequestException('Token expirado.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(resetPasswordDto.password, 10),
        resetPasswordToken: null,
        resetPasswordExpiresAt: null,
      },
    });

    return {
      message: 'Senha alterada com sucesso.',
    };
  }

  private generatePasswordResetToken() {
    return randomBytes(32).toString('hex');
  }

  private hashPasswordResetToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private createPasswordResetUrl(token: string) {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3001',
    );
    const baseUrl = frontendUrl.replace(/\/$/, '');

    return `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
  }
}
