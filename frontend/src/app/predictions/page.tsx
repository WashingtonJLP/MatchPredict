"use client";

import { ClipboardList } from "lucide-react";
import { useState } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingCard } from "@/components/shared/loading-card";
import { PageHeader } from "@/components/shared/page-header";
import { PredictionFixtureCard } from "@/features/matches/components/prediction-fixture-card";
import { PredictionModal } from "@/features/matches/components/prediction-modal";
import { useMyPredictions } from "@/hooks/use-predictions";
import type { MatchFixture } from "@/types/fixture";
import type { Prediction } from "@/types/prediction";

export default function PredictionsPage() {
  const predictionsQuery = useMyPredictions();
  const [selectedFixture, setSelectedFixture] = useState<MatchFixture | null>(
    null,
  );

  return (
    <DashboardShell>
      <div className="space-y-9">
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
        ) : !predictionsQuery.data?.length ? (
          <EmptyState
            icon={ClipboardList}
            title="Nenhum palpite encontrado"
            description="Seus palpites aparecerão aqui quando forem cadastrados."
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {predictionsQuery.data.map((prediction) => (
              <PredictionFixtureCard
                key={prediction.id}
                fixture={toMatchFixture(prediction)}
                onPredict={setSelectedFixture}
                showFinalResult
              />
            ))}
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
