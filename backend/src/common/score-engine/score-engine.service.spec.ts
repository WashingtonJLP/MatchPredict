import { ScoreEngineService } from './score-engine.service';

describe('ScoreEngineService', () => {
  let scoreEngine: ScoreEngineService;

  beforeEach(() => {
    scoreEngine = new ScoreEngineService();
  });

  it('returns 3 points for exact score', () => {
    expect(
      scoreEngine.calculate(
        { homeGoals: 2, awayGoals: 1 },
        { homeGoals: 2, awayGoals: 1 },
      ),
    ).toEqual({
      scorePoints: 3,
      totalPoints: 3,
      exactScore: true,
      correctWinner: true,
    });
  });

  it('returns 1 point for correct winner without exact score', () => {
    expect(
      scoreEngine.calculate(
        { homeGoals: 3, awayGoals: 1 },
        { homeGoals: 2, awayGoals: 0 },
      ),
    ).toEqual({
      scorePoints: 1,
      totalPoints: 1,
      exactScore: false,
      correctWinner: true,
    });
  });

  it('returns 0 points for wrong winner', () => {
    expect(
      scoreEngine.calculate(
        { homeGoals: 1, awayGoals: 0 },
        { homeGoals: 0, awayGoals: 2 },
      ),
    ).toEqual({
      scorePoints: 0,
      totalPoints: 0,
      exactScore: false,
      correctWinner: false,
    });
  });

  it('handles draw as a winner type', () => {
    expect(
      scoreEngine.calculate(
        { homeGoals: 1, awayGoals: 1 },
        { homeGoals: 2, awayGoals: 2 },
      ),
    ).toEqual({
      scorePoints: 1,
      totalPoints: 1,
      exactScore: false,
      correctWinner: true,
    });
  });

  it('returns 0 points when fixture has no final score', () => {
    expect(
      scoreEngine.calculate(
        { homeGoals: 1, awayGoals: 1 },
        { homeGoals: null, awayGoals: null },
      ),
    ).toEqual({
      scorePoints: 0,
      totalPoints: 0,
      exactScore: false,
      correctWinner: false,
    });
  });
});
