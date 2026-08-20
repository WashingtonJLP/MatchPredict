"use client";

import {
  BarChart3,
  CheckCircle2,
  CircleX,
  Gauge,
  Hash,
  Trophy,
} from "lucide-react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingCard } from "@/components/shared/loading-card";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { useMyStatistics } from "@/hooks/use-user";

export default function StatisticsPage() {
  const statisticsQuery = useMyStatistics();
  const statistics = statisticsQuery.data;
  const hasPositivePoints = Boolean(statistics && statistics.totalPoints > 0);

  return (
    <DashboardShell>
      <div className="space-y-9">
        <PageHeader
          title="Estatísticas"
          description="Resumo individual com pontos, acertos, melhor rodada e desempenho geral."
        />

        {statisticsQuery.isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <LoadingCard key={index} rows={2} />
            ))}
          </div>
        ) : statisticsQuery.isError ? (
          <ErrorState
            icon={BarChart3}
            title="Estatísticas indisponíveis"
            description="Não foi possível carregar suas estatísticas agora."
          />
        ) : statistics ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Hash}
              title="Total de palpites"
              value={`${statistics.totalPredictions}`}
            />
            <StatCard
              icon={Trophy}
              title="Total de pontos"
              value={formatPoints(statistics.totalPoints)}
            />
            <StatCard
              icon={Gauge}
              title="Pontuação média"
              value={formatPoints(statistics.averagePoints)}
            />
            <StatCard
              icon={CheckCircle2}
              title="Acertos de vencedor"
              value={`${statistics.correctWinners}`}
            />
            <StatCard
              icon={CheckCircle2}
              title="Placares exatos"
              value={`${statistics.exactScores}`}
            />
            <StatCard
              icon={Trophy}
              title="Posição atual"
              value={
                statistics.currentPosition
                  ? `#${statistics.currentPosition}`
                  : "Sem classificação"
              }
            />
            <StatCard
              icon={BarChart3}
              title="Melhor rodada"
              value={formatRoundPoints(statistics.bestRound, hasPositivePoints)}
              description={
                hasPositivePoints ? undefined : "Ainda não possui pontuação."
              }
            />
            <StatCard
              icon={CircleX}
              title="Pior rodada"
              value={formatRoundPoints(statistics.worstRound, hasPositivePoints)}
              description={
                hasPositivePoints ? undefined : "Ainda não possui pontuação."
              }
            />
          </div>
        ) : (
          <EmptyState
            icon={BarChart3}
            title="Sem estatísticas"
            description="Suas estatísticas aparecerão quando houver palpites processados."
          />
        )}
      </div>
    </DashboardShell>
  );
}

type RoundPoints = {
  points: number;
  round: number;
};

function formatPoints(points: number) {
  return `${formatNumber(points)} pts`;
}

function formatRoundPoints(
  roundPoints: RoundPoints | null,
  hasPositivePoints: boolean,
) {
  if (!roundPoints || !hasPositivePoints) {
    return "Sem pontuação";
  }

  return `R${roundPoints.round} - ${formatPoints(roundPoints.points)}`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
  }).format(value);
}
