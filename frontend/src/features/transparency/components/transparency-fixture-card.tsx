import { DailyGameStatus } from "@/features/daily-games/components/daily-game-status";
import { TeamLogo } from "@/features/matches/components/team-logo";
import {
  getTransparencyFixtureStatusLabel,
  getTransparencyStatusLabel,
  getTransparencyVisualGame,
  hasCompleteDailyGameScore,
} from "@/features/transparency/transparency-live-game";
import { cn } from "@/lib/utils";
import type { DailyGame } from "@/types/daily-game";
import type { FixtureStatusValue, MatchFixture } from "@/types/fixture";

type TransparencyFixtureCardProps = {
  dailyGame?: DailyGame;
  fixture: MatchFixture;
  onSelect: () => void;
  selected: boolean;
};

export function TransparencyFixtureCard({
  dailyGame,
  fixture,
  onSelect,
  selected,
}: TransparencyFixtureCardProps) {
  const visualDailyGame = getTransparencyVisualGame(dailyGame);

  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "group w-full min-w-0 rounded-2xl border border-border bg-card p-3 text-left shadow-sm shadow-primary/5 transition duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md hover:shadow-primary/10 focus-visible:ring-3 focus-visible:ring-ring/50",
        selected &&
          "border-accent/60 bg-accent/[0.04] ring-2 ring-accent/15 shadow-md shadow-primary/10",
      )}
      onClick={onSelect}
    >
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-accent">
          Rodada {fixture.round}
        </p>
        <p className="mt-1 text-sm font-semibold leading-5 text-muted-foreground">
          {formatCardDateTime(fixture.kickoff)}
        </p>
      </div>

      <div className="mt-3 grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5 rounded-xl bg-muted/35 px-1 py-2.5 sm:gap-2 sm:px-2">
        <FixtureTeamSummary
          logo={fixture.homeTeam.logo}
          name={fixture.homeTeam.name}
        />
        <CompactMatchVisualState
          dailyGame={visualDailyGame}
          fixtureStatus={fixture.status}
        />
        <FixtureTeamSummary
          logo={fixture.awayTeam.logo}
          name={fixture.awayTeam.name}
        />
      </div>
    </button>
  );
}

function FixtureTeamSummary({ logo, name }: { logo: string; name: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5 text-center">
      <TeamLogo team={{ logo, name }} size="sm" />
      <span
        className="line-clamp-2 min-h-8 min-w-0 break-words text-xs font-semibold leading-4 text-foreground sm:text-sm"
        title={name}
      >
        {name}
      </span>
    </div>
  );
}

function CompactMatchVisualState({
  dailyGame,
  fixtureStatus,
}: {
  dailyGame?: DailyGame;
  fixtureStatus: FixtureStatusValue;
}) {
  const hasScore = hasCompleteDailyGameScore(dailyGame);

  return (
    <div
      className="flex min-w-0 flex-col items-center justify-center gap-1.5 text-center"
      aria-atomic="true"
      aria-live="polite"
    >
      {hasScore ? (
        <div
          className={cn(
            "flex items-baseline justify-center gap-1 rounded-lg bg-primary px-2 py-1.5 text-primary-foreground shadow-sm shadow-primary/15 tabular-nums",
            dailyGame.status === "LIVE" &&
              "bg-accent text-accent-foreground shadow-accent/20",
          )}
          aria-label={`Placar: ${dailyGame.score.home} a ${dailyGame.score.away}`}
        >
          <span className="min-w-3 text-center text-lg font-extrabold leading-none">
            {dailyGame.score.home}
          </span>
          <span className="text-xs font-bold opacity-65" aria-hidden>
            ×
          </span>
          <span className="min-w-3 text-center text-lg font-extrabold leading-none">
            {dailyGame.score.away}
          </span>
        </div>
      ) : (
        <span className="rounded-lg bg-background px-2.5 py-1.5 text-xs font-extrabold text-muted-foreground shadow-sm">
          VS
        </span>
      )}

      {dailyGame ? (
        <DailyGameStatus
          compact
          label={getTransparencyStatusLabel(dailyGame)}
          minute={dailyGame.minute}
          status={dailyGame.status}
        />
      ) : (
        <span className="inline-flex min-h-6 items-center rounded-full border border-border bg-muted px-1.5 py-0.5 text-xs font-bold uppercase leading-none tracking-normal text-muted-foreground">
          {getTransparencyFixtureStatusLabel(fixtureStatus)}
        </span>
      )}
    </div>
  );
}

function formatCardDateTime(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(date);
}
