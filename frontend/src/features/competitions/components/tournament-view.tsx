"use client";

import { Check, CircleHelp, GitBranch, ShieldQuestion } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { CompetitionLogo } from "@/features/competitions/components/competition-logo";
import {
  formatTournamentOutcome,
  formatTournamentScore,
  formatTournamentStatus,
  getRelevantKnockoutPhase,
  getTeamScore,
  normalizeTournamentLabel,
  resolveTournamentPhaseSelection,
  getTournamentPresentationPhases,
} from "@/features/competitions/competition-view";
import { cn } from "@/lib/utils";
import type {
  CompetitionTeam,
  TournamentLeg,
  TournamentPhase,
  TournamentTie,
} from "@/types/competition";

type TournamentViewProps = {
  phases: TournamentPhase[];
  reason: string | null;
};

const phaseStateCopy: Record<TournamentPhase["state"], string> = {
  NOT_PUBLISHED: "Fase ainda não publicada.",
  TBD: "Participantes ainda serão definidos.",
  AVAILABLE: "Confrontos disponíveis.",
  UNAVAILABLE: "Detalhes temporariamente indisponíveis.",
};

export function TournamentView({ phases, reason }: TournamentViewProps) {
  const knockoutPhases = getTournamentPresentationPhases(phases);
  const relevantPhase = getRelevantKnockoutPhase(knockoutPhases);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const selectedPhase = resolveTournamentPhaseSelection(
    selectedPhaseId,
    knockoutPhases,
    relevantPhase?.id,
  );

  if (knockoutPhases.length === 0) {
    return (
      <EmptyState
        icon={GitBranch}
        title="Mata-mata ainda não publicado"
        description={
          reason ??
          "As fases eliminatórias aparecerão aqui quando forem publicadas."
        }
      />
    );
  }

  return (
    <div>
      <div className="mb-5 flex items-start gap-2 rounded-xl bg-muted/55 px-4 py-3 text-sm font-semibold leading-6 text-muted-foreground">
        <CircleHelp
          className="mt-0.5 size-4 shrink-0 text-accent"
          aria-hidden
        />
        Mata-mata por fases, sem conexões que a fonte não publica.
      </div>

      <div className="lg:hidden">
        <div
          className="mb-5 flex flex-wrap gap-2"
          role="tablist"
          aria-label="Selecionar fase do mata-mata"
        >
          {knockoutPhases.map((phase) => {
            const isSelected = phase.id === selectedPhase?.id;

            return (
              <button
                key={phase.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-controls={`mobile-phase-${phase.id}`}
                className={cn(
                  "min-h-11 rounded-xl border px-3 py-2 text-sm font-extrabold transition focus-visible:ring-3 focus-visible:ring-ring/50",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/60 hover:text-card-foreground",
                )}
                onClick={() => setSelectedPhaseId(phase.id)}
              >
                {shortPhaseName(phase.name)}
              </button>
            );
          })}
        </div>

        {selectedPhase ? (
          <PhaseColumn
            phase={selectedPhase}
            current={selectedPhase.id === relevantPhase?.id}
            idPrefix="mobile"
          />
        ) : null}
      </div>

      <div
        className="hidden items-start gap-4 overflow-x-auto pb-2 lg:flex"
        data-tournament-phases
      >
        {knockoutPhases.map((phase) => (
          <PhaseColumn
            key={phase.id}
            phase={phase}
            current={phase.id === relevantPhase?.id}
            idPrefix="desktop"
          />
        ))}
      </div>
    </div>
  );
}

function PhaseColumn({
  phase,
  current,
  idPrefix,
}: {
  phase: TournamentPhase;
  current: boolean;
  idPrefix: "mobile" | "desktop";
}) {
  const headingId = `${idPrefix}-phase-heading-${phase.id}`;

  return (
    <section
      id={`${idPrefix}-phase-${phase.id}`}
      data-phase-id={phase.id}
      role={idPrefix === "mobile" ? "tabpanel" : undefined}
      className={cn(
        "min-w-0 border-t-2 pt-3 lg:min-w-60 lg:flex-1",
        current ? "border-accent" : "border-border",
      )}
      aria-labelledby={headingId}
      aria-current={current ? "step" : undefined}
    >
      <header className="mb-3 min-h-16 px-1">
        <div className="flex items-start justify-between gap-2">
          <h3
            id={headingId}
            className="text-base font-extrabold text-card-foreground"
          >
            {phase.name}
          </h3>
          {current ? (
            <span className="shrink-0 rounded-full bg-accent/15 px-2 py-1 text-xs font-extrabold uppercase tracking-wide text-accent-foreground dark:text-accent">
              Em foco
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-xs font-semibold leading-5 text-muted-foreground">
          {phaseStateCopy[phase.state]}
        </p>
      </header>

      {phase.ties.length > 0 ? (
        <div className="space-y-3">
          {phase.ties.map((tie) => (
            <TournamentTieCard key={tie.id} tie={tie} phaseName={phase.name} />
          ))}
        </div>
      ) : (
        <div className="border-t border-dashed border-border px-4 py-6 text-center">
          <ShieldQuestion
            className="mx-auto size-6 text-muted-foreground"
            aria-hidden
          />
          <p className="mt-2 text-sm font-bold text-muted-foreground">
            {phase.state === "NOT_PUBLISHED"
              ? "Ainda não publicado"
              : "Sem confrontos disponíveis"}
          </p>
        </div>
      )}
    </section>
  );
}

function TournamentTieCard({
  tie,
  phaseName,
}: {
  tie: TournamentTie;
  phaseName: string;
}) {
  const teams =
    tie.teams.length > 0 ? tie.teams : [tbdTeam("home"), tbdTeam("away")];
  const normalizedTitle = normalizeTournamentLabel(tie.title);
  const title =
    normalizedTitle &&
    normalizedTitle !== phaseName &&
    normalizedTitle !== tie.title
      ? normalizedTitle
      : null;
  const outcome = formatTournamentOutcome(tie);

  return (
    <article className="overflow-hidden rounded-xl bg-card shadow-sm shadow-primary/10 ring-1 ring-border">
      {title ? (
        <p className="border-b border-border bg-muted/50 px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
          {title}
        </p>
      ) : null}
      <div className="divide-y divide-border/70 px-3">
        {teams.slice(0, 2).map((team) => {
          const primaryScore = getPrimaryTeamScore(tie, team.id);
          const penalties = getTeamScore(tie.penalties, team.id);
          const isWinner = tie.winnerTeamId === team.id;

          return (
            <div
              key={team.id}
              className="flex min-h-12 items-center gap-2 py-2"
            >
              <CompetitionLogo
                src={team.logo}
                name={team.name}
                className="size-7 rounded-md p-0.5"
              />
              <span
                className={cn(
                  "line-clamp-2 min-w-0 flex-1 text-sm font-bold leading-4 [overflow-wrap:normal] [word-break:normal]",
                  team.isTbd ? "text-muted-foreground" : "text-card-foreground",
                )}
              >
                {team.isTbd ? "A definir" : team.name}
              </span>
              {isWinner ? (
                <Check
                  className="size-4 shrink-0 text-accent"
                  aria-label="Classificado"
                />
              ) : null}
              {primaryScore !== null ? (
                <span
                  className="min-w-6 text-right text-lg font-extrabold tabular-nums text-primary"
                  title={tie.aggregate ? "Placar agregado" : "Placar"}
                >
                  {primaryScore}
                </span>
              ) : null}
              {penalties !== null ? (
                <span
                  className="text-xs font-bold tabular-nums text-muted-foreground"
                  title="Pênaltis"
                >
                  ({penalties})
                </span>
              ) : null}
            </div>
          );
        })}
      </div>

      {tie.legs.length > 0 ? (
        <div className="border-t border-border bg-muted/30 px-3 py-2">
          {tie.legs.map((leg) => (
            <LegSummary key={leg.id} leg={leg} />
          ))}
        </div>
      ) : null}

      {outcome ? (
        <p className="border-t border-border px-3 py-2 text-xs font-semibold leading-5 text-muted-foreground">
          {outcome}
        </p>
      ) : null}
    </article>
  );
}

function LegSummary({ leg }: { leg: TournamentLeg }) {
  const score = formatTournamentScore(leg.score);

  return (
    <div className="flex min-h-8 items-center gap-2 text-xs font-semibold text-muted-foreground">
      <span className="w-10 shrink-0">{leg.legLabel ?? "Jogo"}</span>
      <span className="min-w-0 flex-1 truncate">
        {formatLegDate(leg.kickoff)}
      </span>
      {score ? (
        <span className="shrink-0 font-extrabold tabular-nums text-card-foreground">
          <span className="mr-2 text-muted-foreground" aria-hidden>
            ·
          </span>
          {score}
        </span>
      ) : (
        <span className="shrink-0">{formatTournamentStatus(leg.status)}</span>
      )}
    </div>
  );
}

function getPrimaryTeamScore(tie: TournamentTie, teamId: string) {
  const aggregate = getTeamScore(tie.aggregate, teamId);

  if (aggregate !== null) return aggregate;
  if (tie.legs.length !== 1) return null;

  const leg = tie.legs[0];

  if (leg.homeTeam?.id === teamId) return leg.score.home;
  if (leg.awayTeam?.id === teamId) return leg.score.away;

  return null;
}

function shortPhaseName(name: string) {
  return name
    .replace(/ de final$/i, "")
    .replace(/^Playoffs do mata-mata$/i, "Playoffs");
}

function formatLegDate(value: string | null) {
  if (!value) return "Data a definir";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function tbdTeam(side: string): CompetitionTeam {
  return {
    id: `tbd-${side}`,
    name: "A definir",
    abbreviation: null,
    logo: null,
    isTbd: true,
  };
}
