import { httpClient } from "@/services/http-client";
import type { Standing } from "@/types/standing";

export async function getStandings() {
  const { data } = await httpClient.get<Standing[]>("/standings");

  return data;
}
