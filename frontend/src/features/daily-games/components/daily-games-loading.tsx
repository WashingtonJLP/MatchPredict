export function DailyGamesLoading() {
  return (
    <div className="space-y-4" aria-label="Carregando jogos">
      {Array.from({ length: 3 }).map((_, competitionIndex) => (
        <section
          key={competitionIndex}
          className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border"
        >
          <div className="flex items-stretch gap-3 border-b border-border bg-muted/50 px-3.5 py-3 sm:px-4">
            <div className="w-1 shrink-0 rounded-full bg-accent/60" />
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="size-9 rounded-xl bg-card ring-1 ring-border motion-safe:animate-pulse" />
              <div className="min-w-0 flex-1 space-y-2">
              <div className="h-5 w-48 max-w-full rounded bg-background motion-safe:animate-pulse" />
              <div className="h-3 w-16 rounded bg-background motion-safe:animate-pulse" />
              </div>
            </div>
          </div>

          <div className="divide-y divide-border/80">
            {Array.from({ length: 4 }).map((_, gameIndex) => (
              <div
                key={gameIndex}
                className="grid min-h-[4.75rem] grid-cols-[minmax(0,1fr)_4.5rem_minmax(0,1fr)] items-center gap-1.5 px-2.5 py-2.5 sm:min-h-[4.25rem] sm:grid-cols-[minmax(0,1fr)_7.25rem_minmax(0,1fr)] sm:gap-4 sm:px-4"
              >
                <SkeletonTeam />
                <div className="mx-auto h-10 w-16 rounded-xl bg-muted motion-safe:animate-pulse sm:w-20" />
                <SkeletonTeam align="right" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function SkeletonTeam({ align = "left" }: { align?: "left" | "right" }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1 text-center sm:flex-row sm:gap-3 sm:text-left">
      <div className="size-8 shrink-0 rounded-xl bg-muted motion-safe:animate-pulse sm:size-10" />
      <div
        className={
          align === "right"
            ? "space-y-1.5 sm:text-right"
            : "space-y-1.5 sm:text-left"
        }
      >
        <div className="h-3 w-20 rounded bg-muted motion-safe:animate-pulse sm:h-3.5 sm:w-32" />
        <div className="h-3 w-16 rounded bg-muted motion-safe:animate-pulse sm:hidden" />
        <div className="hidden h-3 w-10 rounded bg-muted motion-safe:animate-pulse sm:block" />
      </div>
    </div>
  );
}
