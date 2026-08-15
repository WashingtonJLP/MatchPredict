"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  clearStoredToken,
  getStoredToken,
  storeToken,
} from "@/lib/auth-storage";
import {
  login as loginRequest,
  register as registerRequest,
} from "@/services/auth-service";
import { getMe } from "@/services/user-service";
import type { LoginPayload, RegisterPayload, User } from "@/types/auth";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setToken(getStoredToken());
    setHasHydrated(true);
  }, []);

  const userQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getMe,
    enabled: Boolean(token),
    retry: false,
  });

  const logout = useCallback(() => {
    clearStoredToken();
    setToken(null);
    queryClient.clear();
    router.push("/login");
  }, [queryClient, router]);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const response = await loginRequest(payload);

      storeToken(response.accessToken);
      setToken(response.accessToken);
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      router.push("/dashboard");
    },
    [queryClient, router],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      await registerRequest(payload);
      await login({
        email: payload.email,
        password: payload.password,
      });
    },
    [login],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user: userQuery.data ?? null,
      token,
      isAuthenticated: Boolean(token),
      isLoading: !hasHydrated || userQuery.isLoading,
      login,
      register,
      logout,
    }),
    [
      hasHydrated,
      login,
      logout,
      register,
      token,
      userQuery.data,
      userQuery.isLoading,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
