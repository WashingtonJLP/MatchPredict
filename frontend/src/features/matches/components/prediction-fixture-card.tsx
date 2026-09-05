import { CalendarDays, CheckCircle2, Clock3, Trophy } from "lucide-react";

import { MatchStatusBadge } from "@/features/matches/components/match-status-badge";
import { MatchLiveContextLabel } from "@/features/matches/components/match-live-context-label";
import { PredictionButton } from "@/features/matches/components/prediction-button";
import { TeamBadge } from "@/features/matches/components/team-badge";
import { cn } from "@/lib/utils";
import type { DailyGame } from "@/types/daily-game";
import type { MatchFixture } from "@/types/fixture";

type PredictionFixtureCardProps = {
  fixture: MatchFixture;
  dailyGame?: DailyGame;
  onPredict: (fixture: MatchFixture) => void;
  showFinalResult?: boolean;
};

export function PredictionFixtureCard({
  dailyGame,
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
  const canEdit =
    kickoff.getTime() > Date.now() &&
    fixture.status !== "LIVE" &&
    fixture.status !== "FT";
  const canCreate = !prediction && fixture.canPredict;
  const competition = fixture.league ?? fixture.competition ?? "Premier League";

  return (
    <article
      className={cn(
        "rounded-2xl border bg-card p-4 shadow-sm shadow-primary/5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10 sm:p-5",
        prediction && "border-border",
        fixture.status === "LIVE" && "border-accent/40",
        fixture.status === "FT" && "bg-muted/35",
      )}
    >
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

      <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 sm:gap-4">
        <TeamBadge team={fixture.homeTeam} label="Casa" />
        <ScoreCenter dailyGame={dailyGame} fixture={fixture} time={time} />
        <TeamBadge team={fixture.awayTeam} align="right" label="Fora" />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4 text-sm font-semibold text-muted-foreground">
        <span className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-background px-3">
          <CalendarDays className="size-4" aria-hidden />
          {date}
        </span>
        <span className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-background px-3">
          <Clock3 className="size-4" aria-hidden />
          {fixture.status === "FT"
            ? "Encerrada"
            : fixture.status === "LIVE"
              ? "Em andamento"
              : time}
        </span>
      </div>

      {prediction ? (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-muted/50 px-4 py-3 ring-1 ring-border">
          <span className="inline-flex items-center gap-2 text-sm font-bold text-foreground">
            <CheckCircle2 className="size-4 text-accent" aria-hidden />
            Palpite registrado
          </span>
          <span className="text-2xl font-extrabold leading-none text-foreground tabular-nums">
            {prediction.homeGoals} x {prediction.awayGoals}
          </span>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl bg-muted/40 px-4 py-3 text-sm font-semibold text-muted-foreground ring-1 ring-border">
          Você ainda não registrou um palpite para esta partida.
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <p className="min-w-0 flex-1 text-sm font-semibold text-muted-foreground">
          {prediction
            ? canEdit
              ? "Editável até o início"
              : "Alteração encerrada"
            : canCreate
              ? "Aberta para palpite"
              : "Indisponível"}
        </p>
        <PredictionButton fixture={fixture} onClick={() => onPredict(fixture)} />
      </div>
    </article>
  );
}

type ScoreCenterProps = {
  fixture: MatchFixture;
  dailyGame?: DailyGame;
  time: string;
};

function ScoreCenter({ dailyGame, fixture, time }: ScoreCenterProps) {
  const hasScore = fixture.homeGoals !== null && fixture.awayGoals !== null;
  const isLive = fixture.status === "LIVE";
  const isFinished = fixture.status === "FT";

  if ((isLive || isFinished) && hasScore) {
    return (
      <div
        className={cn(
          "flex w-[5.75rem] flex-col items-center rounded-2xl px-1.5 py-2.5 shadow-sm sm:w-28 sm:px-3",
          isLive
            ? "bg-accent text-accent-foreground shadow-accent/20"
            : "bg-primary text-primary-foreground shadow-primary/15",
        )}
      >
        <MatchLiveContextLabel
          dailyGame={dailyGame}
          fallbackLabel={isLive ? "Ao vivo" : "Final"}
        />
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
