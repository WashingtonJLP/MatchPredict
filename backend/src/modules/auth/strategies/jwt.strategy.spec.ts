import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { UsersService } from '../../users/users.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy disabled account enforcement', () => {
  const payload = {
    sub: '11111111-1111-4111-8111-111111111111',
    email: 'user@example.com',
    role: Role.USER,
  };

  it('rejeita token ainda valido quando a conta foi desativada', async () => {
    const usersService = {
      findAuthStateById: jest.fn().mockResolvedValue({
        id: payload.sub,
        role: Role.USER,
        disabledAt: new Date(),
      }),
    };
    const strategy = new JwtStrategy(
      config(),
      usersService as unknown as UsersService,
    );

    await expect(strategy.validate(payload)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejeita token de usuario removido depois da emissao', async () => {
    const usersService = {
      findAuthStateById: jest.fn().mockResolvedValue(null),
    };
    const strategy = new JwtStrategy(
      config(),
      usersService as unknown as UsersService,
    );

    await expect(strategy.validate(payload)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('aceita token quando a conta esta ativa', async () => {
    const activeUser = {
      id: payload.sub,
      role: Role.USER,
      disabledAt: null,
      authVersion: 0,
    };
    const usersService = {
      findAuthStateById: jest.fn().mockResolvedValue(activeUser),
    };
    const strategy = new JwtStrategy(
      config(),
      usersService as unknown as UsersService,
    );

    await expect(strategy.validate(payload)).resolves.toEqual(
      expect.not.objectContaining({ authVersion: expect.anything() }),
    );
  });

  it('rejeita JWT emitido antes da desativacao mesmo apos reativacao', async () => {
    const usersService = {
      findAuthStateById: jest.fn().mockResolvedValue({
        id: payload.sub,
        role: Role.USER,
        disabledAt: null,
        authVersion: 1,
      }),
    };
    const strategy = new JwtStrategy(
      config(),
      usersService as unknown as UsersService,
    );

    await expect(
      strategy.validate({ ...payload, authVersion: 0 }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('usa a role atual do banco em vez da role antiga do JWT', async () => {
    const usersService = {
      findAuthStateById: jest.fn().mockResolvedValue({
        id: payload.sub,
        role: Role.USER,
        disabledAt: null,
        authVersion: 0,
      }),
    };
    const strategy = new JwtStrategy(
      config(),
      usersService as unknown as UsersService,
    );

    await expect(
      strategy.validate({ ...payload, role: Role.ADMIN }),
    ).resolves.toMatchObject({ role: Role.USER });
  });
});

function config() {
  return {
    get: jest.fn((key: string) =>
      key === 'JWT_SECRET' ? 'test-secret' : undefined,
    ),
  } as unknown as ConfigService;
}
