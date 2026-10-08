import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { getPaymentStatusPollInterval } from "@/features/participation/payment-polling";
import {
  createPixPayment,
  getCurrentParticipation,
  getCurrentPixPayment,
  getMyPayments,
  getPaymentStatus,
} from "@/services/payments-service";

export function useCurrentParticipation() {
  return useQuery({
    queryKey: ["participations", "me", "current"],
    queryFn: getCurrentParticipation,
  });
}

export function useMyPayments() {
  return useQuery({
    queryKey: ["payments", "me"],
    queryFn: getMyPayments,
  });
}

export function useCurrentPixPayment() {
  return useQuery({
    queryKey: ["payments", "me", "current-pix"],
    queryFn: getCurrentPixPayment,
  });
}

export function useCreatePixPayment() {
  return useMutation({
    mutationFn: createPixPayment,
  });
}

export function usePaymentStatus(paymentId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["payments", paymentId, "status"],
    queryFn: () => getPaymentStatus(paymentId ?? ""),
    enabled: Boolean(paymentId) && enabled,
    refetchInterval: (query) =>
      getPaymentStatusPollInterval(query.state.data?.status),
    refetchIntervalInBackground: false,
    retry: 1,
  });
}

export function useRefreshParticipationData() {
  const queryClient = useQueryClient();

  return useCallback(
    () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["participations", "me", "current"],
        }),
        queryClient.invalidateQueries({ queryKey: ["payments", "me"] }),
        queryClient.invalidateQueries({
          queryKey: ["payments", "me", "current-pix"],
        }),
      ]),
    [queryClient],
  );
}
