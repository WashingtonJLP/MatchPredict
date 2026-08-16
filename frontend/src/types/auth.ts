export type User = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  avatarUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  token: string;
  password: string;
  confirmPassword: string;
};

export type AuthResponse = {
  accessToken: string;
};

export type MessageResponse = {
  message: string;
};
