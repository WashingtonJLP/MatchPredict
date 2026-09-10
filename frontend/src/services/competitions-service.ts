import { httpClient } from "@/services/http-client";
import type {
  CompetitionCatalogResponse,
  CompetitionSeasonResponse,
  CompetitionStandingsResponse,
  CompetitionTournamentResponse,
} from "@/types/competition";

const resource = "/football/competitions";

export async function getCompetitionCatalog() {
  const response = await httpClient.get<CompetitionCatalogResponse>(resource);

  return response.data;
}

export async function getCurrentCompetitionSeason(competitionId: string) {
  const response = await httpClient.get<CompetitionSeasonResponse>(
    `${resource}/${encodeURIComponent(competitionId)}/seasons/current`,
  );

  return response.data;
}

export async function getCompetitionStandings(
  competitionId: string,
  season?: number,
) {
  const response = await httpClient.get<CompetitionStandingsResponse>(
    `${resource}/${encodeURIComponent(competitionId)}/standings`,
    { params: season ? { season } : undefined },
  );

  return response.data;
}

export async function getCompetitionTournament(
  competitionId: string,
  season?: number,
) {
  const response = await httpClient.get<CompetitionTournamentResponse>(
    `${resource}/${encodeURIComponent(competitionId)}/tournament`,
    { params: season ? { season } : undefined },
  );

  return response.data;
}
