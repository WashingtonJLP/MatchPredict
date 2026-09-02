import type { DailyGamesCompetition } from "@/types/daily-game";

export const pregameWindowMs = 60 * 60 * 1000;

export function isWithinPregameWindow(
  kickoff: string,
  currentTime: number,
) {
  const kickoffTime = Date.parse(kickoff);

  if (Number.isNaN(kickoffTime)) {
    return false;
  }

  const timeUntilKickoff = kickoffTime - currentTime;

  return timeUntilKickoff > 0 && timeUntilKickoff <= pregameWindowMs;
}

export function findNextScheduledVisualBoundary(
  competitions: DailyGamesCompetition[],
  currentTime: number,
) {
  let nextBoundary: number | null = null;

  for (const competition of competitions) {
    for (const game of competition.games) {
      if (game.status !== "SCHEDULED") {
        continue;
      }

      const kickoffTime = Date.parse(game.kickoff);

      if (Number.isNaN(kickoffTime)) {
        continue;
      }

      const boundaries = [kickoffTime - pregameWindowMs, kickoffTime];

      for (const boundary of boundaries) {
        if (
          boundary > currentTime &&
          (nextBoundary === null || boundary < nextBoundary)
        ) {
          nextBoundary = boundary;
        }
      }
    }
  }

  return nextBoundary;
}
