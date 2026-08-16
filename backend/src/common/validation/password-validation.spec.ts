import { validate } from 'class-validator';

import { RegisterDto } from '../../modules/auth/dto/register.dto';
import { ResetPasswordDto } from '../../modules/auth/dto/reset-password.dto';

describe('password validation', () => {
  const invalidPasswords = [
    ['short password', 'Abc1234'],
    ['missing uppercase letter', 'senha1234'],
    ['missing lowercase letter', 'SENHA1234'],
    ['missing number', 'SenhaForte'],
  ];

  it.each(invalidPasswords)(
    'rejects register password with %s',
    async (_caseName, password) => {
      const dto = Object.assign(new RegisterDto(), {
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        password,
      });

      const errors = await validate(dto);

      expect(errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            property: 'password',
          }),
        ]),
      );
    },
  );

  it.each(invalidPasswords)(
    'rejects reset password with %s',
    async (_caseName, password) => {
      const dto = Object.assign(new ResetPasswordDto(), {
        token: 'token-valido',
        password,
        confirmPassword: password,
      });

      const errors = await validate(dto);

      expect(errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            property: 'password',
          }),
        ]),
      );
    },
  );

  it('accepts the same strong password for register and reset password', async () => {
    const registerDto = Object.assign(new RegisterDto(), {
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'NovaSenha123',
    });
    const resetPasswordDto = Object.assign(new ResetPasswordDto(), {
      token: 'token-valido',
      password: 'NovaSenha123',
      confirmPassword: 'NovaSenha123',
    });

    await expect(validate(registerDto)).resolves.toHaveLength(0);
    await expect(validate(resetPasswordDto)).resolves.toHaveLength(0);
  });
});
