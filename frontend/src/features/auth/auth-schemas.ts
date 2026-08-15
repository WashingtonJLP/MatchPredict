import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Informe um e-mail valido."),
  password: z.string().min(1, "Informe sua senha."),
});

export const registerSchema = z.object({
  name: z.string().min(3, "Informe pelo menos 3 caracteres."),
  email: z.string().email("Informe um e-mail valido."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
});

export const profileSchema = z.object({
  name: z.string().min(3, "Informe pelo menos 3 caracteres."),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
