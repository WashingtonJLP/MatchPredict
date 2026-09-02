"use client";

import { AlertTriangle, CalendarDays, RefreshCw, Radio } from "lucide-react";
import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { DailyGamesDateControl } from "@/features/daily-games/components/daily-games-date-control";
import { DailyGamesList } from "@/features/daily-games/components/daily-games-list";
import { DailyGamesLoading } from "@/features/daily-games/components/daily-games-loading";
import {
  formatLongDate,
  getTodayInSaoPaulo,
  isValidPlainDate,
} from "@/features/daily-games/components/date-utils";
import { useDailyGames } from "@/hooks/use-daily-games";
import { getApiErrorMessage } from "@/lib/api-error";

export function DailyGamesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = getTodayInSaoPaulo();
  const selectedDate = useMemo(() => {
    const queryDate = searchParams.get("date");

    return queryDate && isValidPlainDate(queryDate) ? queryDate : today;
  }, [searchParams, today]);
  const dailyGamesQuery = useDailyGames(selectedDate);
  const gamesCount = useMemo(
    () =>
      dailyGamesQuery.data?.competitions.reduce(
        (total, competition) => total + competition.games.length,
        0,
      ) ?? 0,
    [dailyGamesQuery.data?.competitions],
  );
  const liveGamesCount = useMemo(
    () =>
      dailyGamesQuery.data?.competitions.reduce(
        (total, competition) =>
          total +
          competition.games.filter(
            (game) => game.status === "LIVE" || game.status === "HALFTIME",
          ).length,
        0,
      ) ?? 0,
    [dailyGamesQuery.data?.competitions],
  );
  const competitionsCount = dailyGamesQuery.data?.competitions.length ?? 0;
  const hasPartialFailure =
    dailyGamesQuery.data && dailyGamesQuery.data.meta.failedCompetitions > 0;

  function updateDate(date: string) {
    if (!isValidPlainDate(date)) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());

    if (date === today) {
      params.delete("date");
    } else {
      params.set("date", date);
    }

    const query = params.toString();

    router.replace(query ? `/daily-games?${query}` : "/daily-games", {
      scroll: false,
    });
  }

  return (
    <div className="bg-background font-sans">
      <section className="overflow-hidden bg-primary text-primary-foreground">
        <div className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(21rem,26rem)] lg:items-center">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-lg shadow-accent/20">
                  <Radio className="size-5" aria-hidden />
                </span>
                <h1 className="text-4xl font-extrabold leading-tight text-primary-foreground sm:text-5xl">
                  Jogos do Dia
                </h1>
              </div>
              <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-primary-foreground/70 sm:text-lg">
                A central de partidas do MatchPredict, com calendário, placares
                e status ao vivo das principais competições.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <SignalPill value={gamesCount} label="jogos" />
                <SignalPill value={competitionsCount} label="competições" />
                {liveGamesCount > 0 ? (
                  <span className="inline-flex min-h-9 items-center gap-2 rounded-full border border-accent/40 bg-accent px-3 text-xs font-extrabold uppercase tracking-wide text-accent-foreground shadow-lg shadow-accent/20">
                    <span className="size-2 rounded-full bg-current motion-safe:animate-pulse" />
                    {liveGamesCount} ao vivo
                  </span>
                ) : null}
              </div>
            </div>

            <DailyGamesDateControl
              selectedDate={selectedDate}
              onDateChange={updateDate}
            />
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl space-y-4 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-extrabold text-foreground">
            {formatLongDate(selectedDate)}
          </p>
          {dailyGamesQuery.data ? (
            <p className="text-xs font-semibold text-muted-foreground">
              Atualizado às{" "}
              {new Intl.DateTimeFormat("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date(dailyGamesQuery.data.meta.generatedAt))}
            </p>
          ) : null}
        </div>

        {hasPartialFailure ? (
          <div
            className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900"
            role="status"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            Algumas competições não puderam ser atualizadas agora.
          </div>
        ) : null}

        {dailyGamesQuery.isLoading ? (
          <DailyGamesLoading />
        ) : dailyGamesQuery.isError ? (
          <div className="space-y-4">
            <ErrorState
              icon={CalendarDays}
              title="Não foi possível carregar os jogos"
              description={getApiErrorMessage(
                dailyGamesQuery.error,
                "Tente novamente em instantes.",
              )}
            />
            <div className="flex justify-center">
              <Button
                type="button"
                className="h-11 rounded-xl"
                onClick={() => void dailyGamesQuery.refetch()}
              >
                <RefreshCw className="size-4" aria-hidden />
                Tentar novamente
              </Button>
            </div>
          </div>
        ) : !dailyGamesQuery.data?.competitions.length ? (
          <div className="space-y-4">
            <EmptyState
              icon={CalendarDays}
              title="Nenhum jogo encontrado para esta data"
              description="Volte para hoje ou escolha outra data no calendário."
            />
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-xl"
                onClick={() => updateDate(today)}
              >
                Voltar para hoje
              </Button>
            </div>
          </div>
        ) : (
          <DailyGamesList competitions={dailyGamesQuery.data.competitions} />
        )}
      </main>
    </div>
  );
}

function SignalPill({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex min-h-9 items-center gap-2 rounded-full border border-primary-foreground/15 bg-primary-foreground/10 px-3 text-xs font-extrabold uppercase tracking-wide text-primary-foreground/80">
      <span className="text-base text-primary-foreground tabular-nums">
        {value}
      </span>
      {label}
    </span>
  );
}
