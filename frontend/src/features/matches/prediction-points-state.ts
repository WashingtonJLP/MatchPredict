import type { FixtureStatusValue } from "@/types/fixture";

type PredictionPointsStateInput = {
  hasPrediction: boolean;
  processedAt: string | null;
  status: FixtureStatusValue;
  totalPoints: number | null | undefined;
};

export type PredictionPointsState =
  | { kind: "available"; points: number }
  | { kind: "pending" }
  | { kind: "hidden" };

export function getPredictionPointsState({
  hasPrediction,
  processedAt,
  status,
  totalPoints,
}: PredictionPointsStateInput): PredictionPointsState {
  if (!hasPrediction || status !== "FT") {
    return { kind: "hidden" };
  }

  if (!processedAt || totalPoints === null || totalPoints === undefined) {
    return { kind: "pending" };
  }

  return { kind: "available", points: totalPoints };
}
