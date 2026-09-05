import type {
  DailyGame,
  DailyGamesCompetition,
} from "@/types/daily-game";
import type { FixtureStatusValue } from "@/types/fixture";

type FixtureWithKickoff = {
  kickoff: string;
};

type FixtureWithSourceEventId = {
  sourceEventId: string;
};

export function getUniqueFixtureDates<T extends FixtureWithKickoff>(
  fixtures: T[],
  formatDate: (kickoff: string) => string,
) {
  return Array.from(
    new Set(fixtures.map((fixture) => formatDate(fixture.kickoff))),
  ).sort();
}

export function buildPremierLeagueGamesBySourceEventId(
  competitions: DailyGamesCompetition[] | undefined,
  unavailable = false,
) {
  if (unavailable) {
    return new Map<string, DailyGame>();
  }

  const premierLeagueCompetitions = competitions?.filter(
    (competition) => competition.id === "eng.1",
  );

  return new Map(
    (premierLeagueCompetitions ?? [])
      .flatMap((competition) => competition.games)
      .map((game) => [game.sourceEventId, game]),
  );
}

export function getDailyGameForFixture(
  gamesBySourceEventId: Map<string, DailyGame>,
  fixture: FixtureWithSourceEventId,
) {
  return gamesBySourceEventId.get(fixture.sourceEventId);
}

export function getTransparencyVisualGame(dailyGame: DailyGame | undefined) {
  if (
    !dailyGame ||
    dailyGame.status === "SCHEDULED" ||
    dailyGame.status === "UNKNOWN"
  ) {
    return undefined;
  }

  return dailyGame;
}

export function getTransparencyStatusLabel(dailyGame: DailyGame) {
  const labels: Partial<Record<DailyGame["status"], string>> = {
    LIVE: "Ao vivo",
    HALFTIME: "Intervalo",
    FINAL: "Encerrado",
    FINAL_PENALTIES: "Pênaltis",
    DELAYED: "Atrasado",
    POSTPONED: "Adiado",
    CANCELED: "Cancelado",
    SUSPENDED: "Suspenso",
  };

  return labels[dailyGame.status] ?? dailyGame.statusLabel;
}

export function getTransparencyFixtureStatusLabel(
  status: FixtureStatusValue,
) {
  const labels: Record<FixtureStatusValue, string> = {
    NS: "Agendada",
    LIVE: "Ao vivo",
    FT: "Encerrado",
    POSTPONED: "Adiado",
    CANCELLED: "Cancelado",
  };

  return labels[status];
}

export function hasCompleteDailyGameScore(
  dailyGame: DailyGame | undefined,
): dailyGame is DailyGame & {
  score: { away: number; home: number };
} {
  return Boolean(
    dailyGame &&
      dailyGame.score.home !== null &&
      dailyGame.score.away !== null,
  );
}
