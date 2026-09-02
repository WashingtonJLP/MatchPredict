import { Trophy } from "lucide-react";

import { DailyGameRow } from "@/features/daily-games/components/daily-game-row";
import type { DailyGamesCompetition } from "@/types/daily-game";

type DailyGamesListProps = {
  competitions: DailyGamesCompetition[];
};

export function DailyGamesList({ competitions }: DailyGamesListProps) {
  return (
    <div className="space-y-4 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
      {competitions.map((competition) => (
        <section
          key={competition.id}
          className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border"
        >
          <div className="flex items-stretch gap-3 border-b border-border bg-muted/50 px-3.5 py-3 sm:px-4">
            <span
              className="w-1 shrink-0 rounded-full bg-accent"
              aria-hidden
            />
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-card shadow-sm">
                {competition.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={competition.logo}
                    alt=""
                    className="size-6 object-contain"
                  />
                ) : (
                  <Trophy className="size-5 text-accent" aria-hidden />
                )}
              </span>
              <div className="min-w-0">
                <h2 className="line-clamp-2 text-lg font-extrabold leading-tight text-primary sm:text-xl">
                  {competition.name}
                </h2>
                <p className="mt-0.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
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
      ))}
    </div>
  );
}
