import { httpClient } from "@/services/http-client";
import type { FixtureTransparency, Prediction } from "@/types/prediction";

export type PredictionPayload = {
  fixtureId: string;
  homeGoals: number;
  awayGoals: number;
};

export type UpdatePredictionPayload = Omit<PredictionPayload, "fixtureId">;

export async function getMyPredictions() {
  const { data } = await httpClient.get<Prediction[]>("/predictions/my");

  return data;
}

export async function getFixtureTransparency(fixtureId: string) {
  const { data } = await httpClient.get<FixtureTransparency>(
    `/predictions/fixture/${fixtureId}/transparency`,
  );

  return data;
}

export async function createPrediction(payload: PredictionPayload) {
  const { data } = await httpClient.post<Prediction>("/predictions", payload);

  return data;
}

export async function updatePrediction(
  predictionId: string,
  payload: UpdatePredictionPayload,
) {
  const { data } = await httpClient.patch<Prediction>(
    `/predictions/${predictionId}`,
    payload,
  );

  return data;
}

export async function deletePrediction(predictionId: string) {
  const { data } = await httpClient.delete<{ message: string }>(
    `/predictions/${predictionId}`,
  );

  return data;
}
