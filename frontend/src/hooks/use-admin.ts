import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteAdminUser,
  disableAdminUser,
  getAdminAuditLogs,
  getAdminDashboard,
  getAdminDeletionImpact,
  getAdminFinancialReviews,
  getAdminParticipations,
  getAdminPayments,
  getAdminPeriods,
  getAdminUser,
  getAdminUsers,
  reactivateAdminUser,
  removeAdminUserAvatar,
  type AdminParticipationsParams,
  type AdminPaymentsParams,
  type AdminUsersParams,
} from "@/services/admin-service";
import type { AdminUserDetail } from "@/types/admin";
import type { User } from "@/types/auth";

export function useRemoveAdminUserAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeAdminUserAvatar,
    onSuccess: (result, userId) => {
      queryClient.setQueryData<AdminUserDetail>(
        ["admin", "users", userId],
        (previous) => (previous ? { ...previous, ...result } : previous),
      );
      for (const key of [
        ["auth", "me"],
        ["users", "me"],
      ]) {
        queryClient.setQueryData<User>(key, (previous) =>
          previous?.id === userId ? { ...previous, ...result } : previous,
        );
      }
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
      void queryClient.invalidateQueries({ queryKey: ["standings"] });
      void queryClient.invalidateQueries({ queryKey: ["rounds", "stats"] });
    },
  });
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: getAdminDashboard,
  });
}

export function useAdminPeriods() {
  return useQuery({
    queryKey: ["admin", "periods"],
    queryFn: getAdminPeriods,
    staleTime: 5 * 60_000,
  });
}

export function useAdminUsers(params: AdminUsersParams) {
  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => getAdminUsers(params),
  });
}

export function useAdminUser(userId: string) {
  return useQuery({
    queryKey: ["admin", "users", userId],
    queryFn: () => getAdminUser(userId),
    enabled: Boolean(userId),
  });
}

export function useAdminDeletionImpact(userId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "users", userId, "deletion-impact"],
    queryFn: () => getAdminDeletionImpact(userId),
    enabled: enabled && Boolean(userId),
    staleTime: 0,
  });
}

export function useAdminPayments(params: AdminPaymentsParams) {
  return useQuery({
    queryKey: ["admin", "payments", params],
    queryFn: () => getAdminPayments(params),
  });
}

export function useAdminParticipations(params: AdminParticipationsParams) {
  return useQuery({
    queryKey: ["admin", "participations", params],
    queryFn: () => getAdminParticipations(params),
  });
}

export function useAdminFinancialReviews(page: number) {
  return useQuery({
    queryKey: ["admin", "financial-reviews", page],
    queryFn: () => getAdminFinancialReviews(page),
  });
}

export function useAdminAuditLogs(page: number) {
  return useQuery({
    queryKey: ["admin", "audit-logs", page],
    queryFn: () => getAdminAuditLogs(page),
  });
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAdminUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
  });
}

export function useDisableAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: disableAdminUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
  });
}

export function useReactivateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reactivateAdminUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
  });
}
