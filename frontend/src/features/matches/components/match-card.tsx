import { CalendarDays, Clock3 } from "lucide-react";

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
  const kickoffPassed = kickoff.getTime() <= Date.now();
  const hasPrediction = Boolean(fixture.userPrediction);
  const isFinished = fixture.status === "FT";
  const isOpen = fixture.canPredict && !hasPrediction && !kickoffPassed;
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
        isOpen && "border-accent/50 ring-1 ring-accent/10",
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
        <div className="mt-5 rounded-2xl border border-accent/20 bg-accent/10 px-4 py-3 text-base font-bold text-accent">
          Seu palpite: {fixture.userPrediction.homeGoals} x{" "}
          {fixture.userPrediction.awayGoals}
        </div>
      ) : null}

      {kickoffPassed ? (
        <div className="mt-5 inline-flex min-h-8 items-center rounded-full bg-muted px-3 py-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Palpites encerrados
        </div>
      ) : isOpen ? (
        <div className="mt-5 inline-flex min-h-8 items-center rounded-full bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent">
          Aberta para palpite
        </div>
      ) : null}

      <div className="mt-5">
        <PredictionButton fixture={fixture} onClick={() => onPredict(fixture)} />
      </div>
    </article>
  );
}
