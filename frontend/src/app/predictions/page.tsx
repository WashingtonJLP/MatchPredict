"use client";

import { ClipboardList } from "lucide-react";
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
                  <label className="min-w-0 sm:w-48">
                    <span className="sr-only">Selecionar rodada</span>
                    <select
                      value={currentHistoryRound ?? ""}
                      onChange={(event) =>
                        setSelectedHistoryRound(Number(event.target.value))
                      }
                      className="h-12 w-full rounded-xl border border-input bg-background px-4 text-base font-bold text-foreground outline-none transition hover:border-border focus:border-ring focus:ring-4 focus:ring-ring/15"
                    >
                      {historyRounds.map((round) => (
                        <option key={round} value={round}>
                          Rodada {round}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>

              {historyFixtures.length ? (
                <PredictionGrid
                  fixtures={selectedHistoryFixtures}
                  liveGamesBySourceEventId={liveGamesBySourceEventId}
                  onPredict={setSelectedFixture}
                  showFinalResult
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

type PredictionGridProps = {
  fixtures: MatchFixture[];
  liveGamesBySourceEventId: Map<string, DailyGame>;
  onPredict: (fixture: MatchFixture) => void;
  showFinalResult?: boolean;
};

function PredictionGrid({
  fixtures,
  liveGamesBySourceEventId,
  onPredict,
  showFinalResult = false,
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
          onPredict={onPredict}
          showFinalResult={showFinalResult}
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
