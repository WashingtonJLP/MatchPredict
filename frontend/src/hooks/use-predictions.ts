import { useQuery } from "@tanstack/react-query";

import { getMyPredictions } from "@/services/predictions-service";

export function useMyPredictions() {
  return useQuery({
    queryKey: ["predictions", "my"],
    queryFn: getMyPredictions,
  });
}
