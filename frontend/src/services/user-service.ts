import { httpClient } from "@/services/http-client";
import type { User } from "@/types/auth";
import type { UserStatistics } from "@/types/statistics";

export type UpdateProfilePayload = {
  name: string;
};

export async function getMe() {
  const { data } = await httpClient.get<User>("/users/me");

  return data;
}

export async function updateProfile(payload: UpdateProfilePayload) {
  const { data } = await httpClient.patch<User>("/users/me", payload);

  return data;
}

export async function getMyStatistics() {
  const { data } = await httpClient.get<UserStatistics>("/users/me/statistics");

  return data;
}
