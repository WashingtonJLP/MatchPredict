export type EspnRef = { $ref?: string };

export type EspnCollection<TItem> = {
  count?: number;
  items?: TItem[];
};

export type EspnSeason = {
  year?: number;
  displayName?: string;
  startDate?: string;
  endDate?: string;
  tournament?: EspnRef;
};

export type EspnSeasonType = {
  id?: string;
  type?: number;
  name?: string;
  abbreviation?: string;
  slug?: string;
  startDate?: string;
  endDate?: string;
};

export type EspnStandingStat = {
  name?: string;
  value?: number;
  displayValue?: string;
};

export type EspnStandingEntry = {
  team?: {
    id?: string;
    abbreviation?: string;
    displayName?: string;
    shortDisplayName?: string;
    logos?: Array<{ href?: string; rel?: string[] }>;
  };
  note?: {
    color?: string;
    description?: string;
    rank?: number;
  };
  stats?: EspnStandingStat[];
};

export type EspnStandingsResponse = {
  name?: string;
  season?: EspnSeason;
  children?: Array<{
    id?: string;
    name?: string;
    abbreviation?: string;
    standings?: {
      entries?: EspnStandingEntry[];
    };
  }>;
};

export type EspnTournament = {
  id?: string;
  displayName?: string;
  groups?: Array<{
    id?: string;
    displayName?: string;
    startDate?: string;
    endDate?: string;
    matchups?: Array<{
      id?: string;
      events?: EspnRef[];
    }>;
  }>;
};

export type EspnScoreboardTeam = {
  id?: string;
  displayName?: string;
  shortDisplayName?: string;
  abbreviation?: string;
  logo?: string;
};

export type EspnScoreboardCompetitor = {
  id?: string;
  homeAway?: 'home' | 'away';
  score?: string;
  shootoutScore?: number | string;
  winner?: boolean;
  advance?: boolean;
  team?: EspnScoreboardTeam;
};

export type EspnScoreboardSeries = {
  title?: string;
  completed?: boolean;
  totalCompetitions?: number;
  competitors?: Array<{
    id?: string;
    winner?: boolean;
    aggregateScore?: number | string;
  }>;
};

export type EspnScoreboardEvent = {
  id?: string;
  date?: string;
  name?: string;
  season?: {
    year?: number;
    type?: number;
    slug?: string;
  };
  status?: EspnEventStatus;
  competitions?: Array<{
    date?: string;
    leg?: { value?: number; displayValue?: string };
    series?: EspnScoreboardSeries;
    notes?: Array<{ headline?: string }>;
    competitors?: EspnScoreboardCompetitor[];
    status?: EspnEventStatus;
  }>;
};

export type EspnEventStatus = {
  type?: {
    completed?: boolean;
    state?: string;
    name?: string;
    description?: string;
    detail?: string;
  };
};

export type EspnScoreboardResponse = {
  events?: EspnScoreboardEvent[];
};

export type CompetitionTeam = {
  id: string;
  name: string;
  abbreviation: string | null;
  logo: string | null;
};

export type TournamentTeamScore = {
  teamId: string;
  value: number;
};
