import { Layers3 } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { StandingsTable } from "@/features/competitions/components/standings-table";
import type { StandingSection } from "@/types/competition";

type GroupsViewProps = {
  groups: StandingSection[];
  reason: string | null;
};

export function GroupsView({ groups, reason }: GroupsViewProps) {
  if (groups.length === 0) {
    return (
      <EmptyState
        icon={Layers3}
        title="Grupos ainda não publicados"
        description={reason ?? "A ESPN ainda não disponibilizou os participantes e as tabelas desta fase."}
      />
    );
  }

  return (
    <div className="grid items-start gap-4 xl:grid-cols-2">
      {groups.map((group) => (
        <StandingsTable key={group.id} section={group} showTitle />
      ))}
    </div>
  );
}
