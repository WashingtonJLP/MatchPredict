import type { Team } from "@/types/prediction";

type TeamLogoProps = {
  team: Pick<Team, "name" | "logo">;
};

export function TeamLogo({ team }: TeamLogoProps) {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background sm:size-11">
      {team.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={team.logo} alt={team.name} className="size-7 object-contain" />
      ) : (
        <span className="text-sm font-bold text-muted-foreground">
          {team.name.slice(0, 2).toUpperCase()}
        </span>
      )}
    </span>
  );
}
