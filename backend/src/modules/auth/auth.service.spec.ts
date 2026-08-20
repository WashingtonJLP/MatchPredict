import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../common/prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService password reset', () => {
  let service: AuthService;
  let usersService: { findByEmail: jest.Mock };
  let userUpdate: jest.Mock;
  let userFindFirst: jest.Mock;
  let emailService: { sendPasswordResetEmail: jest.Mock };

  beforeEach(() => {
    usersService = {
      findByEmail: jest.fn(),
    };
    userUpdate = jest.fn();
    userFindFirst = jest.fn();
    emailService = {
      sendPasswordResetEmail: jest.fn(),
    };

    service = new AuthService(
      usersService as unknown as UsersService,
      { signAsync: jest.fn() } as unknown as JwtService,
      {
        user: {
          update: userUpdate,
          findFirst: userFindFirst,
        },
      } as unknown as PrismaService,
      emailService as unknown as EmailService,
      {
        get: jest.fn((_key: string, defaultValue?: string) => defaultValue),
      } as never,
    );
  });

  it('retorna mensagem generica quando e-mail nao existe', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(
      service.forgotPassword({ email: 'missing@example.com' }),
    ).resolves.toEqual({
      message:
        'Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.',
    });

    expect(userUpdate).not.toHaveBeenCalled();
    expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('salva hash do token e envia link quando usuario existe', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: userId,
      name: 'Ada',
      email: 'ada@example.com',
    });
    userUpdate.mockResolvedValue({});

    await service.forgotPassword({ email: 'ada@example.com' });

    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: userId },
      data: {
        resetPasswordToken: expect.stringMatching(/^[a-f0-9]{64}$/),
        resetPasswordExpiresAt: expect.any(Date),
      },
    });
    expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith({
      email: 'ada@example.com',
      name: 'Ada',
      resetUrl: expect.stringContaining('/reset-password?token='),
    });

    const storedHash = userUpdate.mock.calls[0][0].data.resetPasswordToken;
    const resetUrl =
      emailService.sendPasswordResetEmail.mock.calls[0][0].resetUrl;
    const rawToken = new URL(resetUrl).searchParams.get('token');

    expect(rawToken).toHaveLength(64);
    expect(storedHash).not.toBe(rawToken);
  });

  it('rejeita quando senha e confirmacao nao conferem', async () => {
    await expect(
      service.resetPassword({
        token: 'token',
        password: 'NovaSenha123',
        confirmPassword: 'OutraSenha123',
      }),
    ).rejects.toThrow(new BadRequestException('As senhas não conferem.'));

    expect(userFindFirst).not.toHaveBeenCalled();
  });

  it('rejeita token invalido', async () => {
    userFindFirst.mockResolvedValue(null);

    await expect(
      service.resetPassword({
        token: 'token-invalido',
        password: 'NovaSenha123',
        confirmPassword: 'NovaSenha123',
      }),
    ).rejects.toThrow(new BadRequestException('Token inválido.'));
  });

  it('invalida token expirado', async () => {
    userFindFirst.mockResolvedValue({
      id: userId,
      resetPasswordExpiresAt: new Date(Date.now() - 1000),
    });
    userUpdate.mockResolvedValue({});

    await expect(
      service.resetPassword({
        token: 'token-expirado',
        password: 'NovaSenha123',
        confirmPassword: 'NovaSenha123',
      }),
    ).rejects.toThrow(new BadRequestException('Token expirado.'));

    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: userId },
      data: {
        resetPasswordToken: null,
        resetPasswordExpiresAt: null,
      },
    });
  });

  it('atualiza senha e invalida token valido', async () => {
    userFindFirst.mockResolvedValue({
      id: userId,
      resetPasswordExpiresAt: new Date(Date.now() + 1000 * 60),
    });
    userUpdate.mockResolvedValue({});

    await expect(
      service.resetPassword({
        token: 'token-valido',
        password: 'NovaSenha123',
        confirmPassword: 'NovaSenha123',
      }),
    ).resolves.toEqual({
      message: 'Senha alterada com sucesso.',
    });

    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: userId },
      data: {
        password: expect.any(String),
        resetPasswordToken: null,
        resetPasswordExpiresAt: null,
      },
    });

    const hashedPassword = userUpdate.mock.calls[0][0].data.password;
    await expect(bcrypt.compare('NovaSenha123', hashedPassword)).resolves.toBe(
      true,
    );
  });
});

describe('AuthService register login and forgot password flow', () => {
  let service: AuthService;
  let emailService: { sendPasswordResetEmail: jest.Mock };
  let signAsync: jest.Mock;
  let storedUsers: Array<{
    id: string;
    name: string;
    email: string;
    password: string;
    role: 'USER';
    resetPasswordToken: string | null;
    resetPasswordExpiresAt: Date | null;
  }>;

  beforeEach(() => {
    storedUsers = [
      {
        id: oldUserId,
        name: 'Old User',
        email: 'old@example.com',
        password: bcrypt.hashSync('NovaSenha123', 10),
        role: 'USER',
        resetPasswordToken: null,
        resetPasswordExpiresAt: null,
      },
    ];
    emailService = {
      sendPasswordResetEmail: jest.fn(),
    };
    signAsync = jest.fn().mockResolvedValue('access-token');

    const prisma = {
      user: {
        findFirst: jest.fn(
          ({ where }: { where: { email?: { equals: string } } }) => {
            const email = where.email?.equals.toLowerCase();

            return (
              storedUsers.find((user) => user.email.toLowerCase() === email) ??
              null
            );
          },
        ),
        create: jest.fn(
          ({
            data,
          }: {
            data: { name: string; email: string; password: string };
          }) => {
            const user = {
              id: newUserId,
              name: data.name,
              email: data.email,
              password: data.password,
              role: 'USER' as const,
              resetPasswordToken: null,
              resetPasswordExpiresAt: null,
            };

            storedUsers.push(user);

            return user;
          },
        ),
        update: jest.fn(
          ({
            where,
            data,
          }: {
            where: { id: string };
            data: {
              resetPasswordToken?: string | null;
              resetPasswordExpiresAt?: Date | null;
            };
          }) => {
            const user = storedUsers.find((item) => item.id === where.id);

            if (!user) {
              return null;
            }

            Object.assign(user, data);

            return user;
          },
        ),
      },
    } as unknown as PrismaService;
    const usersService = new UsersService(prisma);

    service = new AuthService(
      usersService,
      { signAsync } as unknown as JwtService,
      prisma,
      emailService as unknown as EmailService,
      {
        get: jest.fn((_key: string, defaultValue?: string) => defaultValue),
      } as never,
    );
  });

  it('registers a new user, logs in and sends password reset email', async () => {
    await service.register({
      name: 'New User',
      email: ' New.User@Example.COM ',
      password: 'NovaSenha123',
    });

    const newUser = storedUsers.find((user) => user.id === newUserId);

    expect(newUser?.email).toBe('new.user@example.com');
    await expect(
      service.login({
        email: 'new.user@example.com',
        password: 'NovaSenha123',
      }),
    ).resolves.toEqual({
      accessToken: 'access-token',
    });

    await service.forgotPassword({ email: 'NEW.USER@example.com' });

    expect(newUser?.resetPasswordToken).toEqual(
      expect.stringMatching(/^[a-f0-9]{64}$/),
    );
    expect(newUser?.resetPasswordExpiresAt).toBeInstanceOf(Date);
    expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith({
      email: 'new.user@example.com',
      name: 'New User',
      resetUrl: expect.stringContaining('/reset-password?token='),
    });
  });

  it('sends password reset email for an old user with the same behavior', async () => {
    await service.forgotPassword({ email: ' OLD@example.com ' });

    const oldUser = storedUsers.find((user) => user.id === oldUserId);

    expect(oldUser?.resetPasswordToken).toEqual(
      expect.stringMatching(/^[a-f0-9]{64}$/),
    );
    expect(oldUser?.resetPasswordExpiresAt).toBeInstanceOf(Date);
    expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith({
      email: 'old@example.com',
      name: 'Old User',
      resetUrl: expect.stringContaining('/reset-password?token='),
    });
  });
});

const userId = '11111111-1111-4111-8111-111111111111';
const newUserId = '22222222-2222-4222-8222-222222222222';
const oldUserId = '33333333-3333-4333-8333-333333333333';
