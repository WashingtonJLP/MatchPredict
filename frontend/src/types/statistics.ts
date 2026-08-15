export type RoundStatistics = {
  round: number;
  points: number;
};

export type UserStatistics = {
  totalPredictions: number;
  totalPoints: number;
  averagePoints: number;
  accuracy: number;
  correctWinners: number;
  exactScores: number;
  wrongPredictions: number;
  bestRound: RoundStatistics | null;
  worstRound: RoundStatistics | null;
  currentPosition: number | null;
};
