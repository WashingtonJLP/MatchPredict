import { httpClient } from "@/services/http-client";
import type { Prediction } from "@/types/prediction";

export async function getMyPredictions() {
  const { data } = await httpClient.get<Prediction[]>("/predictions/my");

  return data;
}
