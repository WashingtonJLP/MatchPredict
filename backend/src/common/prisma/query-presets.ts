import { Prisma } from '@prisma/client';

export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatarUrl: true,
  disabledAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export const activeSeasonWhere = {
  isActive: true,
  league: {
    isActive: true,
  },
} satisfies Prisma.SeasonWhereInput;

export const latestCreatedOrderBy = {
  createdAt: 'desc',
} satisfies Prisma.SeasonOrderByWithRelationInput;

export const standingRankingOrderBy = [
  {
    totalPoints: 'desc',
  },
  {
    exactScores: 'desc',
  },
  {
    correctWinners: 'desc',
  },
  {
    wrongPredictions: 'asc',
  },
  {
    createdAt: 'asc',
  },
] satisfies Prisma.StandingOrderByWithRelationInput[];

type OrderedStandingIdentity = {
  id: string;
  seasonId: string;
};

export function buildStandingPositionMap(
  orderedStandings: readonly OrderedStandingIdentity[],
) {
  const positions = new Map<string, number>();
  const seasonCounts = new Map<string, number>();

  for (const standing of orderedStandings) {
    const position = (seasonCounts.get(standing.seasonId) ?? 0) + 1;
    seasonCounts.set(standing.seasonId, position);
    positions.set(standing.id, position);
  }

  return positions;
}
