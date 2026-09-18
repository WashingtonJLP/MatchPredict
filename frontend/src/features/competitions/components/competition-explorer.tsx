"use client";

import { Check, Globe2, MapPin } from "lucide-react";

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
            <label className="block">
              <span className="text-xs font-extrabold uppercase tracking-wide text-primary-foreground/60">
                Escolha uma competição
              </span>
              <select
                value={selectedCompetition.id}
                className="mt-2 h-12 w-full rounded-xl border border-primary-foreground/20 bg-primary px-4 text-base font-bold text-primary-foreground shadow-sm outline-none transition hover:border-primary-foreground/40 focus:border-accent focus:ring-4 focus:ring-accent/20"
                onChange={(event) => onCompetitionChange(event.target.value)}
              >
                {competitions.map((competition) => (
                  <option
                    key={competition.id}
                    value={competition.id}
                    className="bg-primary"
                  >
                    {competition.name}
                  </option>
                ))}
              </select>
            </label>
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
