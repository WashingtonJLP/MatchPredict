"use client";

import { AlertTriangle, BarChart3, RefreshCw } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { CompetitionGames } from "@/features/competitions/components/competition-games";
import { GroupsView } from "@/features/competitions/components/groups-view";
import { StandingsTable } from "@/features/competitions/components/standings-table";
import { TournamentView } from "@/features/competitions/components/tournament-view";
import {
  removeCompetitionProviderAttribution,
  type CompetitionTabId,
} from "@/features/competitions/competition-view";
import {
  useCompetitionStandings,
  useCompetitionTournament,
} from "@/hooks/use-competitions";
import { getApiErrorMessage } from "@/lib/api-error";
import type { FootballCompetition } from "@/types/competition";

type CompetitionDataPanelProps = {
  competition: FootballCompetition;
  activeTab: CompetitionTabId;
  season?: number;
};

export function CompetitionDataPanel({
  competition,
  activeTab,
  season,
}: CompetitionDataPanelProps) {
  const needsStandings = activeTab === "standings" || activeTab === "groups";
  const standingsQuery = useCompetitionStandings(
    competition.id,
    season,
    needsStandings,
  );
  const tournamentQuery = useCompetitionTournament(
    competition.id,
    season,
    activeTab === "tournament",
  );

  if (activeTab === "games") {
    return <CompetitionGames competitionId={competition.id} />;
  }

  if (needsStandings) {
    if (standingsQuery.isLoading) {
      return activeTab === "groups" ? (
        <GroupsSkeleton />
      ) : (
        <CompetitionTableSkeleton />
      );
    }

    if (standingsQuery.isError) {
      return (
        <QueryError
          description={removeCompetitionProviderAttribution(
            getApiErrorMessage(
              standingsQuery.error,
              "A classificação não pôde ser atualizada.",
            ),
          )}
          onRetry={() => void standingsQuery.refetch()}
        />
      );
    }

    const standings = standingsQuery.data;

    if (!standings?.applicable) {
      return (
        <EmptyState
          icon={BarChart3}
          title="Competição sem classificação"
          description={
            (standings?.reason
              ? removeCompetitionProviderAttribution(standings.reason)
              : null) ?? "Este formato não utiliza tabela de classificação."
          }
        />
      );
    }

    return (
      <div className="space-y-4">
        {standings.partial ? <PartialDataBanner /> : null}
        {activeTab === "groups" ? (
          <GroupsView
            groups={standings.sections}
            reason={
              standings.reason
                ? removeCompetitionProviderAttribution(standings.reason)
                : null
            }
          />
        ) : standings.sections.length > 0 ? (
          <div className="space-y-4">
            {standings.sections.map((section) => (
              <StandingsTable
                key={section.id}
                section={section}
                showTitle={standings.sections.length > 1}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={BarChart3}
            title="Classificação ainda não publicada"
            description={
              (standings.reason
                ? removeCompetitionProviderAttribution(standings.reason)
                : null) ?? "A tabela aparecerá aqui quando for publicada."
            }
          />
        )}
      </div>
    );
  }

  if (tournamentQuery.isLoading) {
    return <TournamentSkeleton />;
  }

  if (tournamentQuery.isError) {
    return (
      <QueryError
        description={removeCompetitionProviderAttribution(
          getApiErrorMessage(
            tournamentQuery.error,
            "As fases não puderam ser atualizadas.",
          ),
        )}
        onRetry={() => void tournamentQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-4">
      {tournamentQuery.data?.partial ? <PartialDataBanner /> : null}
      {tournamentQuery.data?.warnings.map((warning) => (
        <div
          key={warning}
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900"
        >
          {removeCompetitionProviderAttribution(warning)}
        </div>
      ))}
      <TournamentView
        phases={tournamentQuery.data?.phases ?? []}
        reason={
          tournamentQuery.data?.reason
            ? removeCompetitionProviderAttribution(tournamentQuery.data.reason)
            : null
        }
      />
    </div>
  );
}

function PartialDataBanner() {
  return (
    <div
      className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900"
      role="status"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
      Foram recebidos dados parciais. O conteúdo disponível foi preservado.
    </div>
  );
}

function QueryError({
  description,
  onRetry,
}: {
  description: string;
  onRetry: () => void;
}) {
  return (
    <div className="space-y-4">
      <ErrorState
        title="Não foi possível carregar os dados"
        description={description}
      />
      <div className="flex justify-center">
        <Button type="button" className="h-11 rounded-xl" onClick={onRetry}>
          <RefreshCw className="size-4" aria-hidden /> Tentar novamente
        </Button>
      </div>
    </div>
  );
}

function CompetitionTableSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-border bg-card"
      role="status"
      aria-busy="true"
      aria-label="Carregando classificação"
    >
      <div className="h-11 bg-muted/70 motion-safe:animate-pulse" />
      {Array.from({ length: 10 }, (_, index) => (
        <div
          key={index}
          className="flex h-14 items-center gap-3 border-t border-border px-3"
        >
          <div className="h-4 w-6 rounded bg-muted motion-safe:animate-pulse" />
          <div className="size-7 rounded-full bg-muted motion-safe:animate-pulse" />
          <div className="h-4 flex-1 rounded bg-muted motion-safe:animate-pulse" />
          <div className="h-4 w-20 rounded bg-muted motion-safe:animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function GroupsSkeleton() {
  return (
    <div
      className="grid items-start gap-4 xl:grid-cols-2"
      role="status"
      aria-busy="true"
      aria-label="Carregando grupos"
    >
      {Array.from({ length: 4 }, (_, groupIndex) => (
        <div
          key={groupIndex}
          className="overflow-hidden rounded-2xl border border-border bg-card"
        >
          <div className="h-12 border-b border-border bg-muted/70 motion-safe:animate-pulse" />
          {Array.from({ length: 4 }, (_, rowIndex) => (
            <div
              key={rowIndex}
              className="flex h-14 items-center gap-3 border-b border-border/70 px-3 last:border-b-0"
            >
              <div className="h-4 w-6 rounded bg-muted motion-safe:animate-pulse" />
              <div className="size-7 rounded-full bg-muted motion-safe:animate-pulse" />
              <div className="h-4 flex-1 rounded bg-muted motion-safe:animate-pulse" />
              <div className="h-4 w-12 rounded bg-muted motion-safe:animate-pulse" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function TournamentSkeleton() {
  return (
    <div
      className="grid gap-4 lg:grid-cols-4"
      role="status"
      aria-busy="true"
      aria-label="Carregando mata-mata"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="h-64 rounded-2xl border border-border bg-muted/60 motion-safe:animate-pulse"
        />
      ))}
    </div>
  );
}
