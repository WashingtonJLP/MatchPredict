import type { DailyGame } from "@/types/daily-game";

export type MatchLiveContext = {
  isLive: boolean;
  label: string;
};

export function getMatchLiveContext(
  dailyGame: DailyGame | undefined,
): MatchLiveContext | undefined {
  if (dailyGame?.status === "LIVE") {
    return {
      isLive: true,
      label:
        dailyGame.minute === null
          ? "Ao vivo"
          : `Ao vivo · ${dailyGame.minute}'`,
    };
  }

  if (dailyGame?.status === "HALFTIME") {
    return {
      isLive: false,
      label: "Intervalo",
    };
  }

  return undefined;
}
