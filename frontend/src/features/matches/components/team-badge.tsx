import { TeamLogo } from "@/features/matches/components/team-logo";
import type { Team } from "@/types/prediction";

type TeamBadgeProps = {
  team: Pick<Team, "name" | "logo">;
  align?: "left" | "right";
};

export function TeamBadge({ team, align = "left" }: TeamBadgeProps) {
  return (
    <div
      className={`flex min-w-0 items-center gap-2 sm:gap-3 ${
        align === "right" ? "flex-row-reverse text-right" : ""
      }`}
    >
      <TeamLogo team={team} />
      <span className="truncate text-sm font-semibold text-foreground sm:text-base">
        {team.name}
      </span>
    </div>
  );
}
