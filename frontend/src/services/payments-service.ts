import { httpClient } from "@/services/http-client";
import type {
  CurrentParticipation,
  PaymentHistoryItem,
  PaymentStatusResponse,
  PixPayment,
} from "@/types/payment";

export async function getCurrentParticipation() {
  const { data } = await httpClient.get<CurrentParticipation>(
    "/participations/me/current",
  );

  return data;
}

export async function getMyPayments() {
  const { data } = await httpClient.get<PaymentHistoryItem[]>("/payments/me");

  return data;
}

export async function getCurrentPixPayment() {
  const { data } = await httpClient.get<PixPayment | null>(
    "/payments/me/current-pix",
  );

  return data;
}

export async function createPixPayment() {
  const { data } = await httpClient.post<PixPayment>("/payments/pix");

  return data;
}

export async function getPaymentStatus(paymentId: string) {
  const { data } = await httpClient.get<PaymentStatusResponse>(
    `/payments/${paymentId}/status`,
  );

  return data;
}
