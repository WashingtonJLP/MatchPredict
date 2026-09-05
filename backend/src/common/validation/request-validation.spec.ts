import {
  ArgumentMetadata,
  BadRequestException,
  ValidationPipe,
} from '@nestjs/common';
import { RegisterDto } from '../../modules/auth/dto/register.dto';
import { LoginDto } from '../../modules/auth/dto/login.dto';
import { ForgotPasswordDto } from '../../modules/auth/dto/forgot-password.dto';
import { ResetPasswordDto } from '../../modules/auth/dto/reset-password.dto';
import { UpdateUserDto } from '../../modules/users/dto/update-user.dto';
import { CreatePredictionDto } from '../../modules/predictions/dto/create-prediction.dto';
import { UpdatePredictionDto } from '../../modules/predictions/dto/update-prediction.dto';
import { FixtureQueryDto } from '../../modules/football/dto/fixture-query.dto';
import { DailyGamesQueryDto } from '../../modules/daily-games/dto/daily-games-query.dto';

describe('request DTO validation', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  });

  it('rejects role mass assignment on register', async () => {
    await expect(
      transform(RegisterDto, {
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        password: 'NovaSenha123',
        role: 'ADMIN',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects score mass assignment on prediction create', async () => {
    await expect(
      transform(CreatePredictionDto, {
        fixtureId: validUuid,
        homeGoals: 2,
        awayGoals: 1,
        totalPoints: 3,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects negative prediction goals', async () => {
    await expect(
      transform(CreatePredictionDto, {
        fixtureId: validUuid,
        homeGoals: -1,
        awayGoals: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects decimal prediction goals', async () => {
    await expect(
      transform(UpdatePredictionDto, {
        homeGoals: 1.5,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects prediction goals above the configured maximum', async () => {
    await expect(
      transform(CreatePredictionDto, {
        fixtureId: validUuid,
        homeGoals: 21,
        awayGoals: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects invalid fixture IDs in prediction payloads', async () => {
    await expect(
      transform(CreatePredictionDto, {
        fixtureId: 'invalid-id',
        homeGoals: 2,
        awayGoals: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects oversized fixture query limits', async () => {
    await expect(
      transform(
        FixtureQueryDto,
        {
          page: '1',
          limit: '101',
        },
        'query',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('accepts valid fixture query strings and converts numeric fields', async () => {
    await expect(
      transform(
        FixtureQueryDto,
        {
          page: '2',
          limit: '50',
          round: '10',
        },
        'query',
      ),
    ).resolves.toMatchObject({
      page: 2,
      limit: 50,
      round: 10,
    });
  });

  it('accepts a configured Daily Games competition filter', async () => {
    await expect(
      transform(
        DailyGamesQueryDto,
        {
          date: '2026-09-01',
          competition: 'eng.1',
        },
        'query',
      ),
    ).resolves.toMatchObject({
      date: '2026-09-01',
      competition: 'eng.1',
    });
  });

  it('rejects an unknown Daily Games competition filter', async () => {
    await expect(
      transform(
        DailyGamesQueryDto,
        {
          date: '2026-09-01',
          competition: 'unknown.league',
        },
        'query',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects oversized auth fields', async () => {
    await expect(
      transform(LoginDto, {
        email: `${'a'.repeat(250)}@example.com`,
        password: 'a'.repeat(73),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('uses the same forgot password response shape for existing and missing emails', async () => {
    await expect(
      transform(ForgotPasswordDto, {
        email: 'user@example.com',
      }),
    ).resolves.toBeInstanceOf(ForgotPasswordDto);
  });

  it('rejects reset tokens that are not 64 characters', async () => {
    await expect(
      transform(ResetPasswordDto, {
        token: 'short-token',
        password: 'NovaSenha123',
        confirmPassword: 'NovaSenha123',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects weak profile password changes', async () => {
    await expect(
      transform(UpdateUserDto, {
        currentPassword: 'NovaSenha123',
        newPassword: 'weak12',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  function transform(
    metatype: new () => unknown,
    value: Record<string, unknown>,
    type: ArgumentMetadata['type'] = 'body',
  ) {
    return pipe.transform(value, {
      type,
      metatype,
    });
  }
});

const validUuid = '33333333-3333-4333-8333-333333333333';
