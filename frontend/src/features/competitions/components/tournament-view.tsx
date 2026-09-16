"use client";

import { Check, CircleHelp, GitBranch, ShieldQuestion } from "lucide-react";
import { useEffect, useRef } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { CompetitionLogo } from "@/features/competitions/components/competition-logo";
import {
  formatTournamentOutcome,
  formatTournamentScore,
  formatTournamentStatus,
  getKnockoutPhases,
  getRelevantKnockoutPhase,
  getTeamScore,
  normalizeTournamentLabel,
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
  NOT_PUBLISHED: "Fase ainda não publicada pela ESPN.",
  TBD: "Confrontos publicados; participantes ainda serão definidos.",
  AVAILABLE: "Confrontos disponíveis.",
  UNAVAILABLE: "Detalhes temporariamente indisponíveis.",
};

export function TournamentView({ phases, reason }: TournamentViewProps) {
  const knockoutPhases = getKnockoutPhases(phases);
  const relevantPhase = getRelevantKnockoutPhase(knockoutPhases);
  const phaseContainerRef = useRef<HTMLDivElement>(null);
  const autoFocusedRef = useRef<string | null>(null);

  useEffect(() => {
    const container = phaseContainerRef.current;

    if (
      !container ||
      !relevantPhase ||
      autoFocusedRef.current === relevantPhase.id
    ) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const target = container.querySelector<HTMLElement>(
        `[data-phase-id="${CSS.escape(relevantPhase.id)}"]`,
      );

      if (!target) {
        return;
      }

      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const behavior = reducedMotion ? "auto" : "smooth";

      if (window.matchMedia("(min-width: 1024px)").matches) {
        const centeredPosition =
          target.offsetLeft - (container.clientWidth - target.clientWidth) / 2;
        const maximumScroll = container.scrollWidth - container.clientWidth;

        container.scrollTo({
          left: Math.max(0, Math.min(centeredPosition, maximumScroll)),
          behavior,
        });
      } else {
        const topInset = [...document.querySelectorAll<HTMLElement>("header")]
          .filter((element) => {
            const position = window.getComputedStyle(element).position;
            const bounds = element.getBoundingClientRect();

            return (
              (position === "fixed" || position === "sticky") &&
              bounds.top <= 0 &&
              bounds.bottom > 0
            );
          })
          .reduce(
            (maximum, element) =>
              Math.max(maximum, element.getBoundingClientRect().bottom),
            0,
          );
        const breathingRoom = Number.parseFloat(
          window.getComputedStyle(document.documentElement).fontSize,
        );

        window.scrollTo({
          top:
            window.scrollY +
            target.getBoundingClientRect().top -
            topInset -
            breathingRoom,
          behavior,
        });
      }

      autoFocusedRef.current = relevantPhase.id;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [relevantPhase]);

  if (knockoutPhases.length === 0) {
    return (
      <EmptyState
        icon={GitBranch}
        title="Mata-mata ainda não publicado"
        description={
          reason ??
          "As fases eliminatórias aparecerão aqui assim que forem publicadas pela ESPN."
        }
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-start gap-2 rounded-xl border border-border bg-muted/45 px-4 py-3 text-sm font-semibold leading-6 text-muted-foreground">
        <CircleHelp
          className="mt-0.5 size-4 shrink-0 text-accent"
          aria-hidden
        />
        Mata-mata apresentado por fases. Não são exibidas conexões entre
        confrontos porque a fonte não publica esse vínculo.
      </div>
      <div
        ref={phaseContainerRef}
        data-tournament-phases
        className="grid scroll-mt-4 gap-5 lg:flex lg:items-start lg:gap-4 lg:overflow-x-auto lg:pb-3"
      >
        {knockoutPhases.map((phase) => (
          <section
            key={phase.id}
            data-phase-id={phase.id}
            className={cn(
              "min-w-0 scroll-mt-4 rounded-2xl border bg-secondary/35 p-3 lg:w-60 lg:min-w-60",
              phase.id === relevantPhase?.id
                ? "border-accent/70 ring-2 ring-accent/15"
                : "border-border",
            )}
            aria-labelledby={`phase-${phase.id}`}
            aria-current={phase.id === relevantPhase?.id ? "step" : undefined}
          >
            <header className="px-1 pb-3">
              <div className="flex items-start justify-between gap-2">
                <h3
                  id={`phase-${phase.id}`}
                  className="text-base font-extrabold text-card-foreground"
                >
                  {phase.name}
                </h3>
                {phase.id === relevantPhase?.id ? (
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
                  <TournamentTieCard
                    key={tie.id}
                    tie={tie}
                    phaseName={phase.name}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-card px-4 py-6 text-center">
                <ShieldQuestion
                  className="mx-auto size-6 text-muted-foreground"
                  aria-hidden
                />
                <p className="mt-2 text-sm font-bold text-card-foreground">
                  {phase.state === "NOT_PUBLISHED"
                    ? "Ainda não publicado"
                    : "Sem confrontos disponíveis"}
                </p>
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
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
    <article className="overflow-hidden rounded-xl border border-border bg-card shadow-sm shadow-primary/5">
      {title ? (
        <p className="border-b border-border bg-muted/50 px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
          {title}
        </p>
      ) : null}
      <div className="divide-y divide-border/70 px-3">
        {teams.slice(0, 2).map((team) => {
          const aggregate = getTeamScore(tie.aggregate, team.id);
          const penalties = getTeamScore(tie.penalties, team.id);
          const isWinner = tie.winnerTeamId === team.id;

          return (
            <div
              key={team.id}
              className="flex min-h-11 items-center gap-2 py-2"
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
              {aggregate !== null ? (
                <span
                  className="min-w-5 text-right text-base font-extrabold tabular-nums text-primary"
                  title="Placar agregado"
                >
                  {aggregate}
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
          {score}
        </span>
      ) : (
        <span className="shrink-0">{formatTournamentStatus(leg.status)}</span>
      )}
    </div>
  );
}

function formatLegDate(value: string | null) {
  if (!value) {
    return "Data a definir";
  }

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
