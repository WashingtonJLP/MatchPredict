import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { getDailyGames } from "@/services/daily-games-service";
import type { DailyGamesResponse } from "@/types/daily-game";

function hasLiveGame(data: DailyGamesResponse | undefined) {
  return data?.competitions.some((competition) =>
    competition.games.some((game) =>
      game.status === "LIVE" || game.status === "HALFTIME",
    ),
  );
}

function resolveRefetchInterval(data: DailyGamesResponse | undefined) {
  if (!data) {
    return false;
  }

  if (hasLiveGame(data)) {
    return 30_000;
  }

  return Math.max(data.meta.cacheTtlSeconds * 1000, 300_000);
}

export function useDailyGames(date: string) {
  return useQuery({
    queryKey: ["daily-games", date],
    queryFn: () => getDailyGames(date),
    placeholderData: keepPreviousData,
    refetchInterval: (query) =>
      resolveRefetchInterval(query.state.data as DailyGamesResponse | undefined),
  });
}
