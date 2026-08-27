import { TeamLogo } from "@/features/matches/components/team-logo";
import type { Team } from "@/types/prediction";

type TeamBadgeProps = {
  team: Pick<Team, "name" | "logo">;
  align?: "left" | "right";
  label?: string;
};

export function TeamBadge({ team, align = "left", label }: TeamBadgeProps) {
  return (
    <div
      className={`flex min-w-0 flex-col items-center gap-2 text-center ${
        align === "right" ? "text-right" : ""
      }`}
    >
      <TeamLogo team={team} />
      <div className="w-full min-w-0">
        {label ? (
          <span className="block text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
        ) : null}
        <span className="line-clamp-2 block min-h-10 break-words text-base font-extrabold leading-5 text-foreground sm:line-clamp-none sm:min-h-0 sm:truncate sm:text-lg sm:leading-6">
          {team.name}
        </span>
      </div>
    </div>
  );
}
