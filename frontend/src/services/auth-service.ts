import { httpClient } from "@/services/http-client";
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
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
