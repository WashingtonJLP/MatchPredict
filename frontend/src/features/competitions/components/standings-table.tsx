import { Info } from "lucide-react";

import { CompetitionLogo } from "@/features/competitions/components/competition-logo";
import {
  formatStandingValue,
  getStandingZoneVisual,
  type StandingZoneKind,
} from "@/features/competitions/competition-view";
import { cn } from "@/lib/utils";
import type { StandingSection } from "@/types/competition";

type StandingsTableProps = {
  section: StandingSection;
  showTitle: boolean;
};

export function StandingsTable({ section, showTitle }: StandingsTableProps) {
  const zones = uniqueZones(section);

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm shadow-primary/5">
      {showTitle ? (
        <header className="border-b border-border bg-secondary/50 px-4 py-3 sm:px-5">
          <h3 className="text-lg font-extrabold text-card-foreground">
            {section.name}
          </h3>
        </header>
      ) : null}
      <div className="w-full">
        <table className="w-full table-fixed border-collapse text-sm sm:table-auto">
          <caption className="sr-only">Classificação de {section.name}</caption>
          <thead className="bg-muted/60 text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
            <tr>
              <th
                scope="col"
                className="w-8 px-1 py-3 text-center sm:w-14 sm:px-3"
              >
                POS
              </th>
              <th
                scope="col"
                className="overflow-hidden px-1 py-3 text-left sm:px-3"
              >
                Time
              </th>
              <StatHeading label="J" />
              <StatHeading label="V" optional />
              <StatHeading label="E" optional />
              <StatHeading label="D" optional />
              <StatHeading label="GP" optional />
              <StatHeading label="GC" optional />
              <StatHeading label="SG" />
              <th
                scope="col"
                className="w-9 px-0.5 py-3 text-center text-foreground sm:w-16 sm:px-3"
              >
                PTS
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {section.entries.map((entry) => {
              const zone = entry.zone
                ? getStandingZoneVisual(entry.zone.description)
                : null;

              return (
                <tr key={entry.team.id} className="relative hover:bg-muted/35">
                  <td className="relative w-8 px-1 py-3 text-center font-extrabold tabular-nums text-muted-foreground sm:w-14 sm:px-3">
                    {zone ? (
                      <span
                        className={cn(
                          "absolute inset-y-2 left-0 w-1 rounded-r-full",
                          zoneStyles[zone.kind],
                        )}
                        title={zone.label}
                        aria-label={zone.label}
                      />
                    ) : null}
                    {entry.position}
                  </td>
                  <th
                    scope="row"
                    className="min-w-0 overflow-hidden px-1 py-2.5 text-left sm:px-3"
                  >
                    <span className="flex min-w-0 items-center gap-1 sm:gap-3">
                      <CompetitionLogo
                        src={entry.team.logo}
                        name={entry.team.name}
                        className="size-5 rounded-md p-0.5 sm:size-8"
                      />
                      <span className="line-clamp-2 min-w-0 flex-1 overflow-hidden text-xs font-bold leading-4 text-card-foreground [overflow-wrap:normal] [word-break:normal] sm:text-sm sm:leading-5">
                        {entry.team.name}
                      </span>
                    </span>
                  </th>
                  <StatCell value={entry.played} />
                  <StatCell value={entry.wins} optional />
                  <StatCell value={entry.draws} optional />
                  <StatCell value={entry.losses} optional />
                  <StatCell value={entry.goalsFor} optional />
                  <StatCell value={entry.goalsAgainst} optional />
                  <StatCell value={entry.goalDifference} />
                  <td className="w-9 px-0.5 py-3 text-center text-base font-extrabold tabular-nums text-primary sm:w-16 sm:px-3">
                    {formatStandingValue(entry.points)}
                    {entry.deductions > 0 ? (
                      <span
                        className="ml-0.5 text-xs text-destructive"
                        title={`${entry.deductions} ponto(s) deduzido(s)`}
                      >
                        *
                      </span>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {zones.length > 0 ? (
        <footer className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border bg-muted/30 px-4 py-3 text-xs font-semibold text-muted-foreground">
          <span className="inline-flex basis-full items-center gap-1.5 sm:basis-auto">
            <Info className="size-3.5" aria-hidden /> Zonas informadas pela
            ESPN:
          </span>
          {zones.map((zone) => (
            <span
              key={zone.source}
              className="inline-flex items-center gap-1.5"
            >
              <span
                className={cn("size-2 rounded-full", zoneStyles[zone.kind])}
                aria-hidden
              />
              {zone.label}
            </span>
          ))}
        </footer>
      ) : null}
    </section>
  );
}

function StatHeading({
  label,
  optional = false,
}: {
  label: string;
  optional?: boolean;
}) {
  return (
    <th
      scope="col"
      className={`${optional ? "hidden md:table-cell" : "table-cell"} w-7 px-0.5 py-3 text-center sm:w-12 sm:px-2`}
    >
      {label}
    </th>
  );
}

function StatCell({
  value,
  optional = false,
}: {
  value: number | null;
  optional?: boolean;
}) {
  return (
    <td
      className={`${optional ? "hidden md:table-cell" : "table-cell"} w-7 px-0.5 py-3 text-center font-semibold tabular-nums text-muted-foreground sm:w-12 sm:px-2`}
    >
      {formatStandingValue(value)}
    </td>
  );
}

function uniqueZones(section: StandingSection) {
  return [
    ...new Map(
      section.entries.flatMap((entry) => {
        if (!entry.zone) {
          return [];
        }

        const visual = getStandingZoneVisual(entry.zone.description);

        return [
          [
            entry.zone.description,
            { ...visual, source: entry.zone.description },
          ] as const,
        ];
      }),
    ).values(),
  ];
}

const zoneStyles: Record<StandingZoneKind, string> = {
  champions: "bg-accent",
  "champions-qualifying": "bg-emerald-400",
  europa: "bg-sky-500",
  conference: "bg-cyan-600",
  playoff: "bg-indigo-400",
  "relegation-playoff": "bg-amber-500",
  relegation: "bg-destructive",
  eliminated: "bg-rose-600",
  other: "bg-slate-400",
};
