import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  it('nega quando a rota exige ADMIN e nao existe usuario autenticado', () => {
    expect(createGuard([Role.ADMIN]).canActivate(contextFor(undefined))).toBe(
      false,
    );
  });

  it('nega USER e permite ADMIN', () => {
    const guard = createGuard([Role.ADMIN]);

    expect(guard.canActivate(contextFor(Role.USER))).toBe(false);
    expect(guard.canActivate(contextFor(Role.ADMIN))).toBe(true);
  });

  it('nao interfere em rotas sem metadata de roles', () => {
    expect(createGuard(undefined).canActivate(contextFor(undefined))).toBe(
      true,
    );
  });
});

function createGuard(roles: Role[] | undefined) {
  return new RolesGuard({
    getAllAndOverride: jest.fn().mockReturnValue(roles),
  } as unknown as Reflector);
}

function contextFor(role: Role | undefined) {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ user: role ? { role } : undefined }),
    }),
  } as unknown as ExecutionContext;
}
