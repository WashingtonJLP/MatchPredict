export type EspnScoreboardLogo = {
  href?: string;
  rel?: string[];
};

export type EspnScoreboardLeague = {
  id?: string;
  logos?: EspnScoreboardLogo[];
  name?: string;
  slug?: string;
};

export type EspnScoreboardStatus = {
  clock?: number;
  displayClock?: string;
  period?: number;
  type?: {
    completed?: boolean;
    description?: string;
    detail?: string;
    name?: string;
    shortDetail?: string;
    state?: string;
  };
};

export type EspnScoreboardTeam = {
  abbreviation?: string;
  displayName?: string;
  id?: string;
  logo?: string;
  name?: string;
  shortDisplayName?: string;
};

export type EspnScoreboardCompetitor = {
  homeAway?: 'home' | 'away';
  id?: string;
  score?: string;
  team?: EspnScoreboardTeam;
};

export type EspnScoreboardCompetition = {
  competitors?: EspnScoreboardCompetitor[];
  date?: string;
  status?: EspnScoreboardStatus;
  wasSuspended?: boolean;
};

export type EspnScoreboardEvent = {
  competitions?: EspnScoreboardCompetition[];
  date?: string;
  id?: string;
  name?: string;
  status?: EspnScoreboardStatus;
};

export type EspnScoreboardResponse = {
  events?: EspnScoreboardEvent[];
  leagues?: EspnScoreboardLeague[];
};
