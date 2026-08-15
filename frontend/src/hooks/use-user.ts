import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getMe,
  getMyStatistics,
  updateProfile,
  type UpdateProfilePayload,
} from "@/services/user-service";

export function useMe() {
  return useQuery({
    queryKey: ["users", "me"],
    queryFn: getMe,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateProfile(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users", "me"] });
      void queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}

export function useMyStatistics() {
  return useQuery({
    queryKey: ["users", "me", "statistics"],
    queryFn: getMyStatistics,
  });
}
