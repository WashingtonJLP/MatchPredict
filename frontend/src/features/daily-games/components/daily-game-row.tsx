import { Clock3 } from "lucide-react";

import { DailyGameStatus } from "@/features/daily-games/components/daily-game-status";
import { isWithinPregameWindow } from "@/features/daily-games/components/daily-game-timing";
import { cn } from "@/lib/utils";
import type { DailyGame, DailyGameTeam } from "@/types/daily-game";

type DailyGameRowProps = {
  game: DailyGame;
};

export function DailyGameRow({ game }: DailyGameRowProps) {
  const hasScore = game.score.home !== null && game.score.away !== null;
  const isLive = game.status === "LIVE";
  const isFinished =
    game.status === "FINAL" || game.status === "FINAL_PENALTIES";
  const shouldShowStatus = shouldShowStatusLabel(game);

  return (
    <article
      className={cn(
        "group grid min-h-[4.75rem] grid-cols-[minmax(0,1fr)_4.5rem_minmax(0,1fr)] items-center gap-1.5 px-2.5 py-2.5 transition duration-200 sm:min-h-[4.25rem] sm:grid-cols-[minmax(0,1fr)_7.25rem_minmax(0,1fr)] sm:gap-4 sm:px-4",
        "hover:bg-muted/70 focus-within:bg-muted/70 motion-safe:hover:-translate-y-px",
        isLive && "bg-accent/10 hover:bg-accent/15",
        isFinished && "bg-muted/30",
      )}
    >
      <TeamCell team={game.homeTeam} />

      <MatchCenter
        game={game}
        hasScore={hasScore}
        isLive={isLive}
        shouldShowStatus={shouldShowStatus}
      />

      <TeamCell team={game.awayTeam} align="right" />
    </article>
  );
}

function MatchCenter({
  game,
  hasScore,
  isLive,
  shouldShowStatus,
}: {
  game: DailyGame;
  hasScore: boolean;
  isLive: boolean;
  shouldShowStatus: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center justify-center gap-1 text-center">
      {hasScore ? (
        <div
          className={cn(
            "flex items-baseline justify-center gap-1.5 rounded-xl px-2 py-1.5 text-primary transition duration-200 tabular-nums sm:gap-2 sm:px-2.5",
            isLive
              ? "bg-accent text-accent-foreground shadow-lg shadow-accent/20"
              : "bg-primary text-primary-foreground",
          )}
        >
          <span className="min-w-3 text-center text-xl font-extrabold leading-none sm:min-w-4 sm:text-2xl">
            {game.score.home}
          </span>
          <span className="text-sm font-extrabold opacity-70">×</span>
          <span className="min-w-3 text-center text-xl font-extrabold leading-none sm:min-w-4 sm:text-2xl">
            {game.score.away}
          </span>
        </div>
      ) : (
        <div className="flex min-h-10 min-w-[4.25rem] items-center justify-center rounded-xl bg-primary/5 px-2 text-base font-extrabold text-primary tabular-nums sm:min-w-[4.5rem] sm:px-2.5 sm:text-lg">
          <Clock3
            className="mr-0.5 size-3.5 text-muted-foreground sm:mr-1"
            aria-hidden
          />
          {game.localTime}
        </div>
      )}

      {shouldShowStatus ? (
        <DailyGameStatus
          compact
          label={game.statusLabel}
          minute={game.minute}
          status={game.status}
        />
      ) : null}
    </div>
  );
}

function shouldShowStatusLabel(game: DailyGame) {
  if (game.status !== "SCHEDULED") {
    return true;
  }

  return isKickoffSoon(game.kickoff);
}

function isKickoffSoon(kickoff: string) {
  return isWithinPregameWindow(kickoff, Date.now());
}

function TeamCell({
  align = "left",
  team,
}: {
  align?: "left" | "right";
  team: DailyGameTeam;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col items-center gap-1 text-center sm:flex-row sm:gap-3 sm:text-left",
        align === "right" && "sm:flex-row-reverse sm:text-right",
      )}
    >
      <LogoMark logo={team.logo} name={team.name} />
      <div className="min-w-0">
        <p
          className={cn(
            "line-clamp-2 text-sm font-extrabold leading-4 text-foreground sm:truncate sm:text-base sm:leading-5",
            align === "right" && "sm:text-right",
          )}
        >
          {team.name}
        </p>
        {team.abbreviation ? (
          <p className="mt-0.5 hidden text-xs font-bold uppercase tracking-wide text-accent sm:block">
            {team.abbreviation}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function LogoMark({ logo, name }: { logo: string | null; name: string }) {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-border bg-card shadow-sm transition duration-200 group-hover:border-accent/40 sm:size-10">
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" className="size-6 object-contain sm:size-8" />
      ) : (
        <span className="text-xs font-extrabold text-muted-foreground">
          {name.slice(0, 2).toUpperCase()}
        </span>
      )}
    </span>
  );
}
