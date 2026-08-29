import type { Team } from "@/types/prediction";

type TeamLogoProps = {
  team: Pick<Team, "name" | "logo">;
  size?: "sm" | "md";
};

const sizes = {
  sm: {
    container: "size-9 rounded-xl",
    image: "size-6",
    fallback: "text-xs",
  },
  md: {
    container: "size-14 rounded-2xl sm:size-16",
    image: "size-10 sm:size-12",
    fallback: "text-base",
  },
};

export function TeamLogo({ team, size = "md" }: TeamLogoProps) {
  const sizeClasses = sizes[size];

  return (
    <span
      className={`${sizeClasses.container} flex shrink-0 items-center justify-center border border-border bg-background shadow-sm`}
    >
      {team.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={team.logo}
          alt={team.name}
          className={`${sizeClasses.image} object-contain`}
        />
      ) : (
        <span className={`${sizeClasses.fallback} font-bold text-muted-foreground`}>
          {team.name.slice(0, 2).toUpperCase()}
        </span>
      )}
    </span>
  );
}
