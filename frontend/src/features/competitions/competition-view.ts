import type {
  FootballCompetition,
  StandingEntry,
  StandingSection,
  TournamentPhase,
  TournamentScore,
  TournamentTeamScore,
} from "../../types/competition";

export type CompetitionTabId =
  | "games"
  | "standings"
  | "groups"
  | "tournament";

export type CompetitionTab = {
  id: CompetitionTabId;
  label: string;
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

export function getCompetitionDataState(applicable: boolean, itemCount: number) {
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

export function formatTournamentScore(score: TournamentScore) {
  if (score.home === null || score.away === null) {
    return null;
  }

  return `${score.home} x ${score.away}`;
}
