import type { ReactNode } from "react";

import { TeamBadge } from "@/features/matches/components/team-badge";
import { cn } from "@/lib/utils";
import type { Team } from "@/types/prediction";

type MatchTeamsLayoutProps = {
  awayTeam: Pick<Team, "name" | "logo">;
  center: ReactNode;
  homeTeam: Pick<Team, "name" | "logo">;
  mobileLayout?: "inline" | "stacked";
};

export function MatchTeamsLayout({
  awayTeam,
  center,
  homeTeam,
  mobileLayout = "stacked",
}: MatchTeamsLayoutProps) {
  const isInlineOnMobile = mobileLayout === "inline";

  return (
    <div
      className={cn(
        "mt-5 grid sm:mx-0 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center sm:gap-4",
        isInlineOnMobile
          ? "-mx-4 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-0"
          : "grid-cols-2 items-start gap-x-4 gap-y-3",
      )}
    >
      <div className="min-w-0">
        <TeamBadge
          team={homeTeam}
          compactOnMobile={isInlineOnMobile}
          label="Casa"
        />
      </div>
      <div
        className={cn(
          "flex min-w-0 justify-center",
          isInlineOnMobile
            ? "col-start-2 row-start-1 shrink-0"
            : "col-span-2 row-start-2 sm:col-span-1 sm:col-start-2 sm:row-start-1",
        )}
      >
        {center}
      </div>
      <div
        className={cn(
          "row-start-1 min-w-0 sm:col-start-3",
          isInlineOnMobile ? "col-start-3" : "col-start-2",
        )}
      >
        <TeamBadge
          team={awayTeam}
          align="right"
          compactOnMobile={isInlineOnMobile}
          label="Fora"
        />
      </div>
    </div>
  );
}
