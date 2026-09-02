"use client";

import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";

import { DailyGameRow } from "@/features/daily-games/components/daily-game-row";
import { findNextScheduledVisualBoundary } from "@/features/daily-games/components/daily-game-timing";
import type {
  DailyGameStage,
  DailyGamesCompetition,
} from "@/types/daily-game";

type DailyGamesListProps = {
  competitions: DailyGamesCompetition[];
};

const maxTimerDelayMs = 2_147_483_647;

export function DailyGamesList({ competitions }: DailyGamesListProps) {
  const [visualClockRevision, setVisualClockRevision] = useState(0);

  useEffect(() => {
    const currentTime = Date.now();
    const nextBoundary = findNextScheduledVisualBoundary(
      competitions,
      currentTime,
    );

    if (nextBoundary === null) {
      return;
    }

    const delay = Math.min(nextBoundary - currentTime, maxTimerDelayMs);
    const timer = window.setTimeout(() => {
      setVisualClockRevision((revision) => revision + 1);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [competitions, visualClockRevision]);

  return (
    <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300 sm:space-y-8">
      {competitions.map((competition) => {
        const stage = resolveSharedStage(competition);

        return (
          <section
            key={competition.id}
            className="overflow-hidden rounded-2xl border border-border bg-card"
          >
            <div className="flex items-stretch gap-3 border-b border-border bg-secondary/60 px-4 py-3.5">
              <span
                className="w-1 shrink-0 rounded-full bg-accent"
                aria-hidden
              />
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card shadow-sm">
                  {competition.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={competition.logo}
                      alt=""
                      className="size-7 object-contain"
                    />
                  ) : (
                    <Trophy className="size-5 text-accent" aria-hidden />
                  )}
                </span>
                <div className="min-w-0">
                  <h2 className="line-clamp-2 text-lg font-extrabold leading-tight text-primary sm:text-xl">
                    {competition.name}
                  </h2>
                  <p className="mt-1 text-sm font-semibold leading-5 text-muted-foreground">
                    {stage ? `${stage.label} · ` : null}
                    {competition.games.length}{" "}
                    {competition.games.length === 1 ? "jogo" : "jogos"}
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-border/80">
              {competition.games.map((game) => (
                <DailyGameRow key={game.id} game={game} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function resolveSharedStage(
  competition: DailyGamesCompetition,
): DailyGameStage | null {
  const [firstGame, ...remainingGames] = competition.games;
  const stage = firstGame?.stage;

  if (!stage) {
    return null;
  }

  const allGamesShareStage = remainingGames.every(
    (game) =>
      game.stage?.type === stage.type &&
      game.stage.label === stage.label &&
      game.stage.number === stage.number,
  );

  return allGamesShareStage ? stage : null;
}
