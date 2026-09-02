export type DailyGameStatus =
  | "SCHEDULED"
  | "LIVE"
  | "HALFTIME"
  | "FINAL"
  | "FINAL_PENALTIES"
  | "DELAYED"
  | "POSTPONED"
  | "CANCELED"
  | "SUSPENDED"
  | "UNKNOWN";

export type DailyGameTeam = {
  id: string;
  name: string;
  abbreviation: string | null;
  logo: string | null;
};

export type DailyGameScore = {
  home: number | null;
  away: number | null;
};

export type DailyGameStage =
  | {
      label: string;
      number: number;
      type: "ROUND";
    }
  | {
      label: string;
      number: null;
      type: "GROUP_STAGE" | "KNOCKOUT" | "LEAGUE_PHASE";
    };

export type DailyGame = {
  id: string;
  sourceEventId: string;
  kickoff: string;
  localDate: string;
  localTime: string;
  status: DailyGameStatus;
  statusLabel: string;
  minute: number | null;
  period: number | null;
  homeTeam: DailyGameTeam;
  awayTeam: DailyGameTeam;
  score: DailyGameScore;
  stage: DailyGameStage | null;
};

export type DailyGamesCompetition = {
  id: string;
  name: string;
  logo: string | null;
  games: DailyGame[];
};

export type DailyGamesMeta = {
  generatedAt: string;
  cacheTtlSeconds: number;
  requestedCompetitions: number;
  successfulCompetitions: number;
  failedCompetitions: number;
};

export type DailyGamesResponse = {
  date: string;
  timezone: "America/Sao_Paulo";
  competitions: DailyGamesCompetition[];
  meta: DailyGamesMeta;
};
