import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createPrediction,
  deletePrediction,
  getMyPredictions,
  updatePrediction,
  type PredictionPayload,
  type UpdatePredictionPayload,
} from "@/services/predictions-service";

export function useMyPredictions() {
  return useQuery({
    queryKey: ["predictions", "my"],
    queryFn: getMyPredictions,
  });
}

export function useCreatePrediction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PredictionPayload) => createPrediction(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["fixtures"] });
      void queryClient.invalidateQueries({ queryKey: ["predictions", "my"] });
    },
  });
}

export function useUpdatePrediction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      predictionId,
      payload,
    }: {
      predictionId: string;
      payload: UpdatePredictionPayload;
    }) => updatePrediction(predictionId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["fixtures"] });
      void queryClient.invalidateQueries({ queryKey: ["predictions", "my"] });
    },
  });
}

export function useDeletePrediction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (predictionId: string) => deletePrediction(predictionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["fixtures"] });
      void queryClient.invalidateQueries({ queryKey: ["predictions", "my"] });
    },
  });
}
