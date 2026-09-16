import type {
  FootballCompetition,
  StandingEntry,
  StandingSection,
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

export type StandingZoneKind =
  | "champions"
  | "champions-qualifying"
  | "europa"
  | "conference"
  | "playoff"
  | "relegation-playoff"
  | "relegation"
  | "eliminated"
  | "other";

export type GlobeMarkerSpec = {
  id: string;
  location: [number, number];
  size: number;
  active: boolean;
};

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

export function getStandingZoneVisual(description: string): {
  kind: StandingZoneKind;
  label: string;
} {
  const normalized = normalizeLabel(description);

  if (normalized.includes("relegation playoff")) {
    return {
      kind: "relegation-playoff",
      label: "Playoff contra o rebaixamento",
    };
  }

  if (normalized.includes("relegation")) {
    return { kind: "relegation", label: "Rebaixamento" };
  }

  if (normalized.includes("eliminated")) {
    return { kind: "eliminated", label: "Eliminado" };
  }

  if (normalized.includes("champions league qualifying")) {
    return {
      kind: "champions-qualifying",
      label: "Eliminatórias da Champions League",
    };
  }

  if (normalized.includes("champions league")) {
    return { kind: "champions", label: "Champions League" };
  }

  if (normalized.includes("europa league")) {
    return { kind: "europa", label: "Europa League" };
  }

  if (
    normalized.includes("conference league") ||
    normalized.includes("sudamericana")
  ) {
    return {
      kind: "conference",
      label: normalized.includes("sudamericana")
        ? "Playoffs da Sul-Americana"
        : normalized.includes("qualifying")
          ? "Eliminatórias da Conference League"
          : "Conference League",
    };
  }

  if (normalized.includes("qualifies for round of 16")) {
    return { kind: "champions", label: "Classificação para as oitavas" };
  }

  if (normalized.includes("knockout phase playoffs")) {
    return {
      kind: "playoff",
      label: normalized.includes("unseeded")
        ? "Playoff do mata-mata — não cabeça de chave"
        : "Playoff do mata-mata — cabeça de chave",
    };
  }

  if (normalized.includes("qualifying") || normalized.includes("playoff")) {
    return { kind: "playoff", label: description };
  }

  return { kind: "other", label: description };
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
      return `${winner.name} vence nos pênaltis por ${winnerScore} x ${opponentScore}`;
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

export function locationToGlobeAngles(latitude: number, longitude: number) {
  return {
    phi: Math.PI - (longitude * Math.PI) / 180 + Math.PI / 2,
    theta: (latitude * Math.PI) / 180,
  };
}

export function shortestAngleDelta(current: number, target: number) {
  return Math.atan2(Math.sin(target - current), Math.cos(target - current));
}

export function getGlobeMarkerSpecs(
  regions: Array<{
    id: string;
    latitude: number;
    longitude: number;
  }>,
  selectedRegionId: string,
): GlobeMarkerSpec[] {
  return regions.map((region) => ({
    id: region.id,
    location: [region.latitude, region.longitude],
    size: region.id === selectedRegionId ? 0.1 : 0.035,
    active: region.id === selectedRegionId,
  }));
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
