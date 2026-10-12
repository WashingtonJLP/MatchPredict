export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "EXPIRED"
  | "CANCELLED"
  | "FAILED";

export type ParticipationPeriod = {
  referenceYear: number;
  referenceMonth: number;
  startsAt: string;
  endsAt: string;
  participationFeeCents: number;
  currency: "BRL";
};

export type CurrentParticipation = {
  active: boolean;
  status: "ACTIVE" | "CANCELLED" | null;
  activatedAt: string | null;
  period: ParticipationPeriod;
};

export type PaymentHistoryItem = {
  id: string;
  period: Omit<ParticipationPeriod, "participationFeeCents" | "currency">;
  amountCents: number;
  currency: "BRL";
  method: "PIX";
  status: PaymentStatus;
  expiresAt: string | null;
  paidAt: string | null;
  createdAt: string;
};

export type PixPayment = {
  id: string;
  status: PaymentStatus;
  amountCents: number;
  currency: "BRL";
  method: "PIX";
  pixCopyPaste: string | null;
  pixQrCode: string | null;
  expiresAt: string | null;
  createdAt: string;
};

export type PaymentStatusResponse = Pick<
  PaymentHistoryItem,
  "id" | "status" | "paidAt" | "expiresAt"
>;

export type PaymentReconciliationResponse = {
  status: "PENDING" | "EXPIRED" | "PAID";
  result: "confirmed" | "not_received" | "already_paid";
  retryAfterSeconds: number;
};
