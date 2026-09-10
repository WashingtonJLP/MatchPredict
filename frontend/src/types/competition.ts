export type CompetitionFormat = "LEAGUE" | "LEAGUE_PHASE" | "GROUPS" | "CUP";

export type CompetitionCapabilities = {
  games: boolean;
  standings: boolean;
  groups: boolean;
  tournament: boolean;
};

export type FootballRegion = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

export type FootballCompetition = {
  id: string;
  name: string;
  shortName: string;
  regionId: string;
  format: CompetitionFormat;
  logo: string | null;
  capabilities: CompetitionCapabilities;
};

export type CompetitionCatalogResponse = {
  regions: FootballRegion[];
  competitions: FootballCompetition[];
  meta: CompetitionMeta;
};

export type CompetitionPhaseSummary = {
  id: string;
  sourceTypeId: number | null;
  slug: string;
  name: string;
  sourceName: string | null;
  kind: "TABLE" | "KNOCKOUT";
  startDate: string | null;
  endDate: string | null;
};

export type CompetitionSeasonResponse = {
  competitionId: string;
  year: number;
  displayName: string;
  startDate: string | null;
  endDate: string | null;
  phases: CompetitionPhaseSummary[];
  partial: boolean;
  meta: CompetitionMeta;
};

export type CompetitionTeam = {
  id: string;
  name: string;
  abbreviation: string | null;
  logo: string | null;
  isTbd?: boolean;
};

export type StandingZone = {
  description: string;
  rank: number | null;
  color: string | null;
};

export type StandingEntry = {
  position: number;
  team: CompetitionTeam;
  played: number | null;
  wins: number | null;
  draws: number | null;
  losses: number | null;
  goalsFor: number | null;
  goalsAgainst: number | null;
  goalDifference: number | null;
  points: number | null;
  deductions: number;
  zone: StandingZone | null;
};

export type StandingSection = {
  id: string;
  name: string;
  entries: StandingEntry[];
};

export type CompetitionStandingsResponse = {
  competitionId: string;
  applicable: boolean;
  kind: CompetitionFormat | "NONE";
  season: number | null;
  seasonName: string | null;
  sections: StandingSection[];
  partial: boolean;
  reason: string | null;
  meta: CompetitionMeta;
};

export type TournamentScore = {
  home: number | null;
  away: number | null;
};

export type TournamentLeg = {
  id: string;
  kickoff: string | null;
  leg: number | null;
  legLabel: string | null;
  status: string;
  statusLabel: string;
  homeTeam: CompetitionTeam | null;
  awayTeam: CompetitionTeam | null;
  score: TournamentScore;
};

export type TournamentTeamScore = {
  teamId: string;
  value: number;
};

export type TournamentTie = {
  id: string;
  title: string | null;
  state: "TBD" | "AVAILABLE" | "UNAVAILABLE";
  teams: CompetitionTeam[];
  legs: TournamentLeg[];
  aggregate: TournamentTeamScore[] | null;
  penalties: TournamentTeamScore[] | null;
  winnerTeamId: string | null;
  completed: boolean;
  note: string | null;
  progression: null;
};

export type TournamentPhase = CompetitionPhaseSummary & {
  state: "NOT_PUBLISHED" | "TBD" | "AVAILABLE" | "UNAVAILABLE";
  ties: TournamentTie[];
};

export type CompetitionTournamentResponse = {
  competitionId: string;
  applicable: boolean;
  season: number | null;
  seasonName: string | null;
  phases: TournamentPhase[];
  partial: boolean;
  reason: string | null;
  warnings: string[];
  meta: CompetitionMeta;
};

export type CompetitionMeta = {
  generatedAt: string;
  cacheTtlSeconds: number;
};
