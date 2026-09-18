import { useQuery } from "@tanstack/react-query";

import {
  getCompetitionCatalog,
  getCompetitionStandings,
  getCompetitionTournament,
  getCurrentCompetitionSeason,
} from "@/services/competitions-service";

export function useCompetitionCatalog() {
  return useQuery({
    queryKey: ["football-competitions"],
    queryFn: getCompetitionCatalog,
    staleTime: 24 * 60 * 60 * 1000,
  });
}

export function useCurrentCompetitionSeason(competitionId: string) {
  return useQuery({
    queryKey: ["football-competition-season", competitionId],
    queryFn: () => getCurrentCompetitionSeason(competitionId),
    enabled: Boolean(competitionId),
    staleTime: 6 * 60 * 60 * 1000,
  });
}

export function useCompetitionStandings(
  competitionId: string,
  season: number | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["football-competition-standings", competitionId, season],
    queryFn: () => getCompetitionStandings(competitionId, season),
    enabled: Boolean(competitionId) && enabled,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCompetitionTournament(
  competitionId: string,
  season: number | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["football-competition-tournament", competitionId, season],
    queryFn: () => getCompetitionTournament(competitionId, season),
    enabled: Boolean(competitionId) && enabled,
    staleTime: 15 * 60 * 1000,
  });
}
