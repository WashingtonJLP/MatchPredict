import { CalendarDays, Clock3, Pencil, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MatchStatusBadge } from "@/features/matches/components/match-status-badge";
import { TeamLogo } from "@/features/matches/components/team-logo";
import type { MatchFixture } from "@/types/fixture";

type PredictionFixtureCardProps = {
  fixture: MatchFixture;
  onPredict: (fixture: MatchFixture) => void;
};

export function PredictionFixtureCard({
  fixture,
  onPredict,
}: PredictionFixtureCardProps) {
  const kickoff = new Date(fixture.kickoff);
  const date = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(kickoff);
  const time = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(kickoff);
  const prediction = fixture.userPrediction;
  const canEdit = kickoff.getTime() > Date.now();
  const canCreate = !prediction && fixture.canPredict;
  const actionLabel = prediction ? "Editar meu palpite" : "Fazer Palpite";
  const competition = fixture.league ?? fixture.competition ?? "Premier League";

  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-sm shadow-primary/5 transition duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg hover:shadow-primary/10 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
            <Trophy className="size-4" aria-hidden />
            {competition}
          </p>
          <p className="mt-1 text-base font-semibold text-foreground">
            Rodada {fixture.round}
          </p>
        </div>
        <MatchStatusBadge status={fixture.status} />
      </div>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
        <TeamSummary name={fixture.homeTeam.name} logo={fixture.homeTeam.logo} />
        <span className="rounded-xl bg-muted px-3 py-2 text-sm font-extrabold text-muted-foreground">
          VS
        </span>
        <TeamSummary name={fixture.awayTeam.name} logo={fixture.awayTeam.logo} />
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

      {prediction ? (
        <div className="mt-5 rounded-2xl border border-accent/20 bg-accent/10 p-4">
          <span className="inline-flex min-h-8 items-center rounded-full bg-accent/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent">
            Palpite registrado
          </span>
          <p className="mt-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Seu palpite
          </p>
          <p className="mt-1 text-3xl font-extrabold leading-none text-accent">
            {prediction.homeGoals} x {prediction.awayGoals}
          </p>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-border bg-muted/50 p-4">
          <span className="inline-flex min-h-8 items-center rounded-full bg-background px-3 py-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Pendente
          </span>
          <p className="mt-3 text-base font-semibold leading-7 text-muted-foreground">
            Voce ainda nao registrou um palpite para esta partida.
          </p>
        </div>
      )}

      <Button
        type="button"
        variant={prediction ? "outline" : "default"}
        disabled={prediction ? !canEdit : !canCreate}
        className={
          prediction
            ? "mt-5 h-12 w-full rounded-xl border-accent/60 bg-accent/10 text-base font-bold text-accent hover:bg-accent hover:text-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            : "mt-5 h-12 w-full rounded-xl text-base font-bold"
        }
        onClick={() => onPredict(fixture)}
      >
        {prediction && canEdit ? <Pencil className="size-5" aria-hidden /> : null}
        {prediction && !canEdit ? "Alteracao encerrada" : actionLabel}
      </Button>
    </article>
  );
}

type TeamSummaryProps = {
  name: string;
  logo: string;
};

function TeamSummary({ name, logo }: TeamSummaryProps) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2 text-center">
      <TeamLogo team={{ name, logo }} />
      <span className="line-clamp-2 min-h-10 break-words text-base font-extrabold leading-5 text-foreground">
        {name}
      </span>
    </div>
  );
}
