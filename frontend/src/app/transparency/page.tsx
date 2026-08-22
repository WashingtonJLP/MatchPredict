"use client";

import { CalendarDays, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingCard } from "@/components/shared/loading-card";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { UserAvatar } from "@/components/shared/user-avatar";
import { MatchStatusBadge } from "@/features/matches/components/match-status-badge";
import { TeamLogo } from "@/features/matches/components/team-logo";
import { useFixtures } from "@/hooks/use-fixtures";
import { useFixtureTransparency } from "@/hooks/use-predictions";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import type { MatchFixture } from "@/types/fixture";
import type { FixtureTransparency, TransparencyPrediction } from "@/types/prediction";

export default function TransparencyPage() {
  const [page, setPage] = useState(1);
  const [selectedFixtureId, setSelectedFixtureId] = useState<string | null>(
    null,
  );
  const detailsRef = useRef<HTMLElement | null>(null);
  const fixturesQuery = useFixtures({
    page,
    limit: 10,
  });
  const fixtures = useMemo(
    () => fixturesQuery.data?.data ?? [],
    [fixturesQuery.data?.data],
  );
  const transparencyQuery = useFixtureTransparency(selectedFixtureId);

  useEffect(() => {
    if (fixtures.length === 0) {
      setSelectedFixtureId(null);
      return;
    }

    if (!selectedFixtureId || !fixtures.some((item) => item.id === selectedFixtureId)) {
      setSelectedFixtureId(fixtures[0].id);
    }
  }, [fixtures, selectedFixtureId]);

  function handleSelectFixture(fixtureId: string) {
    setSelectedFixtureId(fixtureId);

    if (
      typeof window === "undefined" ||
      !window.matchMedia("(max-width: 1279px)").matches
    ) {
      return;
    }

    window.requestAnimationFrame(() => {
      detailsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  return (
    <DashboardShell>
      <div className="space-y-9">
        <PageHeader
          title="Transparência"
          description="Consulte os palpites visíveis por partida conforme o fechamento dos palpites."
        />

        <div className="grid min-w-0 gap-6 xl:grid-cols-[24rem_minmax(0,1fr)]">
          <section className="min-w-0 space-y-5">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl border border-border bg-card text-accent">
                <CalendarDays className="size-5" aria-hidden />
              </span>
              <div>
                <h2 className="text-xl font-extrabold text-foreground">
                  Partidas
                </h2>
                <p className="text-sm font-medium text-muted-foreground">
                  Selecione uma partida para consultar.
                </p>
              </div>
            </div>

            {fixturesQuery.isLoading ? (
              <LoadingCard rows={8} />
            ) : fixturesQuery.isError ? (
              <ErrorState
                icon={CalendarDays}
                title="Partidas indisponíveis"
                description={getApiErrorMessage(
                  fixturesQuery.error,
                  "Não foi possível carregar as partidas agora.",
                )}
              />
            ) : fixtures.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="Nenhuma partida encontrada"
                description="As partidas aparecerão aqui quando forem sincronizadas."
              />
            ) : (
              <div className="grid min-w-0 gap-3">
                {fixtures.map((fixture) => (
                  <FixtureOption
                    key={fixture.id}
                    fixture={fixture}
                    selected={fixture.id === selectedFixtureId}
                    onSelect={() => handleSelectFixture(fixture.id)}
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
          </section>

          <section
            ref={detailsRef}
            className="min-w-0 scroll-mt-28 sm:scroll-mt-32"
          >
            {selectedFixtureId && transparencyQuery.isLoading ? (
              <LoadingCard rows={8} />
            ) : transparencyQuery.isError ? (
              <ErrorState
                icon={ShieldCheck}
                title="Transparência indisponível"
                description={getApiErrorMessage(
                  transparencyQuery.error,
                  "Não foi possível carregar os palpites desta partida.",
                )}
              />
            ) : transparencyQuery.data ? (
              <TransparencyPanel data={transparencyQuery.data} />
            ) : (
              <EmptyState
                icon={Eye}
                title="Selecione uma partida"
                description="Escolha uma partida na lista para consultar os palpites disponíveis."
              />
            )}
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}

function FixtureOption({
  fixture,
  onSelect,
  selected,
}: {
  fixture: MatchFixture;
  onSelect: () => void;
  selected: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        "w-full min-w-0 rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition hover:border-accent/40 hover:bg-accent/5 focus-visible:ring-3 focus-visible:ring-ring/50",
        selected && "border-accent/50 bg-accent/10",
      )}
      onClick={onSelect}
    >
      <div className="flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-bold text-muted-foreground">
            Rodada {fixture.round}
          </p>
          <p className="mt-1 truncate text-base font-extrabold text-foreground">
            {fixture.homeTeam.name} x {fixture.awayTeam.name}
          </p>
        </div>
        <div className="shrink-0">
          <MatchStatusBadge status={fixture.status} />
        </div>
      </div>
      <p className="mt-3 text-sm font-medium text-muted-foreground">
        {formatDateTime(fixture.kickoff)}
      </p>
    </button>
  );
}

function TransparencyPanel({ data }: { data: FixtureTransparency }) {
  const { fixture, finalResult, isClosedForPrediction, predictions } = data;

  return (
    <div className="min-w-0 space-y-5">
      <article className="rounded-2xl border border-border bg-card p-5 shadow-sm shadow-primary/5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-bold uppercase tracking-wide text-accent">
              Rodada {fixture.round}
            </p>
            <h2 className="mt-2 break-words text-2xl font-extrabold leading-tight text-card-foreground sm:text-3xl">
              {fixture.homeTeam.name} x {fixture.awayTeam.name}
            </h2>
            <p className="mt-2 text-base font-semibold text-muted-foreground">
              {formatDateTime(fixture.kickoff)}
            </p>
          </div>
          <MatchStatusBadge status={fixture.status} />
        </div>

        <div className="mt-6 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
          <TeamSummary name={fixture.homeTeam.name} logo={fixture.homeTeam.logo} />
          <span className="rounded-xl bg-muted px-3 py-2 text-sm font-extrabold text-muted-foreground">
            VS
          </span>
          <TeamSummary name={fixture.awayTeam.name} logo={fixture.awayTeam.logo} />
        </div>

        {finalResult ? (
          <div className="mt-6 rounded-2xl border border-border bg-background p-4 text-center">
            <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Resultado final
            </p>
            <p className="mt-2 text-3xl font-extrabold text-foreground">
              {finalResult.homeGoals} x {finalResult.awayGoals}
            </p>
          </div>
        ) : null}
      </article>

      {!isClosedForPrediction ? (
        <div className="rounded-2xl border border-accent/20 bg-accent/10 p-4">
          <div className="flex gap-3">
            <EyeOff className="mt-1 size-5 shrink-0 text-accent" aria-hidden />
            <p className="text-sm font-semibold leading-6 text-foreground sm:text-base">
              Os palpites dos demais participantes serão liberados após o início
              da partida. Antes disso, somente seu próprio palpite aparece aqui.
            </p>
          </div>
        </div>
      ) : null}

      {predictions.length === 0 ? (
        <EmptyState
          icon={Eye}
          title="Nenhum palpite visível"
          description={
            isClosedForPrediction
              ? "Nenhum participante registrou palpite para esta partida."
              : "Você ainda não registrou palpite para esta partida."
          }
        />
      ) : (
        <DataTable<TransparencyPrediction>
          data={predictions}
          getRowKey={(prediction) => prediction.id}
          columns={[
            {
              key: "user",
              header: "Usuário",
              render: (prediction) => (
                <div className="flex items-center gap-3">
                  <UserAvatar name={prediction.user.name} size="sm" />
                  <span className="font-medium text-foreground">
                    {prediction.user.name}
                  </span>
                </div>
              ),
            },
            {
              key: "prediction",
              header: "Palpite",
              render: (prediction) => (
                <span className="font-mono text-xl font-extrabold text-foreground">
                  {prediction.homeGoals} x {prediction.awayGoals}
                </span>
              ),
            },
            {
              key: "points",
              header: "Pontos",
              render: (prediction) => formatPredictionPoints(prediction, data),
            },
          ]}
        />
      )}
    </div>
  );
}

function TeamSummary({ logo, name }: { logo: string; name: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2 text-center">
      <TeamLogo team={{ name, logo }} />
      <span className="line-clamp-2 min-h-10 break-words text-base font-extrabold leading-5 text-foreground">
        {name}
      </span>
    </div>
  );
}

function formatPredictionPoints(
  prediction: TransparencyPrediction,
  data: FixtureTransparency,
) {
  if (data.fixture.status !== "FT") {
    return <span className="text-muted-foreground">-</span>;
  }

  if (!data.fixture.processedAt) {
    return <span className="text-muted-foreground">Pendente</span>;
  }

  return (
    <span className="font-semibold text-accent">
      {prediction.totalPoints} pts
    </span>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
}
