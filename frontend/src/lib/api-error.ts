import { AxiosError } from "axios";

type ApiErrorResponse = {
  message?: string | string[];
  error?: string;
};

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    if (error.code === "ERR_NETWORK" || !error.response) {
      return "Não foi possível conectar ao servidor.";
    }

    if (error.response.status === 401) {
      return "Sua sessão expirou. Faça login novamente.";
    }

    const data = error.response?.data as ApiErrorResponse | undefined;
    const message = data?.message;

    if (Array.isArray(message)) {
      return normalizeTechnicalMessage(message.join(" "), fallback);
    }

    return normalizeTechnicalMessage(message ?? data?.error, fallback);
  }

  return fallback;
}

function normalizeTechnicalMessage(message: string | undefined, fallback: string) {
  if (!message) {
    return fallback;
  }

  const normalized = message.toLowerCase();

  if (
    normalized.includes("network error") ||
    normalized.includes("failed to fetch")
  ) {
    return "Não foi possível conectar ao servidor.";
  }

  if (
    normalized.includes("unauthorized") ||
    normalized.includes("jwt") ||
    normalized.includes("token")
  ) {
    return "Sua sessão expirou. Faça login novamente.";
  }

  if (
    normalized.includes("internal server error") ||
    normalized.includes("erro inesperado")
  ) {
    return "Não foi possível concluir a operação. Tente novamente.";
  }

  return message;
}
