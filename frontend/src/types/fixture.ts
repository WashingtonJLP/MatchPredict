import type { Fixture, Prediction } from "@/types/prediction";

export type FixtureStatusValue =
  | "NS"
  | "LIVE"
  | "FT"
  | "POSTPONED"
  | "CANCELLED";

export type FixtureUserPrediction = Pick<
  Prediction,
  "id" | "homeGoals" | "awayGoals" | "totalPoints"
>;

export type MatchFixture = Fixture & {
  league?: string | null;
  competition?: string | null;
  winnerType: "HOME" | "AWAY" | "DRAW" | null;
  canPredict: boolean;
  userPrediction: FixtureUserPrediction | null;
};

export type FixturesMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type FixturesResponse = {
  data: MatchFixture[];
  meta: FixturesMeta;
};

export type FixtureCurrentPageResponse = {
  page: number;
  round: number | null;
};

export type FixturesQuery = {
  status?: FixtureStatusValue;
  round?: number;
  teamId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};
