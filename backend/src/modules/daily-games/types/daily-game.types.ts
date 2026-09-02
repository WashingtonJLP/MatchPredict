export const DAILY_GAMES_TIMEZONE = 'America/Sao_Paulo';

export const DAILY_GAMES_COMPETITIONS = [
  {
    id: 'eng.1',
    name: 'Premier League',
  },
  {
    id: 'bra.1',
    name: 'Brasileirão Série A',
  },
  {
    id: 'bra.2',
    name: 'Brasileirão Série B',
  },
  {
    id: 'bra.copa_do_brazil',
    name: 'Copa do Brasil',
  },
  {
    id: 'uefa.champions',
    name: 'Champions League',
  },
  {
    id: 'uefa.europa',
    name: 'Europa League',
  },
  {
    id: 'esp.1',
    name: 'La Liga',
  },
  {
    id: 'ita.1',
    name: 'Serie A',
  },
  {
    id: 'ger.1',
    name: 'Bundesliga',
  },
  {
    id: 'fra.1',
    name: 'Ligue 1',
  },
  {
    id: 'conmebol.libertadores',
    name: 'Libertadores',
  },
  {
    id: 'conmebol.sudamericana',
    name: 'Sul-Americana',
  },
] as const;

export const DAILY_GAMES_COMPETITIONS_VERSION = 'v2';

export type DailyGamesCompetitionId =
  (typeof DAILY_GAMES_COMPETITIONS)[number]['id'];

export type DailyGameStatus =
  | 'SCHEDULED'
  | 'LIVE'
  | 'HALFTIME'
  | 'FINAL'
  | 'FINAL_PENALTIES'
  | 'DELAYED'
  | 'POSTPONED'
  | 'CANCELED'
  | 'SUSPENDED'
  | 'UNKNOWN';

export type DailyGameTeam = {
  abbreviation: string | null;
  id: string;
  logo: string | null;
  name: string;
};

export type DailyGameScore = {
  away: number | null;
  home: number | null;
};

export type DailyGameStage =
  | {
      label: string;
      number: number;
      type: 'ROUND';
    }
  | {
      label: string;
      number: null;
      type: 'GROUP_STAGE' | 'KNOCKOUT' | 'LEAGUE_PHASE';
    };

export type DailyGame = {
  awayTeam: DailyGameTeam;
  homeTeam: DailyGameTeam;
  id: string;
  kickoff: string;
  localDate: string;
  localTime: string;
  minute: number | null;
  period: number | null;
  score: DailyGameScore;
  sourceEventId: string;
  stage: DailyGameStage | null;
  status: DailyGameStatus;
  statusLabel: string;
};

export type DailyGamesCompetition = {
  games: DailyGame[];
  id: DailyGamesCompetitionId;
  logo: string | null;
  name: string;
};

export type DailyGamesMeta = {
  cacheTtlSeconds: number;
  failedCompetitions: number;
  generatedAt: string;
  requestedCompetitions: number;
  successfulCompetitions: number;
};

export type DailyGamesResponse = {
  competitions: DailyGamesCompetition[];
  date: string;
  meta: DailyGamesMeta;
  timezone: typeof DAILY_GAMES_TIMEZONE;
};

export type DailyGamesCompetitionConfig = {
  id: DailyGamesCompetitionId;
  name: string;
};
