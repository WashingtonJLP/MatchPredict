import type { FixtureStatusValue } from "@/types/fixture";

const statusLabels: Record<FixtureStatusValue, string> = {
  NS: "Agendada",
  LIVE: "Ao vivo",
  FT: "Finalizada",
  POSTPONED: "Adiada",
  CANCELLED: "Cancelada",
};

export function MatchStatusBadge({ status }: { status: FixtureStatusValue }) {
  const isLive = status === "LIVE";
  const isFinished = status === "FT";

  return (
    <span
      className={`inline-flex min-h-8 items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
        isLive
          ? "bg-accent/15 text-accent"
          : isFinished
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground"
      }`}
    >
      {statusLabels[status]}
    </span>
  );
}
