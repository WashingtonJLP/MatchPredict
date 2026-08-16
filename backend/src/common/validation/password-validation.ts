import { applyDecorators } from '@nestjs/common';
import { IsString, Matches, MinLength } from 'class-validator';

export const passwordValidationMessage =
  'A senha deve possuir no mínimo 8 caracteres, uma letra maiúscula, uma letra minúscula e um número.';

export const passwordValidationRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

export function IsStrongPassword() {
  return applyDecorators(
    IsString({ message: 'A senha deve ser um texto.' }),
    MinLength(8, { message: passwordValidationMessage }),
    Matches(passwordValidationRegex, {
      message: passwordValidationMessage,
    }),
  );
}
