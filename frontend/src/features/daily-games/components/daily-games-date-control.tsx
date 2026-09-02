"use client";

import { CalendarDays, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  addDaysToPlainDate,
  formatLongDate,
  formatShortDate,
  getTodayInSaoPaulo,
} from "@/features/daily-games/components/date-utils";
import { cn } from "@/lib/utils";

type DailyGamesDateControlProps = {
  selectedDate: string;
  onDateChange: (date: string) => void;
};

export function DailyGamesDateControl({
  selectedDate,
  onDateChange,
}: DailyGamesDateControlProps) {
  const today = getTodayInSaoPaulo();
  const isToday = selectedDate === today;

  return (
    <section
      className="mx-auto w-full max-w-3xl rounded-2xl border border-border bg-card p-2.5 text-foreground shadow-xl shadow-primary/20"
      aria-label="Selecionar data dos jogos"
    >
      <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 rounded-xl border border-border text-primary transition hover:-translate-x-0.5 hover:border-accent/40 hover:bg-muted focus-visible:ring-accent/50 motion-reduce:hover:translate-x-0"
          aria-label="Ver dia anterior"
          onClick={() => onDateChange(addDaysToPlainDate(selectedDate, -1))}
        >
          <ChevronLeft className="size-5" aria-hidden />
        </Button>

        <div className="min-w-0 text-center">
          <p className="truncate text-xl font-extrabold leading-tight text-primary sm:text-2xl">
            {isToday ? "Hoje" : formatShortDate(selectedDate)}
          </p>
          <p className="mt-1 truncate text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {formatLongDate(selectedDate)}
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 rounded-xl border border-border text-primary transition hover:translate-x-0.5 hover:border-accent/40 hover:bg-muted focus-visible:ring-accent/50 motion-reduce:hover:translate-x-0"
          aria-label="Ver próximo dia"
          onClick={() => onDateChange(addDaysToPlainDate(selectedDate, 1))}
        >
          <ChevronRight className="size-5" aria-hidden />
        </Button>
      </div>

      <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
        <label className="relative block">
          <CalendarDays
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <span className="sr-only">Escolher data</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => onDateChange(event.target.value)}
            className="h-10 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm font-bold text-foreground outline-none transition hover:border-accent/40 hover:bg-muted/60 focus:border-accent focus:ring-4 focus:ring-accent/20"
          />
        </label>

        <Button
          type="button"
          variant={isToday ? "ghost" : "default"}
          className={cn(
            "h-10 rounded-xl px-3 font-bold transition focus-visible:ring-accent/50",
            isToday
              ? "border border-border text-primary hover:bg-muted"
              : "bg-accent text-accent-foreground shadow-lg shadow-accent/20 hover:bg-accent/90",
          )}
          aria-label="Voltar para hoje"
          onClick={() => onDateChange(today)}
        >
          <RotateCcw className="size-4" aria-hidden />
          Hoje
        </Button>
      </div>
    </section>
  );
}
