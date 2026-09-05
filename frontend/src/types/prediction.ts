export type Team = {
  id: string;
  name: string;
  logo: string;
  country: string;
};

export type Fixture = {
  id: string;
  sourceEventId: string;
  round: number;
  kickoff: string;
  status: "NS" | "LIVE" | "FT" | "POSTPONED" | "CANCELLED";
  homeGoals: number | null;
  awayGoals: number | null;
  processedAt: string | null;
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

export type TransparencyPrediction = {
  id: string;
  homeGoals: number;
  awayGoals: number;
  totalPoints: number;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
};

export type FixtureTransparency = {
  fixture: Pick<Fixture, "id" | "sourceEventId" | "round" | "kickoff" | "status" | "homeTeam" | "awayTeam"> & {
    processedAt: string | null;
  };
  isClosedForPrediction: boolean;
  finalResult: {
    homeGoals: number;
    awayGoals: number;
  } | null;
  predictions: TransparencyPrediction[];
};
