import { useQuery } from "@tanstack/react-query";

import {
  getFixtureCurrentPage,
  getFixtures,
} from "@/services/fixtures-service";
import type { FixturesQuery } from "@/types/fixture";

export function useFixtures(
  query: FixturesQuery,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ["fixtures", query],
    queryFn: () => getFixtures(query),
    enabled: options?.enabled ?? true,
  });
}

export function useFixtureCurrentPage(limit: number) {
  return useQuery({
    queryKey: ["fixtures", "current-page", limit],
    queryFn: () => getFixtureCurrentPage(limit),
  });
}
