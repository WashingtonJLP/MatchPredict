"use client";

import { CalendarDays, RefreshCw } from "lucide-react";
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

export function CompetitionGames({ competitionId }: { competitionId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = getTodayInSaoPaulo();
  const selectedDate = useMemo(() => {
    const queryDate = searchParams.get("date");

    return queryDate && isValidPlainDate(queryDate) ? queryDate : today;
  }, [searchParams, today]);
  const gamesQuery = useDailyGames(selectedDate, {
    competition: competitionId,
  });

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

    router.replace(`/competitions?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,28rem)] lg:items-center">
        <div className="min-w-0">
          <h3 className="text-lg font-extrabold text-card-foreground">
            Agenda da competição
          </h3>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">
            {formatLongDate(selectedDate)} · horário de Brasília
          </p>
        </div>
        <div className="min-w-0 [&_input]:min-w-0 [&_label]:min-w-0">
          <DailyGamesDateControl
            selectedDate={selectedDate}
            onDateChange={updateDate}
          />
        </div>
      </div>

      {gamesQuery.isLoading || gamesQuery.isPlaceholderData ? (
        <DailyGamesLoading />
      ) : gamesQuery.isError ? (
        <div className="space-y-4">
          <ErrorState
            icon={CalendarDays}
            title="Não foi possível carregar os jogos"
            description={getApiErrorMessage(
              gamesQuery.error,
              "Tente novamente em instantes.",
            )}
          />
          <div className="flex justify-center">
            <Button
              type="button"
              className="h-11 rounded-xl"
              onClick={() => void gamesQuery.refetch()}
            >
              <RefreshCw className="size-4" aria-hidden /> Tentar novamente
            </Button>
          </div>
        </div>
      ) : gamesQuery.data?.competitions.length ? (
        <DailyGamesList competitions={gamesQuery.data.competitions} />
      ) : (
        <EmptyState
          icon={CalendarDays}
          title="Nenhum jogo nesta data"
          description="Escolha outro dia no calendário para consultar a agenda da competição."
        />
      )}
    </div>
  );
}
