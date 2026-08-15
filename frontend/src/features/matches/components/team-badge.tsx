import { TeamLogo } from "@/features/matches/components/team-logo";
import type { Team } from "@/types/prediction";

type TeamBadgeProps = {
  team: Pick<Team, "name" | "logo">;
  align?: "left" | "right";
};

export function TeamBadge({ team, align = "left" }: TeamBadgeProps) {
  return (
    <div
      className={`flex min-w-0 flex-col items-center gap-2 text-center sm:gap-3 ${
        align === "right" ? "text-right" : ""
      }`}
    >
      <TeamLogo team={team} />
      <span className="line-clamp-2 min-h-10 text-base font-extrabold leading-5 text-foreground sm:text-lg sm:leading-6">
        {team.name}
      </span>
    </div>
  );
}
