import type { Team } from "@/types/prediction";

type TeamLogoProps = {
  team: Pick<Team, "name" | "logo">;
};

export function TeamLogo({ team }: TeamLogoProps) {
  return (
    <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-background shadow-sm sm:size-16">
      {team.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={team.logo} alt={team.name} className="size-10 object-contain sm:size-12" />
      ) : (
        <span className="text-base font-bold text-muted-foreground">
          {team.name.slice(0, 2).toUpperCase()}
        </span>
      )}
    </span>
  );
}
