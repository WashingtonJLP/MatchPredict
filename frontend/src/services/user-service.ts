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

export async function uploadAvatar(file: File) {
  const body = new FormData();
  body.append("file", file);
  const { data } = await httpClient.put<{ avatarUrl: string }>(
    "/users/me/avatar",
    body,
    {
      headers: { "Content-Type": undefined },
    },
  );
  return data;
}

export async function removeAvatar() {
  const { data } = await httpClient.delete<{ avatarUrl: null }>(
    "/users/me/avatar",
  );
  return data;
}
