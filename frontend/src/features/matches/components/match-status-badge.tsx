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

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        isLive ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
      }`}
    >
      {statusLabels[status]}
    </span>
  );
}
