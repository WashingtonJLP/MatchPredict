"use client";

import { CalendarDays, Filter, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingCard } from "@/components/shared/loading-card";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { MatchCard } from "@/features/matches/components/match-card";
import { PredictionModal } from "@/features/matches/components/prediction-modal";
import { useFixtures } from "@/hooks/use-fixtures";
import { getApiErrorMessage } from "@/lib/api-error";
import type {
  FixtureStatusValue,
  FixturesQuery,
  MatchFixture,
} from "@/types/fixture";

const filterOptions = [
  {
    label: "Todas",
    value: "all",
  },
  {
    label: "Hoje",
    value: "today",
  },
  {
    label: "Esta semana",
    value: "week",
  },
  {
    label: "Próximas",
    value: "upcoming",
  },
] as const;

const statusOptions: Array<{ label: string; value: FixtureStatusValue | "" }> = [
  {
    label: "Todos",
    value: "",
  },
  {
    label: "Agendada",
    value: "NS",
  },
  {
    label: "Ao vivo",
    value: "LIVE",
  },
  {
    label: "Finalizada",
    value: "FT",
  },
];

type DateFilter = (typeof filterOptions)[number]["value"];

type RoundGroup = {
  round: number;
  fixtures: MatchFixture[];
  openCount: number;
  liveCount: number;
  finishedCount: number;
};

function toIsoStartOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);

  return value.toISOString();
}

function toIsoEndOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);

  return value.toISOString();
}

function buildDateRange(filter: DateFilter) {
  const now = new Date();

  if (filter === "today") {
    return {
      from: toIsoStartOfDay(now),
      to: toIsoEndOfDay(now),
    };
  }

  if (filter === "week") {
    const end = new Date(now);
    end.setDate(now.getDate() + 7);

    return {
      from: toIsoStartOfDay(now),
      to: toIsoEndOfDay(end),
    };
  }

  if (filter === "all") {
    return {
      from: undefined,
      to: undefined,
    };
  }

  return {
    from: now.toISOString(),
    to: undefined,
  };
}

function canFixtureReceivePrediction(fixture: MatchFixture) {
  const kickoff = new Date(fixture.kickoff);

  return (
    fixture.canPredict &&
    kickoff.getTime() > Date.now() &&
    fixture.status !== "LIVE" &&
    fixture.status !== "FT"
  );
}

function groupFixturesByRound(fixtures: MatchFixture[]) {
  const groups = new Map<number, MatchFixture[]>();

  fixtures.forEach((fixture) => {
    const current = groups.get(fixture.round) ?? [];
    current.push(fixture);
    groups.set(fixture.round, current);
  });

  return Array.from(groups.entries()).map<RoundGroup>(([roundValue, items]) => ({
    round: roundValue,
    fixtures: items,
    openCount: items.filter(canFixtureReceivePrediction).length,
    liveCount: items.filter((fixture) => fixture.status === "LIVE").length,
    finishedCount: items.filter((fixture) => fixture.status === "FT").length,
  }));
}

export default function MatchesPage() {
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [status, setStatus] = useState<FixtureStatusValue | "">("");
  const [round, setRound] = useState("");
  const [teamId, setTeamId] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedFixture, setSelectedFixture] = useState<MatchFixture | null>(
    null,
  );
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const pendingResultsScrollRef = useRef(false);
  const [resultsScrollRequest, setResultsScrollRequest] = useState(0);
  const dateRange = useMemo(() => buildDateRange(dateFilter), [dateFilter]);
  const fixturesQueryParams = useMemo<FixturesQuery>(
    () => ({
      page,
      limit: 12,
      status: status || undefined,
      round: round ? Number(round) : undefined,
      teamId: teamId.trim() || undefined,
      from: dateRange.from,
      to: dateRange.to,
    }),
    [dateRange.from, dateRange.to, page, round, status, teamId],
  );
  const fixturesQuery = useFixtures(fixturesQueryParams);
  const fixtures = useMemo(() => {
    const data = fixturesQuery.data?.data ?? [];
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return data;
    }

    return data.filter((fixture) =>
      `${fixture.homeTeam.name} ${fixture.awayTeam.name}`
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [fixturesQuery.data?.data, search]);
  const fixtureGroups = useMemo(() => groupFixturesByRound(fixtures), [fixtures]);
  const totalOpenFixtures = useMemo(
    () => fixtures.filter(canFixtureReceivePrediction).length,
    [fixtures],
  );

  function updateDateFilter(value: DateFilter) {
    requestResultsScrollAfterQuery();
    setDateFilter(value);
    setPage(1);
  }

  const scrollToResults = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, []);

  function requestResultsScrollAfterQuery() {
    pendingResultsScrollRef.current = true;
    setResultsScrollRequest((value) => value + 1);
  }

  useEffect(() => {
    if (!pendingResultsScrollRef.current) {
      return;
    }

    if (fixturesQuery.isLoading || fixturesQuery.isFetching) {
      return;
    }

    pendingResultsScrollRef.current = false;
    scrollToResults();
  }, [
    fixturesQuery.isFetching,
    fixturesQuery.isLoading,
    resultsScrollRequest,
    scrollToResults,
  ]);

  return (
    <DashboardShell>
      <div className="space-y-6 sm:space-y-8">
        <PageHeader
          title="Partidas"
          description="Acompanhe a rodada, veja jogos abertos e registre seus palpites antes do início."
        />

        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm shadow-primary/5 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-foreground">
                <Filter className="size-4 text-accent" aria-hidden />
                Sala de rodada
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {fixturesQuery.isLoading
                  ? "Carregando partidas sincronizadas..."
                  : `${fixtures.length} partidas encontradas · ${totalOpenFixtures} abertas para palpite`}
              </p>
            </div>

            <div className="grid gap-2 sm:flex sm:flex-wrap lg:justify-end">
              {filterOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={dateFilter === option.value ? "default" : "outline"}
                  className={`h-10 rounded-xl px-4 text-sm font-bold ${
                    dateFilter === option.value
                      ? "bg-primary text-primary-foreground hover:bg-primary/80"
                      : "bg-background"
                  }`}
                  onClick={() => updateDateFilter(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:gap-4 lg:grid-cols-[1.35fr_0.8fr_0.65fr_0.7fr]">
            <label className="relative block">
              <Search
                className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    scrollToResults();
                  }
                }}
                aria-label="Buscar partidas por time"
                placeholder="Buscar por time"
                className="h-12 w-full rounded-xl border border-input bg-background pl-11 pr-4 text-base text-foreground outline-none transition placeholder:text-muted-foreground hover:border-border focus:border-ring focus:ring-4 focus:ring-ring/15"
              />
            </label>

            <select
              value={status}
              aria-label="Filtrar por status"
              onChange={(event) => {
                requestResultsScrollAfterQuery();
                setStatus(event.target.value as FixtureStatusValue | "");
                setPage(1);
              }}
              className="h-12 rounded-xl border border-input bg-background px-4 text-base text-foreground outline-none transition hover:border-border focus:border-ring focus:ring-4 focus:ring-ring/15"
            >
              {statusOptions.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <input
              type="number"
              min={0}
              value={round}
              aria-label="Filtrar por rodada"
              onChange={(event) => {
                requestResultsScrollAfterQuery();
                setRound(event.target.value);
                setPage(1);
              }}
              placeholder="Rodada"
              className="h-12 rounded-xl border border-input bg-background px-4 text-base text-foreground outline-none transition placeholder:text-muted-foreground hover:border-border focus:border-ring focus:ring-4 focus:ring-ring/15"
            />

            <label className="relative block">
              <span className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center rounded-full bg-muted px-2 py-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                ID
              </span>
              <input
                value={teamId}
                aria-label="Filtrar por ID do time"
                onChange={(event) => {
                  requestResultsScrollAfterQuery();
                  setTeamId(event.target.value);
                  setPage(1);
                }}
                placeholder="ID do time"
                className="h-12 w-full rounded-xl border border-input bg-muted/50 px-4 pr-12 text-base text-foreground outline-none transition placeholder:text-muted-foreground hover:border-border focus:border-ring focus:bg-background focus:ring-4 focus:ring-ring/15"
              />
            </label>
          </div>
        </section>

        <div ref={resultsRef} className="space-y-6 scroll-mt-28 sm:scroll-mt-32">
          {fixturesQuery.isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <LoadingCard key={index} rows={4} />
              ))}
            </div>
          ) : fixturesQuery.isError ? (
            <ErrorState
              icon={CalendarDays}
              title="Não foi possível carregar as partidas"
              description={getApiErrorMessage(
                fixturesQuery.error,
                "Tente novamente em instantes ou verifique sua conexão com a API.",
              )}
            />
          ) : fixtures.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Nenhuma partida encontrada"
              description="Ajuste filtros ou busca para encontrar partidas sincronizadas."
            />
          ) : (
            <div className="space-y-7">
              {fixtureGroups.map((group) => (
                <section key={group.round} className="space-y-4">
                  <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card px-4 py-4 shadow-sm shadow-primary/5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div>
                      <h2 className="text-xl font-extrabold leading-tight text-foreground sm:text-2xl">
                        Rodada {group.round}
                      </h2>
                      <p className="mt-1 text-sm font-medium text-muted-foreground">
                        {group.fixtures.length} partidas em ordem cronológica
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex min-h-8 items-center rounded-full bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent">
                        {group.openCount} abertas
                      </span>
                      <span className="inline-flex min-h-8 items-center rounded-full bg-muted px-3 py-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        {group.liveCount} ao vivo
                      </span>
                      <span className="inline-flex min-h-8 items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
                        {group.finishedCount} finalizadas
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {group.fixtures.map((fixture) => (
                      <MatchCard
                        key={fixture.id}
                        fixture={fixture}
                        onPredict={setSelectedFixture}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          {fixturesQuery.data ? (
            <Pagination
              page={fixturesQuery.data.meta.page}
              total={fixturesQuery.data.meta.total}
              totalPages={fixturesQuery.data.meta.totalPages}
              onPageChange={setPage}
            />
          ) : null}
        </div>

        <PredictionModal
          fixture={selectedFixture}
          onClose={() => setSelectedFixture(null)}
        />
      </div>
    </DashboardShell>
  );
}
