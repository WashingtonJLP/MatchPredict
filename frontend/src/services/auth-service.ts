import { httpClient } from "@/services/http-client";
import type {
  AuthResponse,
  ForgotPasswordPayload,
  LoginPayload,
  MessageResponse,
  RegisterPayload,
  ResetPasswordPayload,
  User,
} from "@/types/auth";

export async function login(payload: LoginPayload) {
  const { data } = await httpClient.post<AuthResponse>("/auth/login", payload);

  return data;
}

export async function register(payload: RegisterPayload) {
  const { data } = await httpClient.post<User>("/auth/register", payload);

  return data;
}

export async function forgotPassword(payload: ForgotPasswordPayload) {
  const { data } = await httpClient.post<MessageResponse>(
    "/auth/forgot-password",
    payload,
  );

  return data;
}

export async function resetPassword(payload: ResetPasswordPayload) {
  const { data } = await httpClient.post<MessageResponse>(
    "/auth/reset-password",
    payload,
  );

  return data;
}
