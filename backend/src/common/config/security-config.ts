import { ConfigService } from '@nestjs/config';

type JwtExpiresIn = number | `${number}${'s' | 'm' | 'h' | 'd' | 'w' | 'y'}`;

export function getRequiredConfigValue(
  configService: ConfigService,
  key: string,
) {
  const value = configService.get<string>(key);

  if (!value?.trim()) {
    throw new Error(`Invalid configuration: ${key} is required.`);
  }

  return value.trim();
}

export function getJwtExpiresIn(configService: ConfigService): JwtExpiresIn {
  const rawValue = getRequiredConfigValue(configService, 'JWT_EXPIRES_IN');
  const match = rawValue.match(/^([1-9]\d*)([smhdwy])?$/);

  if (!match) {
    throw new Error(
      'Invalid configuration: JWT_EXPIRES_IN must be a positive integer number of seconds or use s, m, h, d, w, y units.',
    );
  }

  const value = Number(match[1]);
  const unit = match[2] as 's' | 'm' | 'h' | 'd' | 'w' | 'y' | undefined;

  if (!Number.isSafeInteger(value)) {
    throw new Error(
      'Invalid configuration: JWT_EXPIRES_IN must be a safe positive integer.',
    );
  }

  return unit ? (`${value}${unit}` as JwtExpiresIn) : value;
}

export function getNodeEnv(configService: ConfigService) {
  return configService.get<string>('NODE_ENV', 'development').trim();
}

export function getCorsOrigins(configService: ConfigService) {
  const nodeEnv = getNodeEnv(configService);
  const configuredOrigins = parseOriginList(
    configService.get<string>('CORS_ORIGINS') ??
      configService.get<string>('FRONTEND_URL'),
  );

  if (nodeEnv === 'production') {
    if (configuredOrigins.length === 0) {
      throw new Error(
        'Invalid configuration: CORS_ORIGINS or FRONTEND_URL is required in production.',
      );
    }

    return configuredOrigins;
  }

  if (configuredOrigins.length > 0) {
    return configuredOrigins;
  }

  return [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
  ];
}

export function getTrustProxyHops(configService: ConfigService) {
  const rawValue = configService.get<string>('TRUST_PROXY_HOPS');

  if (!rawValue?.trim()) {
    return 0;
  }

  const hops = Number(rawValue);

  if (!Number.isInteger(hops) || hops < 0) {
    throw new Error(
      'Invalid configuration: TRUST_PROXY_HOPS must be a non-negative integer.',
    );
  }

  return hops;
}

function parseOriginList(value?: string) {
  return (
    value
      ?.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean) ?? []
  );
}
