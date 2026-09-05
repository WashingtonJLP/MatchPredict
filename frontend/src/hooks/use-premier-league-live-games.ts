import { useMemo } from "react";

import { formatDateInSaoPaulo } from "@/features/daily-games/components/date-utils";
import {
  buildPremierLeagueGamesBySourceEventId,
  getUniqueFixtureDates,
} from "@/features/transparency/transparency-live-game";
import { useDailyGamesForDates } from "@/hooks/use-daily-games";

type PremierLeagueFixture = {
  kickoff: string;
  sourceEventId: string;
};

export function usePremierLeagueLiveGames<T extends PremierLeagueFixture>(
  fixtures: T[],
) {
  const fixtureDates = useMemo(
    () =>
      getUniqueFixtureDates(fixtures, (kickoff) =>
        formatDateInSaoPaulo(new Date(kickoff)),
      ),
    [fixtures],
  );
  const dailyGamesQueries = useDailyGamesForDates(fixtureDates, {
    competition: "eng.1",
    enabled: fixtureDates.length > 0,
  });

  return buildPremierLeagueGamesBySourceEventId(
    dailyGamesQueries.flatMap((query) =>
      query.isError || query.isRefetchError
        ? []
        : (query.data?.competitions ?? []),
    ),
  );
}
