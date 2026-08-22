import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { FootballController } from './football.controller';
import { FootballService } from './football.service';

describe('FootballController admin endpoints', () => {
  let controller: FootballController;
  let footballService: Record<
    'syncFixtures' | 'syncLeague' | 'syncPlayers' | 'syncResults' | 'syncTeams',
    jest.Mock
  >;

  beforeEach(() => {
    footballService = {
      syncFixtures: jest.fn().mockResolvedValue({ ok: true }),
      syncLeague: jest.fn().mockResolvedValue({ ok: true }),
      syncPlayers: jest.fn().mockResolvedValue({ ok: true }),
      syncResults: jest.fn().mockResolvedValue({ ok: true }),
      syncTeams: jest.fn().mockResolvedValue({ ok: true }),
    };

    controller = new FootballController(
      footballService as unknown as FootballService,
    );
  });

  it.each([
    ['syncLeague'],
    ['syncTeams'],
    ['syncFixtures'],
    ['syncPlayers'],
    ['syncResults'],
  ] as const)('rejects USER when calling %s', (methodName) => {
    expect(() => controller[methodName](user)).toThrow(ForbiddenException);
    expect(footballService[methodName]).not.toHaveBeenCalled();
  });

  it.each([
    ['syncLeague'],
    ['syncTeams'],
    ['syncFixtures'],
    ['syncPlayers'],
    ['syncResults'],
  ] as const)('allows ADMIN when calling %s', async (methodName) => {
    await expect(controller[methodName](admin)).resolves.toEqual({ ok: true });
    expect(footballService[methodName]).toHaveBeenCalled();
  });
});

const user = createAuthenticatedUser(Role.USER);
const admin = createAuthenticatedUser(Role.ADMIN);

function createAuthenticatedUser(role: Role): AuthenticatedUser {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    role,
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date('2026-08-01T00:00:00.000Z'),
  };
}
