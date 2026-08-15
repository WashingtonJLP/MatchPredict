export type Team = {
  id: string;
  name: string;
  logo: string;
  country: string;
};

export type Fixture = {
  id: string;
  round: number;
  kickoff: string;
  status: "NS" | "LIVE" | "FT" | "POSTPONED" | "CANCELLED";
  homeGoals: number | null;
  awayGoals: number | null;
  homeTeam: Team;
  awayTeam: Team;
};

export type Prediction = {
  id: string;
  homeGoals: number;
  awayGoals: number;
  scorePoints: number;
  mvpPoints: number;
  totalPoints: number;
  exactScore: boolean;
  correctWinner: boolean;
  correctMvp: boolean;
  fixture: Fixture;
};
