import axios from "axios";
import { toast } from "sonner";

import { clearStoredToken, getStoredToken } from "@/lib/auth-storage";

export const httpClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

httpClient.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      clearStoredToken();
      toast.error("Sessao expirada. Entre novamente.");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);
