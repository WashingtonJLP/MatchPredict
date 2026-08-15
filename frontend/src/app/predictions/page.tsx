"use client";

import { ClipboardList } from "lucide-react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingCard } from "@/components/shared/loading-card";
import { PageHeader } from "@/components/shared/page-header";
import { useMyPredictions } from "@/hooks/use-predictions";
import type { Prediction } from "@/types/prediction";

const statusLabels: Record<Prediction["fixture"]["status"], string> = {
  NS: "Nao iniciada",
  LIVE: "Ao vivo",
  FT: "Finalizada",
  POSTPONED: "Adiada",
  CANCELLED: "Cancelada",
};

export default function PredictionsPage() {
  const predictionsQuery = useMyPredictions();

  return (
    <DashboardShell>
      <div className="space-y-8">
        <PageHeader
          title="Meus Palpites"
          description="Acompanhe seus palpites, resultados das partidas e pontuacao registrada."
        />

        {predictionsQuery.isLoading ? (
          <LoadingCard rows={7} />
        ) : predictionsQuery.isError ? (
          <ErrorState
            icon={ClipboardList}
            title="Palpites indisponiveis"
            description="Nao foi possivel carregar seus palpites agora."
          />
        ) : !predictionsQuery.data?.length ? (
          <EmptyState
            icon={ClipboardList}
            title="Nenhum palpite encontrado"
            description="Seus palpites aparecerao aqui quando forem cadastrados."
          />
        ) : (
          <DataTable<Prediction>
            data={predictionsQuery.data}
            getRowKey={(item) => item.id}
            columns={[
              {
                key: "match",
                header: "Partida",
                render: (item) => (
                  <div>
                    <p className="font-semibold text-foreground">
                      {item.fixture.homeTeam.name} x {item.fixture.awayTeam.name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Rodada {item.fixture.round}
                    </p>
                  </div>
                ),
              },
              {
                key: "prediction",
                header: "Palpite",
                render: (item) => (
                  <span className="font-semibold text-foreground">
                    {item.homeGoals} x {item.awayGoals}
                  </span>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (item) => statusLabels[item.fixture.status],
              },
              {
                key: "result",
                header: "Resultado",
                render: (item) =>
                  item.fixture.homeGoals === null ||
                  item.fixture.awayGoals === null
                    ? "-"
                    : `${item.fixture.homeGoals} x ${item.fixture.awayGoals}`,
              },
              {
                key: "points",
                header: "Pontuacao",
                render: (item) => (
                  <span className="font-semibold text-accent">
                    {item.totalPoints} pts
                  </span>
                ),
              },
            ]}
          />
        )}
      </div>
    </DashboardShell>
  );
}
