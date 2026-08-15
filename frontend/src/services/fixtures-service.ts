import { httpClient } from "@/services/http-client";
import type { FixturesQuery, FixturesResponse } from "@/types/fixture";

export async function getFixtures(query: FixturesQuery) {
  const { data } = await httpClient.get<FixturesResponse>("/football/fixtures", {
    params: query,
  });

  return data;
}
