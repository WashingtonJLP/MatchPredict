type ScorePredictionInput = {
  awayGoals: number;
  homeGoals: number;
};

type ScoreFixtureInput = {
  awayGoals: number | null;
  homeGoals: number | null;
};

type ScoreResult = {
  correctWinner: boolean;
  exactScore: boolean;
  scorePoints: number;
  totalPoints: number;
};

type MatchWinner = 'HOME' | 'AWAY' | 'DRAW';

export class ScoreEngineService {
  calculate(
    prediction: ScorePredictionInput,
    fixture: ScoreFixtureInput,
  ): ScoreResult {
    if (fixture.homeGoals === null || fixture.awayGoals === null) {
      return {
        scorePoints: 0,
        totalPoints: 0,
        exactScore: false,
        correctWinner: false,
      };
    }

    const exactScore =
      prediction.homeGoals === fixture.homeGoals &&
      prediction.awayGoals === fixture.awayGoals;
    const correctWinner =
      this.getWinner(prediction.homeGoals, prediction.awayGoals) ===
      this.getWinner(fixture.homeGoals, fixture.awayGoals);
    const scorePoints = exactScore ? 3 : correctWinner ? 1 : 0;

    return {
      scorePoints,
      totalPoints: scorePoints,
      exactScore,
      correctWinner,
    };
  }

  private getWinner(homeGoals: number, awayGoals: number): MatchWinner {
    if (homeGoals > awayGoals) {
      return 'HOME';
    }

    if (awayGoals > homeGoals) {
      return 'AWAY';
    }

    return 'DRAW';
  }
}
