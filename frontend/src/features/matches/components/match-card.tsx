import { CalendarDays, CheckCircle2, Clock3, Pencil } from "lucide-react";

import { MatchHeader } from "@/features/matches/components/match-header";
import { PredictionButton } from "@/features/matches/components/prediction-button";
import { TeamBadge } from "@/features/matches/components/team-badge";
import { cn } from "@/lib/utils";
import type { MatchFixture } from "@/types/fixture";

type MatchCardProps = {
  fixture: MatchFixture;
  onPredict: (fixture: MatchFixture) => void;
};

type MatchCenterProps = {
  fixture: MatchFixture;
  time: string;
};

function MatchCenter({ fixture, time }: MatchCenterProps) {
  const hasScore = fixture.homeGoals !== null && fixture.awayGoals !== null;
  const isLive = fixture.status === "LIVE";
  const isFinished = fixture.status === "FT";

  if ((isLive || isFinished) && hasScore) {
    return (
      <div
        className={cn(
          "flex min-w-[5.75rem] flex-col items-center rounded-2xl px-3 py-2.5 shadow-sm sm:min-w-28",
          isLive
            ? "bg-accent text-accent-foreground shadow-accent/20"
            : "bg-primary text-primary-foreground shadow-primary/15",
        )}
      >
        <span className="text-xs font-extrabold uppercase tracking-wide opacity-80">
          {isLive ? "Ao vivo" : "Final"}
        </span>
        <span className="mt-1 text-2xl font-extrabold leading-none tabular-nums sm:text-3xl">
          {fixture.homeGoals} x {fixture.awayGoals}
        </span>
      </div>
    );
  }

  return (
    <div className="flex min-w-[4.5rem] flex-col items-center rounded-2xl bg-muted px-3 py-2.5 text-center sm:min-w-20">
      <span className="text-sm font-extrabold uppercase tracking-wide text-foreground">
        VS
      </span>
      <span className="mt-1 text-sm font-bold leading-none text-muted-foreground tabular-nums">
        {time}
      </span>
    </div>
  );
}

export function MatchCard({ fixture, onPredict }: MatchCardProps) {
  const kickoff = new Date(fixture.kickoff);
  const predictionClosed =
    kickoff.getTime() <= Date.now() ||
    fixture.status === "LIVE" ||
    fixture.status === "FT";
  const hasPrediction = Boolean(fixture.userPrediction);
  const isFinished = fixture.status === "FT";
  const isLive = fixture.status === "LIVE";
  const date = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(kickoff);
  const time = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(kickoff);

  return (
    <article
      className={cn(
        "rounded-2xl border bg-card p-4 shadow-sm shadow-primary/5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10 sm:p-5",
        hasPrediction && "border-border",
        isLive && "border-accent/40",
        isFinished && "border-border bg-muted/35",
      )}
    >
      <MatchHeader fixture={fixture} />

      <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 sm:gap-4">
        <TeamBadge team={fixture.homeTeam} label="Casa" />
        <MatchCenter fixture={fixture} time={time} />
        <TeamBadge team={fixture.awayTeam} align="right" label="Fora" />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4 text-sm font-semibold text-muted-foreground">
        <span className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-background px-3">
          <CalendarDays className="size-4" aria-hidden />
          {date}
        </span>
        <span className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-background px-3">
          <Clock3 className="size-4" aria-hidden />
          {isFinished ? "Encerrada" : isLive ? "Em andamento" : time}
        </span>
      </div>

      {fixture.userPrediction ? (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-muted/50 px-4 py-3 ring-1 ring-border">
          <span className="inline-flex items-center gap-2 text-sm font-bold text-foreground">
            <CheckCircle2 className="size-4 text-accent" aria-hidden />
            Palpite registrado
          </span>
          <span className="text-2xl font-extrabold leading-none text-foreground tabular-nums">
            {fixture.userPrediction.homeGoals} x{" "}
            {fixture.userPrediction.awayGoals}
          </span>
        </div>
      ) : null}

      <div className="mt-4 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          {predictionClosed ? (
            <p className="text-sm font-semibold text-muted-foreground">
              Palpites encerrados
            </p>
          ) : hasPrediction ? (
            <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
              <Pencil className="size-4" aria-hidden />
              Editável até o início
            </p>
          ) : (
            <p className="text-sm font-semibold text-muted-foreground">
              Aberta para palpite
            </p>
          )}
        </div>
        <div className="shrink-0">
          <PredictionButton fixture={fixture} onClick={() => onPredict(fixture)} />
        </div>
      </div>
    </article>
  );
}
