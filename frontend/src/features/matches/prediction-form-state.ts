import { MAX_SCORE, MIN_SCORE } from "./score-input-value.ts";

export type PredictionFormValues = {
  homeGoals: number;
  awayGoals: number;
};

export type PredictionFormState = {
  homeGoals: number | null;
  awayGoals: number | null;
};

export function getInitialPredictionFormState(
  prediction: PredictionFormValues | null | undefined,
): PredictionFormState {
  if (prediction === null || prediction === undefined) {
    return { homeGoals: null, awayGoals: null };
  }

  return {
    homeGoals: prediction.homeGoals,
    awayGoals: prediction.awayGoals,
  };
}

export function isValidPredictionScore(
  score: number | null | undefined,
): score is number {
  return (
    score !== null &&
    score !== undefined &&
    Number.isInteger(score) &&
    score >= MIN_SCORE &&
    score <= MAX_SCORE
  );
}

export function canSubmitPredictionForm(
  homeGoals: number | null,
  awayGoals: number | null,
): boolean {
  return (
    isValidPredictionScore(homeGoals) && isValidPredictionScore(awayGoals)
  );
}

export function getPredictionFormValues(
  homeGoals: number | null,
  awayGoals: number | null,
): PredictionFormValues | null {
  if (
    !isValidPredictionScore(homeGoals) ||
    !isValidPredictionScore(awayGoals)
  ) {
    return null;
  }

  return { homeGoals, awayGoals };
}
