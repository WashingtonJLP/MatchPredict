"use client";

import { CalendarDays, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingCard } from "@/components/shared/loading-card";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { UserAvatar } from "@/components/shared/user-avatar";
import { DailyGameStatus } from "@/features/daily-games/components/daily-game-status";
import { formatDateInSaoPaulo } from "@/features/daily-games/components/date-utils";
import { MatchStatusBadge } from "@/features/matches/components/match-status-badge";
import { TeamLogo } from "@/features/matches/components/team-logo";
import { TransparencyFixtureCard } from "@/features/transparency/components/transparency-fixture-card";
import {
  buildPremierLeagueGamesBySourceEventId,
  getDailyGameForFixture,
  getTransparencyFixtureStatusLabel,
  getTransparencyStatusLabel,
  getTransparencyVisualGame,
  getUniqueFixtureDates,
  hasCompleteDailyGameScore,
} from "@/features/transparency/transparency-live-game";
import { useDailyGamesForDates } from "@/hooks/use-daily-games";
import { useFixtureCurrentPage, useFixtures } from "@/hooks/use-fixtures";
import { useFixtureTransparency } from "@/hooks/use-predictions";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import type { DailyGame } from "@/types/daily-game";
import type { FixtureTransparency, TransparencyPrediction } from "@/types/prediction";

export default function TransparencyPage() {
  const pageSize = 10;
  const [page, setPage] = useState<number | null>(null);
  const [selectedFixtureId, setSelectedFixtureId] = useState<string | null>(
    null,
  );
  const detailsRef = useRef<HTMLElement | null>(null);
  const initialPageQuery = useFixtureCurrentPage(pageSize);
  const fixturesQuery = useFixtures({
    page: page ?? 1,
    limit: pageSize,
  }, {
    enabled: page !== null,
  });
  const fixtures = useMemo(
    () => fixturesQuery.data?.data ?? [],
    [fixturesQuery.data?.data],
  );
  const fixtureDates = useMemo(
    () =>
      getUniqueFixtureDates(fixtures, (kickoff) =>
        formatDateInSaoPaulo(new Date(kickoff)),
      ),
    [fixtures],
  );
  const dailyGamesQueries = useDailyGamesForDates(fixtureDates, {
    competition: "eng.1",
    enabled: fixtureDates.length > 0,
  });
  const dailyGamesBySourceEventId = buildPremierLeagueGamesBySourceEventId(
    dailyGamesQueries.flatMap((query) =>
      query.isError || query.isRefetchError
        ? []
        : (query.data?.competitions ?? []),
    ),
  );
  const transparencyQuery = useFixtureTransparency(selectedFixtureId);
  const isInitializingPage = page === null;

  useEffect(() => {
    if (page !== null) {
      return;
    }

    if (initialPageQuery.data) {
      setPage(initialPageQuery.data.page);
      return;
    }

    if (initialPageQuery.isError) {
      setPage(1);
    }
  }, [initialPageQuery.data, initialPageQuery.isError, page]);

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

    if (typeof window === "undefined") {
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

            {isInitializingPage || fixturesQuery.isLoading ? (
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
                  <TransparencyFixtureCard
                    key={fixture.id}
                    fixture={fixture}
                    dailyGame={getDailyGameForFixture(
                      dailyGamesBySourceEventId,
                      fixture,
                    )}
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
              <TransparencyPanel
                data={transparencyQuery.data}
                dailyGame={getDailyGameForFixture(
                  dailyGamesBySourceEventId,
                  transparencyQuery.data.fixture,
                )}
              />
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

function TransparencyPanel({
  dailyGame,
  data,
}: {
  dailyGame?: DailyGame;
  data: FixtureTransparency;
}) {
  const { fixture, finalResult, isClosedForPrediction, predictions } = data;
  const visualDailyGame = getTransparencyVisualGame(dailyGame);
  const hasDailyScore = hasCompleteDailyGameScore(visualDailyGame);

  return (
    <div className="min-w-0 space-y-5">
      <article className="rounded-2xl border border-border bg-card p-5 shadow-sm shadow-primary/5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-bold uppercase tracking-wide text-accent">
              Rodada {fixture.round}
            </p>
            <p className="mt-2 text-base font-semibold text-muted-foreground">
              {formatDateTime(fixture.kickoff)}
            </p>
          </div>
          {!visualDailyGame ? (
            <MatchStatusBadge
              label={getTransparencyFixtureStatusLabel(fixture.status)}
              status={fixture.status}
            />
          ) : null}
        </div>

        <div className="mt-6 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 rounded-2xl bg-muted/35 px-3 py-4 sm:gap-5 sm:px-5">
          <TeamSummary name={fixture.homeTeam.name} logo={fixture.homeTeam.logo} />
          <MatchVisualState dailyGame={visualDailyGame} />
          <TeamSummary name={fixture.awayTeam.name} logo={fixture.awayTeam.logo} />
        </div>

        {finalResult && !hasDailyScore ? (
          <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-border bg-background px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground sm:text-sm">
              Resultado final
            </p>
            <p className="shrink-0 text-3xl font-extrabold leading-none text-foreground tabular-nums sm:text-4xl">
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
        <PredictionsTable predictions={predictions} data={data} />
      )}
    </div>
  );
}

function MatchVisualState({ dailyGame }: { dailyGame?: DailyGame }) {
  const hasScore = hasCompleteDailyGameScore(dailyGame);

  if (!dailyGame) {
    return (
      <span className="rounded-xl bg-background px-3 py-2 text-sm font-extrabold text-muted-foreground shadow-sm">
        VS
      </span>
    );
  }

  return (
    <div
      className="flex min-w-0 flex-col items-center justify-center gap-2 text-center"
      aria-atomic="true"
      aria-live="polite"
    >
      {hasScore ? (
        <div
          className={cn(
            "flex items-baseline justify-center gap-1.5 rounded-xl bg-primary px-2.5 py-2 text-primary-foreground shadow-sm tabular-nums sm:gap-2 sm:px-3",
            dailyGame.status === "LIVE" &&
              "bg-accent text-accent-foreground shadow-accent/20",
          )}
        >
          <span className="min-w-4 text-center text-2xl font-extrabold leading-none sm:text-3xl">
            {dailyGame.score.home}
          </span>
          <span className="text-sm font-extrabold opacity-70">×</span>
          <span className="min-w-4 text-center text-2xl font-extrabold leading-none sm:text-3xl">
            {dailyGame.score.away}
          </span>
        </div>
      ) : (
        <span className="rounded-xl bg-background px-3 py-2 text-sm font-extrabold text-muted-foreground shadow-sm">
          VS
        </span>
      )}

      <DailyGameStatus
        compact
        label={getTransparencyStatusLabel(dailyGame)}
        minute={dailyGame.minute}
        status={dailyGame.status}
      />
    </div>
  );
}

function TeamSummary({ logo, name }: { logo: string; name: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2 text-center">
      <TeamLogo team={{ name, logo }} />
      <span className="line-clamp-2 min-h-10 break-words text-sm font-extrabold leading-5 text-foreground sm:text-base">
        {name}
      </span>
    </div>
  );
}

function PredictionsTable({
  data,
  predictions,
}: {
  data: FixtureTransparency;
  predictions: TransparencyPrediction[];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm shadow-primary/5">
      <div className="md:hidden">
        <div className="grid grid-cols-[minmax(0,1fr)_4rem_3.75rem] gap-2 border-b border-border bg-muted/70 px-3 py-2 text-xs font-bold uppercase tracking-wide text-muted-foreground sm:px-4">
          <span>Usuário</span>
          <span className="text-center">Palpite</span>
          <span className="text-right">Pontos</span>
        </div>
        {predictions.map((prediction) => (
          <PredictionMobileRow
            key={prediction.id}
            prediction={prediction}
            data={data}
          />
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block" tabIndex={0}>
        <table className="w-full min-w-[680px] border-collapse text-left text-sm">
          <thead className="bg-muted/80 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-4 first:pl-6">Usuário</th>
              <th className="px-5 py-4 text-center">Palpite</th>
              <th className="px-5 py-4 text-right last:pr-6">Pontos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {predictions.map((prediction) => (
              <tr key={prediction.id} className="transition hover:bg-muted/70">
                <td className="px-5 py-5 align-middle first:pl-6">
                  <div className="flex min-w-0 items-center gap-3">
                    <UserAvatar name={prediction.user.name} size="sm" />
                    <span className="truncate font-medium text-foreground">
                      {prediction.user.name}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-5 text-center align-middle">
                  <span className="text-xl font-extrabold text-foreground tabular-nums">
                    {prediction.homeGoals} x {prediction.awayGoals}
                  </span>
                </td>
                <td className="px-5 py-5 text-right align-middle font-semibold last:pr-6">
                  {formatPredictionPoints(prediction, data)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PredictionMobileRow({
  data,
  prediction,
}: {
  data: FixtureTransparency;
  prediction: TransparencyPrediction;
}) {
  return (
    <div className="grid min-h-16 grid-cols-[minmax(0,1fr)_4rem_3.75rem] items-center gap-2 border-b border-border px-3 py-3 last:border-b-0 sm:px-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <UserAvatar name={prediction.user.name} size="sm" />
        <span className="line-clamp-2 min-w-0 break-words text-sm font-bold leading-5 text-foreground">
          {prediction.user.name}
        </span>
      </div>
      <span className="text-center text-base font-extrabold text-foreground tabular-nums">
        {prediction.homeGoals} x {prediction.awayGoals}
      </span>
      <span className="text-right text-sm font-extrabold text-accent tabular-nums">
        {formatPredictionPoints(prediction, data)}
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
      {formatPoints(prediction.totalPoints)}
    </span>
  );
}

function formatPoints(points: number) {
  return `${points} ${points === 1 ? "pt" : "pts"}`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
}
