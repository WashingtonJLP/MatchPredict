import { httpClient } from "@/services/http-client";
import type { RoundSelection, RoundStats, RoundsCatalog } from "@/types/round";

export async function getRoundsCatalog() {
  const { data } = await httpClient.get<RoundsCatalog>("/rounds/catalog");

  return data;
}

export async function getRoundStats(selection: RoundSelection) {
  const { data } = await httpClient.get<RoundStats>(
    `/rounds/${encodeURIComponent(selection.competitionId)}/seasons/${encodeURIComponent(selection.seasonId)}/${selection.round}`,
  );

  return data;
}
