import { applyDecorators } from '@nestjs/common';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export const passwordValidationMessage =
  'A senha deve possuir no minimo 8 caracteres, uma letra maiuscula, uma letra minuscula e um numero.';

export const passwordValidationRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

export function IsStrongPassword() {
  return applyDecorators(
    IsString({ message: 'A senha deve ser um texto.' }),
    MinLength(8, { message: passwordValidationMessage }),
    MaxLength(72, { message: 'A senha deve possuir no maximo 72 caracteres.' }),
    Matches(passwordValidationRegex, {
      message: passwordValidationMessage,
    }),
  );
}
