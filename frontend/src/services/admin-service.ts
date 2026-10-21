import { httpClient } from "@/services/http-client";
import type {
  AdminAuditLog,
  AdminDashboard,
  AdminDeletionImpact,
  AdminFinancialReview,
  AdminPage,
  AdminParticipation,
  AdminPayment,
  AdminPeriod,
  AdminUserDetail,
  AdminUserSummary,
  PaymentStatus,
  ParticipationStatus,
} from "@/types/admin";

export type AdminUsersParams = {
  page: number;
  limit?: number;
  search?: string;
  role?: "USER" | "ADMIN";
  accountStatus?: "ACTIVE" | "DISABLED";
};

export type AdminPaymentsParams = {
  page: number;
  limit?: number;
  status?: PaymentStatus;
  periodId?: string;
  user?: string;
};

export type AdminParticipationsParams = {
  page: number;
  limit?: number;
  status?: ParticipationStatus;
  periodId?: string;
  user?: string;
};

export async function getAdminDashboard() {
  const { data } = await httpClient.get<AdminDashboard>("/admin/dashboard");
  return data;
}

export async function getAdminPeriods() {
  const { data } = await httpClient.get<AdminPeriod[]>("/admin/periods");
  return data;
}

export async function getAdminUsers(params: AdminUsersParams) {
  const { data } = await httpClient.get<AdminPage<AdminUserSummary>>(
    "/admin/users",
    { params },
  );
  return data;
}

export async function getAdminUser(userId: string) {
  const { data } = await httpClient.get<AdminUserDetail>(
    `/admin/users/${userId}`,
  );
  return data;
}

export async function getAdminDeletionImpact(userId: string) {
  const { data } = await httpClient.get<AdminDeletionImpact>(
    `/admin/users/${userId}/deletion-impact`,
  );
  return data;
}

export async function deleteAdminUser(userId: string) {
  const { data } = await httpClient.delete<{ message: string }>(
    `/admin/users/${userId}`,
    { data: { confirmation: "EXCLUIR" } },
  );
  return data;
}

export async function removeAdminUserAvatar(userId: string) {
  const { data } = await httpClient.delete<{ avatarUrl: null }>(
    `/admin/users/${userId}/avatar`,
  );
  return data;
}

export async function disableAdminUser(userId: string) {
  const { data } = await httpClient.patch<AdminUserDetail>(
    `/admin/users/${userId}/disable`,
  );
  return data;
}

export async function reactivateAdminUser(userId: string) {
  const { data } = await httpClient.patch<AdminUserDetail>(
    `/admin/users/${userId}/reactivate`,
  );
  return data;
}

export async function getAdminPayments(params: AdminPaymentsParams) {
  const { data } = await httpClient.get<AdminPage<AdminPayment>>(
    "/admin/payments",
    { params },
  );
  return data;
}

export async function getAdminParticipations(
  params: AdminParticipationsParams,
) {
  const { data } = await httpClient.get<AdminPage<AdminParticipation>>(
    "/admin/participations",
    { params },
  );
  return data;
}

export async function getAdminFinancialReviews(page: number, limit = 20) {
  const { data } = await httpClient.get<AdminPage<AdminFinancialReview>>(
    "/admin/financial-reviews",
    { params: { page, limit } },
  );
  return data;
}

export async function getAdminAuditLogs(page: number, limit = 20) {
  const { data } = await httpClient.get<AdminPage<AdminAuditLog>>(
    "/admin/audit-logs",
    { params: { page, limit } },
  );
  return data;
}
