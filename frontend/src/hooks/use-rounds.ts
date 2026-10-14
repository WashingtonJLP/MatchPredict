import { useQuery } from "@tanstack/react-query";

import { getRoundStats, getRoundsCatalog } from "@/services/rounds-service";
import type { RoundSelection } from "@/types/round";

export function useRoundsCatalog() {
  return useQuery({
    queryKey: ["rounds", "catalog"],
    queryFn: getRoundsCatalog,
    staleTime: 60_000,
  });
}

export function useRoundStats(selection: RoundSelection | null) {
  return useQuery({
    queryKey: [
      "rounds",
      "stats",
      selection?.competitionId,
      selection?.seasonId,
      selection?.round,
    ],
    queryFn: () => getRoundStats(selection!),
    enabled: Boolean(selection),
    staleTime: 30_000,
  });
}
