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
      <div className="mt-2 flex min-w-[6.75rem] flex-col items-center rounded-2xl bg-primary px-3 py-3 text-primary-foreground shadow-sm shadow-primary/10 sm:min-w-32">
        <span className="text-[0.75rem] font-bold uppercase tracking-wide opacity-80">
          {isLive ? "Placar atual" : "Resultado final"}
        </span>
        <span className="mt-1 text-3xl font-extrabold leading-none tabular-nums sm:text-4xl">
          {fixture.homeGoals} x {fixture.awayGoals}
        </span>
      </div>
    );
  }

  return (
    <div className="mt-2 flex min-w-[5.75rem] flex-col items-center rounded-2xl bg-muted px-3 py-3 text-center sm:min-w-28">
      <span className="text-2xl font-extrabold leading-none text-foreground tabular-nums sm:text-3xl">
        {time}
      </span>
      <span className="mt-2 rounded-full bg-background px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
        VS
      </span>
    </div>
  );
}

export function MatchCard({ fixture, onPredict }: MatchCardProps) {
  const kickoff = new Date(fixture.kickoff);
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
        "rounded-2xl border bg-card p-5 shadow-sm shadow-primary/5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10 sm:p-6",
        hasPrediction && "border-accent/30 bg-accent/5",
        isLive && "border-accent/40",
        isFinished && "border-border bg-muted/40",
      )}
    >
      <MatchHeader fixture={fixture} />

      <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-3 sm:gap-4">
        <TeamBadge team={fixture.homeTeam} />
        <MatchCenter fixture={fixture} time={time} />
        <TeamBadge team={fixture.awayTeam} align="right" />
      </div>

      <div className="mt-5 grid gap-3 border-t border-border pt-4 text-sm font-semibold text-muted-foreground sm:grid-cols-2">
        <span className="flex min-h-10 items-center gap-2 rounded-xl bg-background px-3">
          <CalendarDays className="size-5" aria-hidden />
          {date}
        </span>
        <span className="flex min-h-10 items-center gap-2 rounded-xl bg-background px-3 sm:justify-end">
          <Clock3 className="size-5" aria-hidden />
          {isFinished ? "Encerrada" : isLive ? "Em andamento" : time}
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
          <p className="mt-1 text-3xl font-extrabold leading-none text-accent tabular-nums">
            {fixture.userPrediction.homeGoals} x{" "}
            {fixture.userPrediction.awayGoals}
          </p>
        </div>
      ) : null}

      <div className="mt-5">
        <PredictionButton fixture={fixture} onClick={() => onPredict(fixture)} />
      </div>
    </article>
  );
}
