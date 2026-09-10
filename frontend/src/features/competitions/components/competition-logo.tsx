import { Trophy } from "lucide-react";

import { cn } from "@/lib/utils";

type CompetitionLogoProps = {
  src: string | null;
  name: string;
  className?: string;
  imageClassName?: string;
};

export function CompetitionLogo({
  src,
  name,
  className,
  imageClassName,
}: CompetitionLogoProps) {
  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden bg-card text-accent",
        className,
      )}
    >
      <Trophy className="size-1/2" aria-hidden />
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`Escudo de ${name}`}
          className={cn("absolute inset-0 size-full object-contain", imageClassName)}
          onError={(event) => {
            event.currentTarget.hidden = true;
          }}
        />
      ) : null}
    </span>
  );
}
