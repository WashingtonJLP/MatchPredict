import { z } from "zod";

export const passwordValidationMessage =
  "A senha deve possuir no mínimo 8 caracteres, uma letra maiúscula, uma letra minúscula e um número.";

export const passwordRequirements = [
  {
    label: "8 caracteres",
    validate: (password: string) => password.length >= 8,
  },
  {
    label: "uma letra maiúscula",
    validate: (password: string) => /[A-Z]/.test(password),
  },
  {
    label: "uma letra minúscula",
    validate: (password: string) => /[a-z]/.test(password),
  },
  {
    label: "um número",
    validate: (password: string) => /[0-9]/.test(password),
  },
];

const passwordSchema = z.string().refine(
  (password) =>
    passwordRequirements.every((requirement) =>
      requirement.validate(password),
    ),
  passwordValidationMessage,
);

export const loginSchema = z.object({
  email: z.string().email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe sua senha."),
});

export const registerSchema = z.object({
  name: z.string().min(3, "Informe pelo menos 3 caracteres."),
  email: z.string().email("Informe um e-mail válido."),
  password: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Informe um e-mail válido."),
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirme sua nova senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem.",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  name: z.string().min(3, "Informe pelo menos 3 caracteres."),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
