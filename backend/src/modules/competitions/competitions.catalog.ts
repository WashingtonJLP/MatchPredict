export const FOOTBALL_REGIONS = [
  { id: 'brazil', name: 'Brasil', latitude: -14.2, longitude: -51.9 },
  { id: 'england', name: 'Inglaterra', latitude: 52.4, longitude: -1.5 },
  { id: 'spain', name: 'Espanha', latitude: 40.4, longitude: -3.7 },
  { id: 'italy', name: 'Itália', latitude: 42.8, longitude: 12.8 },
  { id: 'germany', name: 'Alemanha', latitude: 51.2, longitude: 10.4 },
  { id: 'france', name: 'França', latitude: 46.2, longitude: 2.2 },
  { id: 'europe', name: 'Europa', latitude: 50.5, longitude: 15.2 },
  {
    id: 'south-america',
    name: 'América do Sul',
    latitude: -15.6,
    longitude: -60.5,
  },
] as const;

export type FootballRegionId = (typeof FOOTBALL_REGIONS)[number]['id'];
export type CompetitionFormat = 'LEAGUE' | 'LEAGUE_PHASE' | 'GROUPS' | 'CUP';

export type FootballCompetitionConfig = {
  id: string;
  name: string;
  shortName: string;
  regionId: FootballRegionId;
  format: CompetitionFormat;
  logoId: string;
  capabilities: {
    games: true;
    standings: boolean;
    groups: boolean;
    tournament: boolean;
  };
};

export const FOOTBALL_COMPETITIONS: readonly FootballCompetitionConfig[] = [
  league('eng.1', 'Premier League', 'Premier League', 'england', '700'),
  league(
    'bra.1',
    'Brasileirão Série A',
    'Brasileirão Série A',
    'brazil',
    '630',
  ),
  league(
    'bra.2',
    'Brasileirão Série B',
    'Brasileirão Série B',
    'brazil',
    '4007',
  ),
  {
    id: 'bra.copa_do_brazil',
    name: 'Copa do Brasil',
    shortName: 'Copa do Brasil',
    regionId: 'brazil',
    format: 'CUP',
    logoId: '8306',
    capabilities: {
      games: true,
      standings: false,
      groups: false,
      tournament: true,
    },
  },
  leaguePhase('uefa.champions', 'Champions League', 'Champions', '775'),
  leaguePhase('uefa.europa', 'Europa League', 'Europa League', '776'),
  league('esp.1', 'La Liga', 'La Liga', 'spain', '740'),
  league('ita.1', 'Serie A', 'Serie A', 'italy', '730'),
  league('ger.1', 'Bundesliga', 'Bundesliga', 'germany', '720'),
  league('fra.1', 'Ligue 1', 'Ligue 1', 'france', '710'),
  groupedCup('conmebol.libertadores', 'Libertadores', 'Libertadores', '783'),
  groupedCup('conmebol.sudamericana', 'Sul-Americana', 'Sul-Americana', '5454'),
];

function league(
  id: string,
  name: string,
  shortName: string,
  regionId: FootballRegionId,
  logoId: string,
): FootballCompetitionConfig {
  return {
    id,
    name,
    shortName,
    regionId,
    format: 'LEAGUE',
    logoId,
    capabilities: {
      games: true,
      standings: true,
      groups: false,
      tournament: false,
    },
  };
}

function leaguePhase(
  id: string,
  name: string,
  shortName: string,
  logoId: string,
): FootballCompetitionConfig {
  return {
    id,
    name,
    shortName,
    regionId: 'europe',
    format: 'LEAGUE_PHASE',
    logoId,
    capabilities: {
      games: true,
      standings: true,
      groups: false,
      tournament: true,
    },
  };
}

function groupedCup(
  id: string,
  name: string,
  shortName: string,
  logoId: string,
): FootballCompetitionConfig {
  return {
    id,
    name,
    shortName,
    regionId: 'south-america',
    format: 'GROUPS',
    logoId,
    capabilities: {
      games: true,
      standings: true,
      groups: true,
      tournament: true,
    },
  };
}
