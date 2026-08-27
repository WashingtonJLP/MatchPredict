import { Minus, Plus } from "lucide-react";

import { TeamLogo } from "@/features/matches/components/team-logo";
import type { Team } from "@/types/prediction";

type ScoreInputProps = {
  team: Pick<Team, "name" | "logo">;
  value: number;
  onChange: (value: number) => void;
};

export function ScoreInput({ team, value, onChange }: ScoreInputProps) {
  function updateValue(nextValue: number) {
    onChange(Math.max(0, nextValue));
  }

  return (
    <div className="min-w-0 rounded-2xl border border-border bg-background p-3">
      <div className="flex min-w-0 items-center gap-3">
        <TeamLogo team={team} />
        <div className="min-w-0 flex-1">
          <span className="block text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
            Placar
          </span>
          <span className="block truncate text-base font-extrabold leading-6 text-foreground">
            {team.name}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label={`Diminuir placar de ${team.name}`}
          className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-40"
          onClick={() => updateValue(value - 1)}
          disabled={value <= 0}
        >
          <Minus className="size-4" aria-hidden />
        </button>
        <input
          type="number"
          min={0}
          aria-label={`Placar de ${team.name}`}
          value={value}
          onChange={(event) => updateValue(Number(event.target.value))}
          className="h-11 min-w-0 flex-1 rounded-xl border border-input bg-card px-3 text-center text-2xl font-extrabold leading-none text-foreground outline-none transition tabular-nums hover:border-border focus:border-ring focus:ring-4 focus:ring-ring/15"
        />
        <button
          type="button"
          aria-label={`Aumentar placar de ${team.name}`}
          className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          onClick={() => updateValue(value + 1)}
        >
          <Plus className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
