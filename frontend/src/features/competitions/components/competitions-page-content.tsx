"use client";

import { AlertTriangle, RefreshCw, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { CompetitionDataPanel } from "@/features/competitions/components/competition-data-panel";
import { CompetitionExplorer } from "@/features/competitions/components/competition-explorer";
import { CompetitionLogo } from "@/features/competitions/components/competition-logo";
import {
  type CompetitionTabId,
  getCompetitionTabs,
  resolveCompetitionForRegion,
  resolveCompetitionSelection,
} from "@/features/competitions/competition-view";
import {
  useCompetitionCatalog,
  useCurrentCompetitionSeason,
} from "@/hooks/use-competitions";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";

export function CompetitionsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const catalogQuery = useCompetitionCatalog();
  const selectedCompetition = useMemo(
    () =>
      resolveCompetitionSelection(
        searchParams.get("competition"),
        catalogQuery.data?.competitions ?? [],
      ),
    [catalogQuery.data?.competitions, searchParams],
  );
  const [activeTab, setActiveTab] = useState<CompetitionTabId>("games");
  const tabs = useMemo(
    () => (selectedCompetition ? getCompetitionTabs(selectedCompetition) : []),
    [selectedCompetition],
  );
  const seasonQuery = useCurrentCompetitionSeason(
    selectedCompetition?.id ?? "",
  );

  useEffect(() => {
    if (!tabs.some((tab) => tab.id === activeTab)) {
      setActiveTab("games");
    }
  }, [activeTab, tabs]);

  function selectCompetition(competitionId: string) {
    const params = new URLSearchParams(searchParams.toString());

    params.set("competition", competitionId);
    router.replace(`/competitions?${params.toString()}`, { scroll: false });
  }

  function selectRegion(regionId: string) {
    const competition = resolveCompetitionForRegion(
      regionId,
      catalogQuery.data?.competitions ?? [],
      selectedCompetition?.id,
    );

    if (competition) {
      selectCompetition(competition.id);
    }
  }

  if (catalogQuery.isLoading) {
    return <CompetitionsPageSkeleton />;
  }

  if (catalogQuery.isError || !catalogQuery.data || !selectedCompetition) {
    return (
      <main className="mx-auto w-full max-w-6xl space-y-5 px-4 py-10 sm:px-6 lg:px-8">
        <ErrorState
          icon={Trophy}
          title="Não foi possível carregar as competições"
          description={getApiErrorMessage(
            catalogQuery.error,
            "Tente novamente em instantes.",
          )}
        />
        <div className="flex justify-center">
          <Button
            type="button"
            className="h-11 rounded-xl"
            onClick={() => void catalogQuery.refetch()}
          >
            <RefreshCw className="size-4" aria-hidden /> Tentar novamente
          </Button>
        </div>
      </main>
    );
  }

  return (
    <div className="bg-background font-sans">
      <CompetitionExplorer
        regions={catalogQuery.data.regions}
        competitions={catalogQuery.data.competitions}
        selectedCompetition={selectedCompetition}
        selectedRegionId={selectedCompetition.regionId}
        onRegionChange={selectRegion}
        onCompetitionChange={selectCompetition}
      />

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm shadow-primary/5">
          <header className="flex min-w-0 items-center gap-3 border-b border-border bg-secondary/45 px-4 py-4 sm:gap-4 sm:px-5">
            <CompetitionLogo
              src={selectedCompetition.logo}
              name={selectedCompetition.name}
              className="size-12 rounded-xl p-1.5 shadow-sm sm:size-14"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold uppercase tracking-wide text-accent-foreground dark:text-accent">
                {
                  catalogQuery.data.regions.find(
                    (region) => region.id === selectedCompetition.regionId,
                  )?.name
                }
              </p>
              <h2 className="mt-1 line-clamp-2 text-xl font-extrabold leading-tight text-card-foreground [overflow-wrap:normal] [word-break:normal] sm:text-2xl">
                {selectedCompetition.name}
              </h2>
              <p className="mt-1 text-sm font-semibold text-muted-foreground">
                {seasonQuery.data?.displayName ??
                  (seasonQuery.isError
                    ? "Temporada indisponível"
                    : "Carregando temporada…")}
              </p>
            </div>
          </header>

          {seasonQuery.data?.partial ? (
            <div
              className="flex items-start gap-2 border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900"
              role="status"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              Algumas fases da temporada ainda não foram publicadas pela ESPN.
            </div>
          ) : null}

          <nav
            className="flex gap-1 overflow-x-auto border-b border-border bg-card px-3 pt-2"
            aria-label={`Conteúdo de ${selectedCompetition.name}`}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                aria-pressed={activeTab === tab.id}
                className={cn(
                  "relative min-h-11 shrink-0 rounded-t-lg px-4 text-sm font-extrabold transition focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/50",
                  activeTab === tab.id
                    ? "text-card-foreground after:absolute after:inset-x-2 after:bottom-0 after:h-1 after:rounded-t-full after:bg-accent"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-card-foreground",
                )}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="p-3 sm:p-5" data-competition-panel>
            <CompetitionDataPanel
              competition={selectedCompetition}
              activeTab={activeTab}
              season={seasonQuery.data?.year}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

export function CompetitionsPageSkeleton() {
  return (
    <div className="bg-background">
      <section className="bg-primary px-4 py-8 sm:px-6">
        <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="h-12 w-72 max-w-full rounded-xl bg-primary-foreground/15 motion-safe:animate-pulse" />
            <div className="h-5 w-full max-w-xl rounded bg-primary-foreground/10 motion-safe:animate-pulse" />
            <div className="h-12 w-full max-w-xl rounded-xl bg-primary-foreground/10 motion-safe:animate-pulse" />
          </div>
          <div className="mx-auto aspect-square w-64 rounded-full bg-primary-foreground/10 motion-safe:animate-pulse" />
        </div>
      </section>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="h-96 rounded-2xl border border-border bg-card motion-safe:animate-pulse" />
      </main>
    </div>
  );
}
