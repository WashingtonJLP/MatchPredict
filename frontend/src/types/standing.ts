export type Standing = {
  position: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  scorePoints: number;
  totalPoints: number;
  exactScores: number;
  correctWinners: number;
  wrongPredictions: number;
};
