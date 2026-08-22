import { CalendarDays, CheckCircle2, Clock3 } from "lucide-react";

import { MatchHeader } from "@/features/matches/components/match-header";
import { PredictionButton } from "@/features/matches/components/prediction-button";
import { TeamBadge } from "@/features/matches/components/team-badge";
import { cn } from "@/lib/utils";
import type { MatchFixture } from "@/types/fixture";

type MatchCardProps = {
  fixture: MatchFixture;
  onPredict: (fixture: MatchFixture) => void;
};

export function MatchCard({ fixture, onPredict }: MatchCardProps) {
  const kickoff = new Date(fixture.kickoff);
  const predictionClosed =
    kickoff.getTime() <= Date.now() ||
    fixture.status === "LIVE" ||
    fixture.status === "FT";
  const hasPrediction = Boolean(fixture.userPrediction);
  const isFinished = fixture.status === "FT";
  const date = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(kickoff);
  const time = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(kickoff);
  const shouldShowFinalResult =
    fixture.status === "FT" &&
    fixture.homeGoals !== null &&
    fixture.awayGoals !== null;

  return (
    <article
      className={cn(
        "rounded-2xl border bg-card p-5 shadow-sm shadow-primary/5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10 sm:p-6",
        hasPrediction && "border-accent/30 bg-accent/5",
        isFinished && "border-border bg-muted/40",
      )}
    >
      <MatchHeader fixture={fixture} />

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-3 sm:gap-4">
        <TeamBadge team={fixture.homeTeam} />
        <span className="mt-5 rounded-xl bg-muted px-3 py-2 text-sm font-extrabold text-muted-foreground sm:mt-6">
          VS
        </span>
        <TeamBadge team={fixture.awayTeam} align="right" />
      </div>

      <div className="mt-6 grid gap-3 border-t border-border pt-5 text-base font-semibold text-muted-foreground sm:grid-cols-2">
        <span className="flex min-h-10 items-center gap-2 rounded-xl bg-background px-3">
          <CalendarDays className="size-5" aria-hidden />
          {date}
        </span>
        <span className="flex min-h-10 items-center gap-2 rounded-xl bg-background px-3 sm:justify-end">
          <Clock3 className="size-5" aria-hidden />
          {time}
        </span>
      </div>

      {fixture.userPrediction ? (
        <div className="mt-5 rounded-2xl border border-accent/20 bg-accent/10 p-4">
          <span className="inline-flex min-h-8 items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent">
            <CheckCircle2 className="size-4" aria-hidden />
            Palpite registrado
          </span>
          <p className="mt-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Seu palpite
          </p>
          <p className="mt-1 text-3xl font-extrabold leading-none text-accent">
            {fixture.userPrediction.homeGoals} x {fixture.userPrediction.awayGoals}
          </p>
        </div>
      ) : null}

      {predictionClosed ? (
        <div className="mt-5 inline-flex min-h-8 items-center rounded-full bg-muted px-3 py-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Palpites encerrados
        </div>
      ) : null}

      {shouldShowFinalResult ? (
        <div className="mt-4 rounded-2xl border border-border bg-background p-4">
          <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Resultado final
          </p>
          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
            <span className="truncate text-sm font-semibold text-foreground">
              {fixture.homeTeam.name}
            </span>
            <span className="rounded-xl bg-muted px-3 py-2 text-2xl font-extrabold leading-none text-foreground">
              {fixture.homeGoals} x {fixture.awayGoals}
            </span>
            <span className="truncate text-right text-sm font-semibold text-foreground">
              {fixture.awayTeam.name}
            </span>
          </div>
        </div>
      ) : null}

      <div className="mt-5">
        <PredictionButton fixture={fixture} onClick={() => onPredict(fixture)} />
      </div>
    </article>
  );
}
