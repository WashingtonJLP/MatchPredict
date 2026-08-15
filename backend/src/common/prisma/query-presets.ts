import { Prisma } from '@prisma/client';

export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
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
