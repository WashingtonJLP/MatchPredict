import type { DailyGame, DailyGameScore } from "@/types/daily-game";

export function getDailyGameShootoutScore(
  game: DailyGame,
): DailyGameScore | null {
  if (game.status !== "FINAL_PENALTIES") {
    return null;
  }

  const home = game.shootoutScore?.home;
  const away = game.shootoutScore?.away;

  return Number.isInteger(home) && Number.isInteger(away)
    ? { home: home as number, away: away as number }
    : null;
}
