import { CalendarDays, Clock3, Trophy } from "lucide-react";

import { FixtureStatus } from "@/features/matches/components/fixture-status";
import { PredictionButton } from "@/features/matches/components/prediction-button";
import { TeamBadge } from "@/features/matches/components/team-badge";
import type { MatchFixture } from "@/types/fixture";

type MatchCardProps = {
  fixture: MatchFixture;
  onPredict: (fixture: MatchFixture) => void;
};

export function MatchCard({ fixture, onPredict }: MatchCardProps) {
  const kickoff = new Date(fixture.kickoff);
  const date = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(kickoff);
  const time = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(kickoff);

  return (
    <article className="rounded-3xl border border-border bg-card p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Trophy className="size-4" aria-hidden />
            Premier League
          </p>
          <p className="text-sm font-medium text-muted-foreground">
            Rodada {fixture.round}
          </p>
        </div>
        <FixtureStatus status={fixture.status} />
      </div>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 sm:gap-4">
        <TeamBadge team={fixture.homeTeam} />
        <span className="rounded-xl bg-muted px-3 py-2 text-sm font-bold text-muted-foreground">
          VS
        </span>
        <TeamBadge team={fixture.awayTeam} align="right" />
      </div>

      <div className="mt-6 grid gap-3 border-t border-border pt-5 text-sm text-muted-foreground sm:grid-cols-2">
        <span className="flex items-center gap-2">
          <CalendarDays className="size-4" aria-hidden />
          {date}
        </span>
        <span className="flex items-center gap-2 sm:justify-end">
          <Clock3 className="size-4" aria-hidden />
          {time}
        </span>
      </div>

      {fixture.userPrediction ? (
        <div className="mt-5 rounded-2xl bg-accent/10 px-4 py-3 text-sm font-semibold text-accent">
          Seu palpite: {fixture.userPrediction.homeGoals} x{" "}
          {fixture.userPrediction.awayGoals}
        </div>
      ) : null}

      <div className="mt-5">
        <PredictionButton fixture={fixture} onClick={() => onPredict(fixture)} />
      </div>
    </article>
  );
}
