import { Trophy } from "lucide-react";

import { MatchStatusBadge } from "@/features/matches/components/match-status-badge";
import type { MatchFixture } from "@/types/fixture";

type MatchHeaderProps = {
  fixture: MatchFixture;
};

export function MatchHeader({ fixture }: MatchHeaderProps) {
  const competition = fixture.league ?? fixture.competition ?? "Premier League";

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Trophy className="size-4" aria-hidden />
          {competition}
        </p>
        <p className="text-sm font-medium text-muted-foreground">
          Rodada {fixture.round}
        </p>
      </div>
      <MatchStatusBadge status={fixture.status} />
    </div>
  );
}
