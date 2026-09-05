import { httpClient } from "@/services/http-client";
import type { DailyGamesResponse } from "@/types/daily-game";

export async function getDailyGames(date: string, competition?: string) {
  const { data } = await httpClient.get<DailyGamesResponse>(
    "/football/daily-games",
    {
      params: {
        date,
        competition,
      },
    },
  );

  return data;
}
