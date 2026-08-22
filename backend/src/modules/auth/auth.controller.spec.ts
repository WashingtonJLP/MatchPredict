import 'reflect-metadata';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthController } from './auth.controller';

const throttlerLimit = 'THROTTLER:LIMIT';
const throttlerTtl = 'THROTTLER:TTL';

describe('AuthController throttling', () => {
  it('uses the throttler guard on the controller', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, AuthController)).toContain(
      ThrottlerGuard,
    );
  });

  it.each([
    ['register', 3, 600_000],
    ['login', 5, 60_000],
    ['forgotPassword', 3, 900_000],
    ['resetPassword', 5, 900_000],
  ] as const)(
    'sets %s throttling to %i requests per %i ms',
    (methodName, limit, ttl) => {
      const handler = AuthController.prototype[methodName];

      expect(Reflect.getMetadata(`${throttlerLimit}default`, handler)).toBe(
        limit,
      );
      expect(Reflect.getMetadata(`${throttlerTtl}default`, handler)).toBe(ttl);
    },
  );
});
