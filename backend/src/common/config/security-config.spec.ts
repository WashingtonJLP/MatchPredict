import { ConfigService } from '@nestjs/config';
import {
  getCorsOrigins,
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
