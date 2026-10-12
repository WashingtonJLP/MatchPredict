import type {
  AdminAuditAction,
  PaymentStatus,
  ParticipationStatus,
} from "@/types/admin";

export function formatAdminDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

export function formatAdminCurrency(amountCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amountCents / 100);
}

export function formatAdminPeriod(year: number, month: number) {
  const value = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 15)));
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export const paymentStatusLabel: Record<PaymentStatus, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  EXPIRED: "Expirado",
  CANCELLED: "Cancelado",
  FAILED: "Falhou",
};

export const participationStatusLabel: Record<ParticipationStatus, string> = {
  ACTIVE: "Ativa",
  CANCELLED: "Cancelada",
};

export const auditActionLabel: Record<AdminAuditAction, string> = {
  USER_DELETED: "Usuário excluído",
  USER_DISABLED: "Conta desativada",
  USER_REACTIVATED: "Conta reativada",
};
