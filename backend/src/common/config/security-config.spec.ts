import { ConfigService } from '@nestjs/config';
import {
  getCorsOrigins,
  getJwtExpiresIn,
  getRequiredConfigValue,
  getTrustProxyHops,
} from './security-config';

describe('security config', () => {
  it('returns trimmed required config values', () => {
    const configService = createConfigService({
      JWT_SECRET: '  valid-secret  ',
    });

    expect(getRequiredConfigValue(configService, 'JWT_SECRET')).toBe(
      'valid-secret',
    );
  });

  it('rejects missing required config values', () => {
    const configService = createConfigService({});

    expect(() => getRequiredConfigValue(configService, 'JWT_SECRET')).toThrow(
      'Invalid configuration: JWT_SECRET is required.',
    );
  });

  it('rejects blank required config values', () => {
    const configService = createConfigService({
      JWT_SECRET: '   ',
    });

    expect(() => getRequiredConfigValue(configService, 'JWT_SECRET')).toThrow(
      'Invalid configuration: JWT_SECRET is required.',
    );
  });

  it('requires JWT_EXPIRES_IN', () => {
    const configService = createConfigService({});

    expect(() => getJwtExpiresIn(configService)).toThrow(
      'Invalid configuration: JWT_EXPIRES_IN is required.',
    );
  });

  it('rejects blank JWT_EXPIRES_IN', () => {
    const configService = createConfigService({
      JWT_EXPIRES_IN: '   ',
    });

    expect(() => getJwtExpiresIn(configService)).toThrow(
      'Invalid configuration: JWT_EXPIRES_IN is required.',
    );
  });

  it.each(['invalid', '0', '-1', '1.5h', '10 ms', '10ms'])(
    'rejects invalid JWT_EXPIRES_IN value %s',
    (value) => {
      const configService = createConfigService({
        JWT_EXPIRES_IN: value,
      });

      expect(() => getJwtExpiresIn(configService)).toThrow(
        'Invalid configuration: JWT_EXPIRES_IN must be a positive integer number of seconds or use s, m, h, d, w, y units.',
      );
    },
  );

  it('parses JWT_EXPIRES_IN with a supported unit', () => {
    const configService = createConfigService({
      JWT_EXPIRES_IN: ' 7d ',
    });

    expect(getJwtExpiresIn(configService)).toBe('7d');
  });

  it('parses numeric JWT_EXPIRES_IN as seconds', () => {
    const configService = createConfigService({
      JWT_EXPIRES_IN: '3600',
    });

    expect(getJwtExpiresIn(configService)).toBe(3600);
  });

  it('requires explicit CORS origins in production', () => {
    const configService = createConfigService({
      NODE_ENV: 'production',
    });

    expect(() => getCorsOrigins(configService)).toThrow(
      'Invalid configuration: CORS_ORIGINS or FRONTEND_URL is required in production.',
    );
  });

  it('parses multiple production CORS origins', () => {
    const configService = createConfigService({
      NODE_ENV: 'production',
      CORS_ORIGINS: 'https://app.example.com, https://www.example.com',
    });

    expect(getCorsOrigins(configService)).toEqual([
      'https://app.example.com',
      'https://www.example.com',
    ]);
  });

  it('keeps local development origins available by default', () => {
    const configService = createConfigService({
      NODE_ENV: 'development',
    });

    expect(getCorsOrigins(configService)).toEqual(
      expect.arrayContaining([
        'http://localhost:3000',
        'http://localhost:3001',
      ]),
    );
  });

  it('does not trust reverse proxies by default', () => {
    const configService = createConfigService({});

    expect(getTrustProxyHops(configService)).toBe(0);
  });

  it('parses configured trusted proxy hops', () => {
    const configService = createConfigService({
      TRUST_PROXY_HOPS: '1',
    });

    expect(getTrustProxyHops(configService)).toBe(1);
  });

  it('rejects invalid trusted proxy hops', () => {
    const configService = createConfigService({
      TRUST_PROXY_HOPS: 'invalid',
    });

    expect(() => getTrustProxyHops(configService)).toThrow(
      'Invalid configuration: TRUST_PROXY_HOPS must be a non-negative integer.',
    );
  });
});

function createConfigService(values: Record<string, string>) {
  return {
    get: jest.fn((key: string, defaultValue?: string) => {
      return values[key] ?? defaultValue;
    }),
  } as unknown as ConfigService;
}
