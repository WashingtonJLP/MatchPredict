export type RoundCatalogRound = {
  number: number;
  fixtureCount: number;
  startsAt: string;
  endsAt: string;
};

export type RoundCatalogSeason = {
  id: string;
  year: number;
  name: string;
  isActive: boolean;
  defaultRound: number | null;
  rounds: RoundCatalogRound[];
};

export type RoundCatalogCompetition = {
  id: string;
  name: string;
  logo: string;
  seasons: RoundCatalogSeason[];
};

export type RoundsCatalog = {
  competitions: RoundCatalogCompetition[];
  defaults: {
    competitionId: string | null;
    seasonId: string | null;
    round: number | null;
  };
};

export type RoundParticipant = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  position: number;
  naturalPoints: number;
  predictionsCount: number;
  evaluatedPredictions: number;
  exactScores: number;
  correctWinners: number;
  wrongPredictions: number;
  accuracy: number | null;
};

export type RoundHighlightParticipant = Pick<
  RoundParticipant,
  "userId" | "name" | "avatarUrl" | "position"
> & {
  value: number;
};

export type RoundBestTieBreakCriterion =
  | "EXACT_SCORES"
  | "CORRECT_WINNERS"
  | "FEWER_WRONG_PREDICTIONS"
  | "EARLIER_REGISTRATION"
  | "EARLIER_PREDICTION"
  | "STABLE_ID";

export type RoundBestHighlightParticipant = RoundHighlightParticipant & {
  tieBreakCriterion: RoundBestTieBreakCriterion | null;
};

export type RoundMyPerformance = Omit<
  RoundParticipant,
  "userId" | "name" | "avatarUrl" | "position"
> & {
  position: number | null;
  pendingPredictions: number;
};

export type RoundStats = {
  status: "UPCOMING" | "IN_PROGRESS" | "COMPLETED";
  competition: {
    id: string;
    name: string;
    logo: string;
  };
  season: {
    id: string;
    year: number;
    name: string;
  };
  round: number;
  totalFixtures: number;
  publicFixtures: number;
  completedFixtures: number;
  cancelledFixtures: number;
  dataIncomplete: boolean;
  highlights: {
    best: RoundBestHighlightParticipant | null;
    mostExactScores: RoundHighlightParticipant[];
    mostCorrectWinners: RoundHighlightParticipant[];
    worst: RoundHighlightParticipant | null;
  };
  myPerformance: RoundMyPerformance;
  ranking: RoundParticipant[];
};

export type RoundSelection = {
  competitionId: string;
  seasonId: string;
  round: number;
};
