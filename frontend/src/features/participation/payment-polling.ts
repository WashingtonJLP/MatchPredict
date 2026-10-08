import type { PaymentStatus } from "@/types/payment";

export const PAYMENT_STATUS_POLL_INTERVAL_MS = 30_000;

export function getPaymentStatusPollInterval(
  status: PaymentStatus | undefined,
) {
  return status === "PENDING" ? PAYMENT_STATUS_POLL_INTERVAL_MS : false;
}
