type ScoreInputState = {
  inputValue: string;
  value: number | null;
};

export const MIN_SCORE = 0;
export const MAX_SCORE = 20;

export function getScoreInputState(rawValue: string): ScoreInputState {
  if (rawValue === "") {
    return { inputValue: "", value: null };
  }

  const valueWithoutLeadingZeros = rawValue.replace(/^0+(?=\d)/, "");
  const value = Math.min(
    MAX_SCORE,
    Math.max(MIN_SCORE, Number(valueWithoutLeadingZeros)),
  );

  return {
    inputValue: String(value),
    value,
  };
}

export function incrementScore(value: number | null): number {
  if (value === null) {
    return MIN_SCORE;
  }

  return Math.min(MAX_SCORE, value + 1);
}

export function decrementScore(value: number | null): number | null {
  if (value === null) {
    return null;
  }

  return Math.max(MIN_SCORE, value - 1);
}
