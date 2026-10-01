import { TeamLogo } from "@/features/matches/components/team-logo";
import type { Team } from "@/types/prediction";

type TeamBadgeProps = {
  team: Pick<Team, "name" | "logo">;
  align?: "left" | "right";
  compactOnMobile?: boolean;
  label?: string;
};

export function TeamBadge({
  team,
  align = "left",
  compactOnMobile = false,
  label,
}: TeamBadgeProps) {
  return (
    <div
      className={`flex min-w-0 flex-col items-center gap-2 text-center ${
        align === "right"
          ? compactOnMobile
            ? "sm:text-right"
            : "text-right"
          : ""
      }`}
    >
      <TeamLogo team={team} />
      <div className="w-full min-w-0">
        {label ? (
          <span className="block text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
        ) : null}
        <span
          className={`block min-h-10 whitespace-normal break-normal text-balance font-extrabold leading-5 text-foreground sm:min-h-12 sm:text-lg sm:leading-6 sm:tracking-normal ${
            compactOnMobile ? "text-sm tracking-tight" : "text-base"
          }`}
          title={team.name}
        >
          {team.name}
        </span>
      </div>
    </div>
  );
}
