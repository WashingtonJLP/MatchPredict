import { AxiosError } from "axios";

type ApiErrorResponse = {
  message?: string | string[];
  error?: string;
};

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    if (error.code === "ERR_NETWORK" || !error.response) {
      return "Nao foi possivel conectar com a API. Verifique se o backend esta rodando.";
    }

    const data = error.response?.data as ApiErrorResponse | undefined;
    const message = data?.message;

    if (Array.isArray(message)) {
      return message.join(" ");
    }

    return message ?? data?.error ?? fallback;
  }

  return fallback;
}
