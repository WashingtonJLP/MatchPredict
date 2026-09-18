import type {
  FootballCompetition,
  FootballRegion,
  StandingEntry,
  StandingSection,
  StandingZone,
  StandingZoneType,
  TournamentPhase,
  TournamentScore,
  TournamentTeamScore,
  TournamentTie,
} from "../../types/competition";

export type CompetitionTabId = "games" | "standings" | "groups" | "tournament";

export type CompetitionTab = {
  id: CompetitionTabId;
  label: string;
};

export const COMPETITIONS_PAGE_IDS = [
  "eng.1",
  "bra.1",
  "bra.2",
  "uefa.champions",
  "esp.1",
  "ita.1",
  "ger.1",
  "fra.1",
] as const;

export const standingZoneIndicatorClass =
  "absolute inset-y-2 left-0 w-1 rounded-r-full";
export const standingZoneLegendDotClass = "size-2 rounded-full";
export const standingZoneColorClasses: Record<StandingZoneType, string> = {
  CONTINENTAL_PRIMARY: "bg-emerald-600",
  CONTINENTAL_PRIMARY_QUALIFYING: "bg-lime-400",
  CONTINENTAL_SECONDARY: "bg-sky-600",
  CONTINENTAL_SECONDARY_QUALIFYING: "bg-sky-300",
  CONTINENTAL_TERTIARY: "bg-violet-600",
  CONTINENTAL_TERTIARY_QUALIFYING: "bg-violet-300",
  PROMOTION: "bg-teal-600",
  PROMOTION_PLAYOFF: "bg-amber-400",
  KNOCKOUT_DIRECT: "bg-emerald-600",
  KNOCKOUT_PLAYOFF_SEEDED: "bg-sky-600",
  KNOCKOUT_PLAYOFF_UNSEEDED: "bg-amber-500",
  ELIMINATED: "bg-slate-500",
  RELEGATION_PLAYOFF: "bg-orange-500",
  RELEGATION: "bg-destructive",
  QUALIFIED: "bg-teal-600",
  OTHER: "bg-slate-400",
};

export function getCompetitionsPageCatalog(
  regions: FootballRegion[],
  competitions: FootballCompetition[],
) {
  const visibleIds = new Set<string>(COMPETITIONS_PAGE_IDS);
  const visibleCompetitions = competitions.filter((competition) =>
    visibleIds.has(competition.id),
  );
  const visibleRegionIds = new Set(
    visibleCompetitions.map((competition) => competition.regionId),
  );

  return {
    competitions: visibleCompetitions,
    regions: regions.filter((region) => visibleRegionIds.has(region.id)),
  };
}

export function removeCompetitionProviderAttribution(message: string) {
  const exactMessages: Record<string, string> = {
    "A ESPN ainda não publicou a classificação desta competição.":
      "A classificação desta competição ainda não foi publicada.",
    "A ESPN ainda não publicou a estrutura do torneio.":
      "A estrutura do torneio ainda não foi publicada.",
    "A ESPN ainda não publicou as fases desta competição.":
      "As fases desta competição ainda não foram publicadas.",
    "Referência de torneio ausente na temporada da ESPN.":
      "Referência de torneio ausente na temporada.",
    "A estrutura de fases da ESPN está temporariamente indisponível.":
      "A estrutura de fases está temporariamente indisponível.",
    "Temporada da ESPN inválida.": "Temporada inválida.",
    "Período da temporada da ESPN inválido.": "Período da temporada inválido.",
  };

  return (
    exactMessages[message] ??
    message
      .replace(/^A ESPN retornou /i, "Foram recebidos ")
      .replace(/\s+(?:da|pela) ESPN\b/gi, "")
      .replace(/\bESPN\b/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim()
  );
}

export function getCompetitionTabs(
  competition: FootballCompetition,
): CompetitionTab[] {
  const tabs: CompetitionTab[] = [{ id: "games", label: "Jogos" }];

  if (competition.capabilities.groups) {
    tabs.push({ id: "groups", label: "Grupos" });
  } else if (competition.capabilities.standings) {
    tabs.push({ id: "standings", label: "Classificação" });
  }

  if (competition.capabilities.tournament) {
    tabs.push({ id: "tournament", label: "Mata-mata" });
  }

  return tabs;
}

export function getDefaultCompetitionTab(
  competition: FootballCompetition,
): CompetitionTabId {
  if (competition.capabilities.groups) return "groups";
  if (competition.capabilities.standings) return "standings";
  if (competition.capabilities.games) return "games";

  return "tournament";
}

export function resolveCompetitionSelection(
  requestedId: string | null,
  competitions: FootballCompetition[],
) {
  return (
    competitions.find((competition) => competition.id === requestedId) ??
    competitions[0] ??
    null
  );
}

export function resolveCompetitionForRegion(
  regionId: string,
  competitions: FootballCompetition[],
  currentCompetitionId?: string,
) {
  const current = competitions.find(
    (competition) => competition.id === currentCompetitionId,
  );

  if (current?.regionId === regionId) {
    return current;
  }

  return (
    competitions.find((competition) => competition.regionId === regionId) ??
    null
  );
}

export function getTeamScore(
  scores: TournamentTeamScore[] | null,
  teamId: string,
) {
  return scores?.find((score) => score.teamId === teamId)?.value ?? null;
}

export function formatStandingValue(value: number | null) {
  return value === null ? "—" : String(value);
}

export function getStandingBoundary(entry: StandingEntry) {
  return entry.zone?.description ?? null;
}

export function getStandingZoneVisual(zone: StandingZone): {
  kind: StandingZoneType;
  label: string;
} {
  const normalized = normalizeLabel(zone.description);
  const labels: Record<StandingZoneType, string> = {
    CONTINENTAL_PRIMARY: normalized.includes("libertadores")
      ? "Libertadores — fase de grupos"
      : "Champions League",
    CONTINENTAL_PRIMARY_QUALIFYING: normalized.includes("libertadores")
      ? "Libertadores — fase preliminar"
      : "Eliminatórias da Champions League",
    CONTINENTAL_SECONDARY:
      normalized.includes("sul-americana") ||
      normalized.includes("sudamericana")
        ? "Sul-Americana"
        : "Europa League",
    CONTINENTAL_SECONDARY_QUALIFYING: "Eliminatórias da Europa League",
    CONTINENTAL_TERTIARY: "Conference League",
    CONTINENTAL_TERTIARY_QUALIFYING: "Eliminatórias da Conference League",
    PROMOTION: zone.description,
    PROMOTION_PLAYOFF: zone.description,
    KNOCKOUT_DIRECT: "Classificação direta às oitavas",
    KNOCKOUT_PLAYOFF_SEEDED: "Playoff — cabeça de chave",
    KNOCKOUT_PLAYOFF_UNSEEDED: "Playoff — não cabeça de chave",
    ELIMINATED: "Eliminado",
    RELEGATION_PLAYOFF: "Playoff contra o rebaixamento",
    RELEGATION: zone.description.startsWith("Rebaixamento")
      ? zone.description
      : "Rebaixamento",
    QUALIFIED: "Classificado",
    OTHER: zone.description,
  };

  return { kind: zone.type, label: labels[zone.type] };
}

export function getCompetitionDataState(
  applicable: boolean,
  itemCount: number,
) {
  if (!applicable) {
    return "NOT_APPLICABLE" as const;
  }

  return itemCount > 0 ? ("READY" as const) : ("EMPTY" as const);
}

export function getGroupSections(sections: StandingSection[]) {
  return sections.filter((section) => section.entries.length > 0);
}

export function getKnockoutPhases(phases: TournamentPhase[]) {
  return phases.filter((phase) => phase.kind === "KNOCKOUT");
}

export function getTournamentPresentationPhases(phases: TournamentPhase[]) {
  const knockoutPhases = getKnockoutPhases(phases);
  const mainStageSlugs = new Set([
    "round-of-16",
    "quarterfinals",
    "semifinals",
    "final",
    "finals",
  ]);
  const mainStages = knockoutPhases.filter((phase) =>
    mainStageSlugs.has(phase.slug),
  );

  return mainStages.length > 0 ? mainStages : knockoutPhases;
}

export function getRelevantKnockoutPhase(
  phases: TournamentPhase[],
  now: Date = new Date(),
) {
  const knockoutPhases = getKnockoutPhases(phases);
  const published = knockoutPhases.filter(
    (phase) =>
      phase.ties.length > 0 &&
      phase.state !== "NOT_PUBLISHED" &&
      phase.state !== "UNAVAILABLE",
  );
  const nowTime = now.getTime();
  const live = published.filter((phase) =>
    phase.ties.some((tie) => tie.legs.some((leg) => leg.status === "LIVE")),
  );

  if (live.length > 0) {
    return live[live.length - 1];
  }

  const inProgress = published.filter((phase) => {
    const hasKnownPendingTie = phase.ties.some(
      (tie) => !tie.completed && tie.state === "AVAILABLE",
    );

    if (!hasKnownPendingTie) {
      return false;
    }

    const start = toTimestamp(phase.startDate);
    const end = toTimestamp(phase.endDate);
    const isInsidePhaseWindow =
      start !== null && end !== null && start <= nowTime && nowTime <= end;
    const legTimes = phase.ties.flatMap((tie) =>
      tie.legs
        .map((leg) => toTimestamp(leg.kickoff))
        .filter((value): value is number => value !== null),
    );
    const hasStartedAndPendingGames =
      legTimes.some((time) => time <= nowTime) &&
      phase.ties.some((tie) => !tie.completed);

    return isInsidePhaseWindow || hasStartedAndPendingGames;
  });

  if (inProgress.length > 0) {
    return inProgress[inProgress.length - 1];
  }

  const upcoming = published
    .map((phase) => ({
      phase,
      kickoff: Math.min(
        ...phase.ties.flatMap((tie) =>
          tie.legs
            .map((leg) => toTimestamp(leg.kickoff))
            .filter(
              (value): value is number => value !== null && value > nowTime,
            ),
        ),
      ),
    }))
    .filter((item) => Number.isFinite(item.kickoff))
    .sort((first, second) => first.kickoff - second.kickoff);

  if (upcoming.length > 0) {
    return upcoming[0].phase;
  }

  const recent = published
    .map((phase, index) => ({
      phase,
      index,
      timestamp: latestPhaseTimestamp(phase),
    }))
    .sort(
      (first, second) =>
        second.timestamp - first.timestamp || second.index - first.index,
    );

  return (
    recent[0]?.phase ??
    knockoutPhases.find((phase) => phase.state !== "NOT_PUBLISHED") ??
    knockoutPhases[0] ??
    null
  );
}

export function resolveTournamentPhaseSelection(
  requestedId: string | null,
  phases: TournamentPhase[],
  relevantId?: string | null,
) {
  return (
    phases.find((phase) => phase.id === requestedId) ??
    phases.find((phase) => phase.id === relevantId) ??
    phases[0] ??
    null
  );
}

export function normalizeTournamentLabel(value: string | null) {
  if (!value) {
    return null;
  }

  const labels: Record<string, string> = {
    "ROUND OF 16": "Oitavas de final",
    "ROUND 16": "Oitavas de final",
    QUARTERFINAL: "Quartas de final",
    QUARTERFINALS: "Quartas de final",
    SEMIFINAL: "Semifinais",
    SEMIFINALS: "Semifinais",
    FINAL: "Final",
    FINALS: "Final",
  };
  const normalized = value
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .toUpperCase();

  return labels[normalized] ?? value;
}

export function formatTournamentOutcome(tie: TournamentTie) {
  const winner = tie.teams.find((team) => team.id === tie.winnerTeamId);
  const opponent = tie.teams.find((team) => team.id !== tie.winnerTeamId);

  if (winner && opponent && tie.penalties) {
    const winnerScore = getTeamScore(tie.penalties, winner.id);
    const opponentScore = getTeamScore(tie.penalties, opponent.id);

    if (winnerScore !== null && opponentScore !== null) {
      return `${winner.name} avança nos pênaltis por ${winnerScore} x ${opponentScore}`;
    }
  }

  if (winner && opponent && tie.aggregate) {
    const winnerScore = getTeamScore(tie.aggregate, winner.id);
    const opponentScore = getTeamScore(tie.aggregate, opponent.id);

    if (winnerScore !== null && opponentScore !== null) {
      return `${winner.name} avança por ${winnerScore} x ${opponentScore} no agregado`;
    }
  }

  if (tie.completed && tie.aggregate?.length === 2) {
    const [first, second] = tie.aggregate;

    if (first.value === second.value) {
      return "Empate no agregado";
    }
  }

  return winner ? `${winner.name} avança` : null;
}

export function formatTournamentStatus(status: string) {
  const labels: Record<string, string> = {
    SCHEDULED: "Agendado",
    LIVE: "Ao vivo",
    FINAL: "Encerrado",
    FINAL_PENALTIES: "Encerrado nos pênaltis",
    POSTPONED: "Adiado",
    CANCELED: "Cancelado",
    UNKNOWN: "Status indisponível",
  };

  return labels[status] ?? "Status indisponível";
}

export function formatTournamentScore(score: TournamentScore) {
  if (score.home === null || score.away === null) {
    return null;
  }

  return `${score.home} x ${score.away}`;
}

function normalizeLabel(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function toTimestamp(value: string | null) {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();

  return Number.isNaN(timestamp) ? null : timestamp;
}

function latestPhaseTimestamp(phase: TournamentPhase) {
  const timestamps = [
    toTimestamp(phase.startDate),
    toTimestamp(phase.endDate),
    ...phase.ties.flatMap((tie) =>
      tie.legs.map((leg) => toTimestamp(leg.kickoff)),
    ),
  ].filter((value): value is number => value !== null);

  return timestamps.length > 0 ? Math.max(...timestamps) : 0;
}
