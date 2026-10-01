import type { ReactNode } from "react";

import { TeamBadge } from "@/features/matches/components/team-badge";
import type { Team } from "@/types/prediction";

type MatchTeamsLayoutProps = {
  awayTeam: Pick<Team, "name" | "logo">;
  center: ReactNode;
  homeTeam: Pick<Team, "name" | "logo">;
};

export function MatchTeamsLayout({
  awayTeam,
  center,
  homeTeam,
}: MatchTeamsLayoutProps) {
  return (
    <div className="mt-5 grid grid-cols-2 items-start gap-x-4 gap-y-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center sm:gap-4">
      <div className="min-w-0">
        <TeamBadge team={homeTeam} label="Casa" />
      </div>
      <div className="col-span-2 row-start-2 flex min-w-0 justify-center sm:col-span-1 sm:col-start-2 sm:row-start-1">
        {center}
      </div>
      <div className="col-start-2 row-start-1 min-w-0 sm:col-start-3">
        <TeamBadge team={awayTeam} align="right" label="Fora" />
      </div>
    </div>
  );
}
