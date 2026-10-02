"use client";

import { Select } from "@base-ui/react/select";
import {
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  History,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingCard } from "@/components/shared/loading-card";
import { PageHeader } from "@/components/shared/page-header";
import { PredictionFixtureCard } from "@/features/matches/components/prediction-fixture-card";
import { PredictionModal } from "@/features/matches/components/prediction-modal";
import { getDailyGameForFixture } from "@/features/transparency/transparency-live-game";
import { usePremierLeagueLiveGames } from "@/hooks/use-premier-league-live-games";
import { useMyPredictions } from "@/hooks/use-predictions";
import type { DailyGame } from "@/types/daily-game";
import type { MatchFixture } from "@/types/fixture";
import type { Prediction } from "@/types/prediction";

export default function PredictionsPage() {
  const predictionsQuery = useMyPredictions();
  const [selectedFixture, setSelectedFixture] = useState<MatchFixture | null>(
    null,
  );
  const [selectedHistoryRound, setSelectedHistoryRound] = useState<number | null>(
    null,
  );
  const predictionFixtures = useMemo(
    () => predictionsQuery.data?.map(toMatchFixture) ?? [],
    [predictionsQuery.data],
  );
  const activeFixtures = useMemo(
    () =>
      [...predictionFixtures]
        .filter(isFixtureEditable)
        .sort(compareFixturesByKickoffAsc),
    [predictionFixtures],
  );
  const historyFixtures = useMemo(
    () =>
      [...predictionFixtures]
        .filter((fixture) => !isFixtureEditable(fixture))
        .sort(compareHistoryFixtures),
    [predictionFixtures],
  );
  const historyRounds = useMemo(
    () =>
      Array.from(new Set(historyFixtures.map((fixture) => fixture.round))).sort(
        (firstRound, secondRound) => secondRound - firstRound,
      ),
    [historyFixtures],
  );
  const currentHistoryRound =
    selectedHistoryRound !== null && historyRounds.includes(selectedHistoryRound)
      ? selectedHistoryRound
      : (historyRounds[0] ?? null);
  const selectedHistoryFixtures = useMemo(
    () =>
      historyFixtures.filter(
        (fixture) => fixture.round === currentHistoryRound,
      ),
    [currentHistoryRound, historyFixtures],
  );
  const visibleFixtures = useMemo(
    () => [...activeFixtures, ...selectedHistoryFixtures],
    [activeFixtures, selectedHistoryFixtures],
  );
  const liveGamesBySourceEventId =
    usePremierLeagueLiveGames(visibleFixtures);

  useEffect(() => {
    if (!historyRounds.length) {
      setSelectedHistoryRound(null);
      return;
    }

    if (
      selectedHistoryRound === null ||
      !historyRounds.includes(selectedHistoryRound)
    ) {
      setSelectedHistoryRound(historyRounds[0]);
    }
  }, [historyRounds, selectedHistoryRound]);

  return (
    <DashboardShell>
      <div className="space-y-6 sm:space-y-8">
        <PageHeader
          title="Meus Palpites"
          description="Acompanhe seus palpites, resultados das partidas e pontuação registrada."
        />

        {predictionsQuery.isLoading ? (
          <LoadingCard rows={7} />
        ) : predictionsQuery.isError ? (
          <ErrorState
            icon={ClipboardList}
            title="Palpites indisponíveis"
            description="Não foi possível carregar seus palpites agora."
          />
        ) : !predictionFixtures.length ? (
          <EmptyState
            icon={ClipboardList}
            title="Nenhum palpite encontrado"
            description="Seus palpites aparecerão aqui quando forem cadastrados."
          />
        ) : (
          <div className="space-y-8">
            {activeFixtures.length ? (
              <section className="space-y-4">
                <div className="rounded-2xl border border-border bg-card px-4 py-4 shadow-sm shadow-primary/5 sm:px-5">
                  <h2 className="text-2xl font-extrabold text-foreground">
                    Seus palpites ativos
                  </h2>
                  <p className="mt-1 text-sm font-medium leading-6 text-muted-foreground">
                    Palpites que ainda podem ser alterados antes do início da
                    partida.
                  </p>
                </div>

                <PredictionGrid
                  fixtures={activeFixtures}
                  liveGamesBySourceEventId={liveGamesBySourceEventId}
                  onPredict={setSelectedFixture}
                />
              </section>
            ) : null}

            <section className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0 rounded-2xl border border-border bg-card px-4 py-4 shadow-sm shadow-primary/5 sm:flex-1 sm:px-5">
                  <h2 className="text-2xl font-extrabold text-foreground">
                    Histórico de palpites
                  </h2>
                  <p className="mt-1 text-sm font-medium leading-6 text-muted-foreground">
                    Palpites cujo período de alteração já terminou.
                  </p>
                </div>

                {historyRounds.length ? (
                  <HistoryRoundSelect
                    rounds={historyRounds}
                    value={currentHistoryRound ?? historyRounds[0]}
                    onValueChange={setSelectedHistoryRound}
                  />
                ) : null}
              </div>

              {historyFixtures.length ? (
                <PredictionGrid
                  fixtures={selectedHistoryFixtures}
                  liveGamesBySourceEventId={liveGamesBySourceEventId}
                  onPredict={setSelectedFixture}
                  showFinalResult
                  showPoints
                />
              ) : (
                <div className="rounded-2xl border border-border bg-card p-5 text-base font-semibold leading-7 text-muted-foreground shadow-sm shadow-primary/5 sm:p-6">
                  Seus palpites encerrados aparecerão aqui.
                </div>
              )}
            </section>
          </div>
        )}

        <PredictionModal
          fixture={selectedFixture}
          onClose={() => setSelectedFixture(null)}
        />
      </div>
    </DashboardShell>
  );
}

type HistoryRoundSelectProps = {
  rounds: number[];
  value: number;
  onValueChange: (round: number) => void;
};

function HistoryRoundSelect({
  rounds,
  value,
  onValueChange,
}: HistoryRoundSelectProps) {
  return (
    <div className="min-w-0 sm:w-72 sm:shrink-0">
      <Select.Root
        value={value}
        onValueChange={(selectedRound) => {
          if (selectedRound !== null) {
            onValueChange(selectedRound);
          }
        }}
      >
        <Select.Label className="sr-only">Selecionar rodada</Select.Label>
        <Select.Trigger className="grid min-h-16 w-full min-w-0 grid-cols-[2.5rem_minmax(0,1fr)_2rem] items-center gap-3 rounded-2xl border border-input bg-card px-3 py-2.5 text-left text-foreground shadow-sm shadow-primary/5 transition-[border-color,background-color,box-shadow] hover:border-primary/25 hover:bg-muted/30 focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/15 data-popup-open:border-ring data-popup-open:bg-muted/30">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/15">
            <History className="size-5" aria-hidden />
          </span>
          <span className="min-w-0 overflow-hidden">
            <span className="block whitespace-nowrap text-[0.6875rem] font-extrabold uppercase leading-4 tracking-[0.08em] text-muted-foreground">
              Rodada do histórico
            </span>
            <Select.Value>
              {(selectedRound: number) => (
                <span className="mt-0.5 block truncate font-navigation text-base font-extrabold leading-5 tabular-nums">
                  Rodada {selectedRound}
                </span>
              )}
            </Select.Value>
          </span>
          <Select.Icon className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-transform duration-200 data-popup-open:rotate-180">
            <ChevronDown className="size-4" aria-hidden />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Positioner
            align="start"
            alignItemWithTrigger={false}
            collisionAvoidance={{
              side: "none",
              align: "shift",
              fallbackAxisSide: "none",
            }}
            collisionPadding={12}
            side="bottom"
            sideOffset={8}
            className="z-50 w-[var(--anchor-width)] max-w-[calc(100vw-1.5rem)] outline-none"
          >
            <Select.Popup className="max-h-[var(--available-height)] origin-[var(--transform-origin)] overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-xl shadow-primary/15 transition-[transform,opacity] duration-150 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0">
              <Select.ScrollUpArrow className="flex h-7 items-center justify-center border-b border-border bg-popover text-muted-foreground">
                <ChevronUp className="size-4" aria-hidden />
              </Select.ScrollUpArrow>
              <Select.List className="max-h-[calc(min(var(--available-height),20rem)-3.5rem)] overflow-y-auto overscroll-contain p-1.5 scroll-py-2">
                {rounds.map((round) => (
                  <Select.Item
                    key={round}
                    value={round}
                    label={`Rodada ${round}`}
                    className="grid min-h-12 cursor-default grid-cols-[2rem_minmax(0,1fr)_1.25rem] items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-semibold text-popover-foreground outline-none transition-colors data-highlighted:bg-muted data-selected:bg-accent/10 data-selected:font-extrabold"
                  >
                    <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-xs font-extrabold text-muted-foreground tabular-nums">
                      {round}
                    </span>
                    <Select.ItemText className="min-w-0 truncate">
                      Rodada {round}
                    </Select.ItemText>
                    <Select.ItemIndicator className="flex size-5 items-center justify-center rounded-full bg-accent text-accent-foreground">
                      <Check className="size-3.5" aria-hidden />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.List>
              <Select.ScrollDownArrow className="flex h-7 items-center justify-center border-t border-border bg-popover text-muted-foreground">
                <ChevronDown className="size-4" aria-hidden />
              </Select.ScrollDownArrow>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}

type PredictionGridProps = {
  fixtures: MatchFixture[];
  liveGamesBySourceEventId: Map<string, DailyGame>;
  onPredict: (fixture: MatchFixture) => void;
  showFinalResult?: boolean;
  showPoints?: boolean;
};

function PredictionGrid({
  fixtures,
  liveGamesBySourceEventId,
  onPredict,
  showFinalResult = false,
  showPoints = false,
}: PredictionGridProps) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {fixtures.map((fixture) => (
        <PredictionFixtureCard
          key={fixture.userPrediction?.id ?? fixture.id}
          dailyGame={getDailyGameForFixture(
            liveGamesBySourceEventId,
            fixture,
          )}
          fixture={fixture}
          inlineTeamsOnMobile
          onPredict={onPredict}
          showFinalResult={showFinalResult}
          showPoints={showPoints}
        />
      ))}
    </div>
  );
}

function isFixtureEditable(fixture: MatchFixture) {
  const kickoff = new Date(fixture.kickoff);

  return (
    kickoff.getTime() > Date.now() &&
    fixture.status !== "LIVE" &&
    fixture.status !== "FT"
  );
}

function compareFixturesByKickoffAsc(
  firstFixture: MatchFixture,
  secondFixture: MatchFixture,
) {
  return (
    new Date(firstFixture.kickoff).getTime() -
    new Date(secondFixture.kickoff).getTime()
  );
}

function compareHistoryFixtures(
  firstFixture: MatchFixture,
  secondFixture: MatchFixture,
) {
  return (
    secondFixture.round - firstFixture.round ||
    new Date(secondFixture.kickoff).getTime() -
      new Date(firstFixture.kickoff).getTime()
  );
}

function toMatchFixture(prediction: Prediction): MatchFixture {
  const kickoff = new Date(prediction.fixture.kickoff);

  return {
    ...prediction.fixture,
    canPredict:
      kickoff.getTime() > Date.now() &&
      prediction.fixture.status !== "LIVE" &&
      prediction.fixture.status !== "FT",
    competition: "Premier League",
    league: "Premier League",
    userPrediction: {
      id: prediction.id,
      homeGoals: prediction.homeGoals,
      awayGoals: prediction.awayGoals,
      totalPoints: prediction.totalPoints,
    },
    winnerType: null,
  };
}
