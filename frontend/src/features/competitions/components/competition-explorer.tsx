"use client";

import { Select } from "@base-ui/react/select";
import { Check, ChevronDown, ChevronUp, Globe2, MapPin } from "lucide-react";

import { CompetitionLogo } from "@/features/competitions/components/competition-logo";
import { cn } from "@/lib/utils";
import type { FootballCompetition, FootballRegion } from "@/types/competition";

type CompetitionExplorerProps = {
  regions: FootballRegion[];
  competitions: FootballCompetition[];
  selectedCompetition: FootballCompetition;
  selectedRegionId: string;
  onRegionChange: (regionId: string) => void;
  onCompetitionChange: (competitionId: string) => void;
};

export function CompetitionExplorer({
  regions,
  competitions,
  selectedCompetition,
  selectedRegionId,
  onRegionChange,
  onCompetitionChange,
}: CompetitionExplorerProps) {
  return (
    <section
      className="overflow-hidden bg-primary text-primary-foreground"
      aria-labelledby="competitions-heading"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-lg shadow-accent/20">
              <Globe2 className="size-5" aria-hidden />
            </span>
            <h1
              id="competitions-heading"
              className="text-4xl font-extrabold leading-tight sm:text-5xl"
            >
              Competições
            </h1>
          </div>
          <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-primary-foreground/70 sm:text-lg">
            Acompanhe classificações, grupos e mata-mata dos principais
            campeonatos.
          </p>

          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.7fr)] lg:items-end">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wide text-primary-foreground/60">
                Explore por região
              </p>
              <div className="mt-2 flex flex-wrap gap-2" role="list">
                {regions.map((region) => {
                  const isSelected = region.id === selectedRegionId;

                  return (
                    <button
                      key={region.id}
                      type="button"
                      className={cn(
                        "inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl border px-2.5 text-xs font-bold transition focus-visible:ring-3 focus-visible:ring-accent/60 sm:min-h-11 sm:gap-2 sm:px-3 sm:text-sm",
                        isSelected
                          ? "border-accent bg-accent text-accent-foreground shadow-lg shadow-accent/20"
                          : "border-primary-foreground/15 bg-primary-foreground/5 text-primary-foreground/80 hover:border-primary-foreground/30 hover:bg-primary-foreground/10",
                      )}
                      aria-pressed={isSelected}
                      onClick={() => onRegionChange(region.id)}
                    >
                      <MapPin className="size-4" aria-hidden />
                      {region.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="min-w-0 lg:w-full lg:max-w-[26rem] lg:justify-self-end">
              <Select.Root
                value={selectedCompetition.id}
                onValueChange={(competitionId) => {
                  if (competitionId) {
                    onCompetitionChange(competitionId);
                  }
                }}
              >
                <Select.Label className="sr-only">
                  Escolha uma competição
                </Select.Label>
                <Select.Trigger className="group flex min-h-16 w-full min-w-0 items-center gap-3 rounded-2xl border border-primary-foreground/20 bg-primary-foreground/[0.06] px-3 py-2.5 text-left text-primary-foreground shadow-sm transition-[border-color,background-color,box-shadow] hover:border-primary-foreground/35 hover:bg-primary-foreground/[0.09] focus-visible:border-accent focus-visible:ring-4 focus-visible:ring-accent/20 data-popup-open:border-accent/70 data-popup-open:bg-primary-foreground/[0.09]">
                  <span aria-hidden="true" className="shrink-0">
                    <CompetitionLogo
                      src={selectedCompetition.logo}
                      name={selectedCompetition.name}
                      className="size-10 rounded-xl p-1.5 shadow-sm ring-1 ring-primary-foreground/15"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.6875rem] font-extrabold uppercase leading-4 tracking-[0.08em] text-primary-foreground/60">
                      Competição
                    </span>
                    <Select.Value>
                      {() => (
                        <span className="mt-0.5 block truncate text-base font-extrabold leading-5">
                          {selectedCompetition.name}
                        </span>
                      )}
                    </Select.Value>
                  </span>
                  <Select.Icon className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/[0.07] text-primary-foreground/70 transition-transform duration-200 data-popup-open:rotate-180">
                    <ChevronDown className="size-4" aria-hidden />
                  </Select.Icon>
                </Select.Trigger>

                <Select.Portal>
                  <Select.Positioner
                    align="start"
                    alignItemWithTrigger={false}
                    collisionPadding={12}
                    sideOffset={8}
                    className="z-50 w-[var(--anchor-width)] max-w-[calc(100vw-1.5rem)] outline-none"
                  >
                    <Select.Popup className="origin-[var(--transform-origin)] overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-xl shadow-primary/15 transition-[transform,opacity] duration-150 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0">
                      <Select.ScrollUpArrow className="flex h-7 items-center justify-center border-b border-border bg-popover text-muted-foreground">
                        <ChevronUp className="size-4" aria-hidden />
                      </Select.ScrollUpArrow>
                      <Select.List className="max-h-[calc(min(var(--available-height),24rem)-3.5rem)] overflow-y-auto overscroll-contain p-1.5 scroll-py-2">
                        {competitions.map((competition) => (
                          <Select.Item
                            key={competition.id}
                            value={competition.id}
                            label={competition.name}
                            className="grid min-h-14 cursor-default grid-cols-[2.5rem_minmax(0,1fr)_1.25rem] items-center gap-3 rounded-xl px-2.5 py-2 text-sm text-popover-foreground outline-none transition-colors data-highlighted:bg-muted data-selected:bg-accent/10 data-selected:font-extrabold"
                          >
                            <span aria-hidden="true" className="shrink-0">
                              <CompetitionLogo
                                src={competition.logo}
                                name={competition.name}
                                className="size-10 rounded-lg border border-border p-1.5 shadow-sm"
                              />
                            </span>
                            <Select.ItemText className="line-clamp-2 min-w-0 leading-5 [overflow-wrap:normal] [word-break:normal]">
                              {competition.name}
                            </Select.ItemText>
                            <Select.ItemIndicator className="flex size-5 items-center justify-center rounded-full bg-accent text-accent-foreground">
                              <Check className="size-3.5" aria-hidden />
                            </Select.ItemIndicator>
                          </Select.Item>
                        ))}
                      </Select.List>
                      <Select.ScrollDownArrow className="flex h-7 items-center justify-center border-t border-border bg-popover text-muted-foreground">
                        <ChevronDown className="size-4" aria-hidden />
                      </Select.ScrollDownArrow>
                    </Select.Popup>
                  </Select.Positioner>
                </Select.Portal>
              </Select.Root>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-primary-foreground/10 bg-primary-foreground/[0.035]">
        <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
          <div
            className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 lg:grid-cols-6"
            aria-label="Todas as competições"
          >
            {competitions.map((competition) => {
              const isSelected = competition.id === selectedCompetition.id;

              return (
                <button
                  key={competition.id}
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={`Selecionar ${competition.name}`}
                  className={cn(
                    "relative flex min-h-16 min-w-36 items-center gap-2 overflow-hidden rounded-xl border px-2.5 py-2 text-left transition focus-visible:ring-3 focus-visible:ring-accent/60 sm:min-w-0",
                    isSelected
                      ? "border-accent bg-accent text-accent-foreground shadow-lg shadow-accent/15"
                      : "border-primary-foreground/10 bg-primary-foreground/5 text-primary-foreground hover:border-primary-foreground/25 hover:bg-primary-foreground/10",
                  )}
                  onClick={() => onCompetitionChange(competition.id)}
                >
                  <CompetitionLogo
                    src={competition.logo}
                    name={competition.name}
                    className="size-9 rounded-lg p-1"
                  />
                  <span className="line-clamp-2 min-w-0 flex-1 overflow-hidden text-xs font-extrabold leading-4 [overflow-wrap:normal] [word-break:normal]">
                    {competition.shortName}
                  </span>
                  {isSelected ? (
                    <Check
                      className="absolute right-1.5 top-1.5 size-3"
                      aria-hidden
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
