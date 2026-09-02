import { cn } from "@/lib/utils";
import type { DailyGameStatus as DailyGameStatusValue } from "@/types/daily-game";

export const fallbackStatusLabels: Record<DailyGameStatusValue, string> = {
  SCHEDULED: "Pré-jogo",
  LIVE: "Ao vivo",
  HALFTIME: "Intervalo",
  FINAL: "Encerrado",
  FINAL_PENALTIES: "Pênaltis",
  DELAYED: "Atrasado",
  POSTPONED: "Adiado",
  CANCELED: "Cancelado",
  SUSPENDED: "Suspenso",
  UNKNOWN: "Status indefinido",
};

const statusClasses: Record<DailyGameStatusValue, string> = {
  SCHEDULED: "border-primary/10 bg-primary/5 text-primary",
  LIVE:
    "border-accent/30 bg-accent text-accent-foreground shadow-sm shadow-accent/20",
  HALFTIME: "border-amber-300 bg-amber-100 text-amber-900",
  FINAL: "border-primary/10 bg-muted text-muted-foreground",
  FINAL_PENALTIES: "border-primary/10 bg-muted text-primary",
  DELAYED: "border-amber-300 bg-amber-100 text-amber-900",
  POSTPONED: "border-primary/10 bg-muted text-muted-foreground",
  CANCELED: "border-destructive/20 bg-destructive/10 text-destructive",
  SUSPENDED: "border-amber-300 bg-amber-100 text-amber-900",
  UNKNOWN: "border-primary/10 bg-muted text-muted-foreground",
};

type DailyGameStatusProps = {
  label: string;
  minute: number | null;
  status: DailyGameStatusValue;
  compact?: boolean;
};

export function DailyGameStatus({
  compact = false,
  label,
  minute,
  status,
}: DailyGameStatusProps) {
  const isLive = status === "LIVE";
  const displayLabel = label || fallbackStatusLabels[status];

  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center justify-center gap-1 rounded-full border px-2 py-0.5 text-xs font-extrabold uppercase tracking-wide",
        statusClasses[status],
        compact && "px-1.5",
      )}
    >
      {isLive ? (
        <span className="size-1.5 rounded-full bg-current motion-safe:animate-pulse" />
      ) : null}
      {isLive && minute !== null ? `${displayLabel} · ${minute}'` : displayLabel}
    </span>
  );
}
