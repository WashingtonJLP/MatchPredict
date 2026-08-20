"use client";

import { CalendarDays, Search } from "lucide-react";
import { useMemo, useState } from "react";

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

  function updateDateFilter(value: DateFilter) {
    setDateFilter(value);
    setPage(1);
  }

  return (
    <DashboardShell>
      <div className="space-y-9">
        <PageHeader
          title="Partidas"
          description="Escolha uma partida, acompanhe o status e registre seus palpites antes do início do jogo."
        />

        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm shadow-primary/5 sm:p-5 lg:p-6">
          <div className="grid gap-3 sm:gap-4 lg:grid-cols-[1.2fr_0.8fr_0.7fr_0.8fr]">
            <label className="relative block">
              <Search
                className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Buscar partidas por time"
                placeholder="Buscar por time"
                className="h-[52px] w-full rounded-xl border border-input bg-background pl-11 pr-4 text-base text-foreground outline-none transition placeholder:text-muted-foreground hover:border-border focus:border-ring focus:ring-4 focus:ring-ring/15"
              />
            </label>

            <select
              value={status}
              aria-label="Filtrar por status"
              onChange={(event) => {
                setStatus(event.target.value as FixtureStatusValue | "");
                setPage(1);
              }}
              className="h-[52px] rounded-xl border border-input bg-background px-4 text-base text-foreground outline-none transition hover:border-border focus:border-ring focus:ring-4 focus:ring-ring/15"
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
                setRound(event.target.value);
                setPage(1);
              }}
              placeholder="Rodada"
              className="h-[52px] rounded-xl border border-input bg-background px-4 text-base text-foreground outline-none transition placeholder:text-muted-foreground hover:border-border focus:border-ring focus:ring-4 focus:ring-ring/15"
            />

            <input
              value={teamId}
              aria-label="Filtrar por ID do time"
              onChange={(event) => {
                setTeamId(event.target.value);
                setPage(1);
              }}
              placeholder="ID do time"
              className="h-[52px] rounded-xl border border-input bg-background px-4 text-base text-foreground outline-none transition placeholder:text-muted-foreground hover:border-border focus:border-ring focus:ring-4 focus:ring-ring/15"
            />
          </div>

          <div className="mt-5 grid gap-2 sm:flex sm:flex-wrap">
            {filterOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={dateFilter === option.value ? "default" : "outline"}
                className={`h-11 rounded-xl px-4 text-sm font-bold sm:text-base ${
                  dateFilter === option.value
                    ? "bg-primary text-primary-foreground hover:bg-primary/80"
                    : ""
                }`}
                onClick={() => updateDateFilter(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </section>

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
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {fixtures.map((fixture) => (
              <MatchCard
                key={fixture.id}
                fixture={fixture}
                onPredict={setSelectedFixture}
              />
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

        <PredictionModal
          fixture={selectedFixture}
          onClose={() => setSelectedFixture(null)}
        />
      </div>
    </DashboardShell>
  );
}
