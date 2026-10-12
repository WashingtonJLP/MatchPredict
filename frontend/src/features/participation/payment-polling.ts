import type { PaymentStatus } from "@/types/payment";

export const PAYMENT_STATUS_POLL_INTERVAL_MS = 30_000;
export const PAYMENT_AUTO_RECONCILIATION_DELAY_MS = 90_000;

export function getPaymentStatusPollInterval(
  status: PaymentStatus | undefined,
) {
  return status === "PENDING" ? PAYMENT_STATUS_POLL_INTERVAL_MS : false;
}

export function getReconciliationCooldownMs(error: unknown) {
  if (typeof error !== "object" || error === null || !("response" in error)) {
    return null;
  }

  const response = error.response;
  if (typeof response !== "object" || response === null) {
    return null;
  }

  const status = "status" in response ? response.status : undefined;
  const data = "data" in response ? response.data : undefined;
  if (status !== 429 || typeof data !== "object" || data === null) {
    return null;
  }

  const retryAfterSeconds =
    "retryAfterSeconds" in data ? data.retryAfterSeconds : undefined;
  if (
    typeof retryAfterSeconds !== "number" ||
    !Number.isFinite(retryAfterSeconds) ||
    retryAfterSeconds <= 0 ||
    retryAfterSeconds > 300
  ) {
    return null;
  }

  return Math.ceil(retryAfterSeconds * 1_000);
}
