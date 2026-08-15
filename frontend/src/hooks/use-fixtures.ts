import { useQuery } from "@tanstack/react-query";

import { getFixtures } from "@/services/fixtures-service";
import type { FixturesQuery } from "@/types/fixture";

export function useFixtures(query: FixturesQuery) {
  return useQuery({
    queryKey: ["fixtures", query],
    queryFn: () => getFixtures(query),
  });
}
