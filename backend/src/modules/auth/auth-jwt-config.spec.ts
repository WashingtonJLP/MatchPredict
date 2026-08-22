import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import {
  getJwtExpiresIn,
  getRequiredConfigValue,
} from '../../common/config/security-config';

describe('auth JWT configuration', () => {
  it('signs tokens with an expiration using valid JWT config', async () => {
    const configService = createConfigService({
      JWT_SECRET: 'test-secret',
      JWT_EXPIRES_IN: '1h',
    });
    const jwtService = new JwtService({
      secret: getRequiredConfigValue(configService, 'JWT_SECRET'),
      signOptions: {
        expiresIn: getJwtExpiresIn(configService),
      },
    });

    const token = await jwtService.signAsync({
      sub: '11111111-1111-4111-8111-111111111111',
      email: 'user@example.com',
      role: 'USER',
    });
    const decoded = jwtService.decode<{
      exp?: number;
      iat?: number;
    }>(token);
    const { exp, iat } = decoded;

    expect(typeof exp).toBe('number');
    expect(typeof iat).toBe('number');

    if (typeof exp !== 'number' || typeof iat !== 'number') {
      throw new Error('JWT token should include exp and iat claims.');
    }

    expect(exp - iat).toBe(3600);
    await expect(jwtService.verifyAsync(token)).resolves.toMatchObject({
      email: 'user@example.com',
      role: 'USER',
    });
  });
});

function createConfigService(values: Record<string, string>) {
  return {
    get: jest.fn((key: string, defaultValue?: string) => {
      return values[key] ?? defaultValue;
    }),
  } as unknown as ConfigService;
}
