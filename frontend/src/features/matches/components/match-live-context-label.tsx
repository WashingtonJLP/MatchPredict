import { getMatchLiveContext } from "@/features/matches/match-live-context";
import type { DailyGame } from "@/types/daily-game";

type MatchLiveContextLabelProps = {
  dailyGame?: DailyGame;
  fallbackLabel: string;
};

export function MatchLiveContextLabel({
  dailyGame,
  fallbackLabel,
}: MatchLiveContextLabelProps) {
  const liveContext = getMatchLiveContext(dailyGame);

  return (
    <span
      className="inline-flex items-center justify-center gap-1 whitespace-nowrap text-xs font-extrabold uppercase leading-none tracking-normal opacity-80 sm:tracking-wide"
      aria-atomic="true"
      aria-live="polite"
    >
      {liveContext?.isLive ? (
        <span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden />
      ) : null}
      {liveContext?.label ?? fallbackLabel}
    </span>
  );
}
