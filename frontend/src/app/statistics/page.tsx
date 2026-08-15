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

  return (
    <DashboardShell>
      <div className="space-y-9">
        <PageHeader
          title="Estatisticas"
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
            title="Estatisticas indisponiveis"
            description="Nao foi possivel carregar suas estatisticas agora."
          />
        ) : statistics ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Hash}
              title="Total de palpites"
              value={statistics.totalPredictions}
            />
            <StatCard
              icon={Trophy}
              title="Total de pontos"
              value={statistics.totalPoints}
            />
            <StatCard
              icon={Gauge}
              title="Pontuacao media"
              value={statistics.averagePoints}
            />
            <StatCard
              icon={CheckCircle2}
              title="Acertos de vencedor"
              value={statistics.correctWinners}
            />
            <StatCard
              icon={CheckCircle2}
              title="Placares exatos"
              value={statistics.exactScores}
            />
            <StatCard
              icon={Trophy}
              title="Posicao atual"
              value={
                statistics.currentPosition
                  ? `#${statistics.currentPosition}`
                  : "-"
              }
            />
            <StatCard
              icon={BarChart3}
              title="Melhor rodada"
              value={
                statistics.bestRound
                  ? `R${statistics.bestRound.round} - ${statistics.bestRound.points} pts`
                  : "-"
              }
            />
            <StatCard
              icon={CircleX}
              title="Pior rodada"
              value={
                statistics.worstRound
                  ? `R${statistics.worstRound.round} - ${statistics.worstRound.points} pts`
                  : "-"
              }
            />
          </div>
        ) : (
          <EmptyState
            icon={BarChart3}
            title="Sem estatisticas"
            description="Suas estatisticas aparecerao quando houver palpites processados."
          />
        )}
      </div>
    </DashboardShell>
  );
}
