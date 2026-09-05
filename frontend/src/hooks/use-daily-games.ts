import {
  keepPreviousData,
  useQueries,
  useQuery,
} from "@tanstack/react-query";

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

type DailyGamesOptions = {
  competition?: string;
  enabled?: boolean;
};

function dailyGamesQueryOptions(
  date: string,
  options?: DailyGamesOptions,
) {
  const competition = options?.competition;

  return {
    queryKey: ["daily-games", date, competition ?? "all"],
    queryFn: () => getDailyGames(date, competition),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
    refetchInterval: (query: {
      state: { data: DailyGamesResponse | undefined };
    }) => resolveRefetchInterval(query.state.data),
    refetchIntervalInBackground: false,
  };
}

export function useDailyGames(date: string, options?: DailyGamesOptions) {
  return useQuery(dailyGamesQueryOptions(date, options));
}

export function useDailyGamesForDates(
  dates: string[],
  options?: DailyGamesOptions,
) {
  return useQueries({
    queries: dates.map((date) => dailyGamesQueryOptions(date, options)),
  });
}
