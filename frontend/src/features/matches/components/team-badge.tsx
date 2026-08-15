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
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background sm:size-11">
        {team.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={team.logo}
            alt={team.name}
            className="size-7 object-contain"
          />
        ) : (
          <span className="text-sm font-bold text-muted-foreground">
            {team.name.slice(0, 2).toUpperCase()}
          </span>
        )}
      </span>
      <span className="truncate text-sm font-semibold text-foreground sm:text-base">
        {team.name}
      </span>
    </div>
  );
}
