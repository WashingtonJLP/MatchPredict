import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import {
  activeSeasonWhere,
  latestCreatedOrderBy,
  standingRankingOrderBy,
} from '../../common/prisma/query-presets';
import { PrismaService } from '../../common/prisma/prisma.service';

const standingWithUser = Prisma.validator<Prisma.StandingDefaultArgs>()({
  include: {
    user: {
      select: {
        id: true,
        name: true,
        avatarUrl: true,
      },
    },
  },
});

type StandingWithUser = Prisma.StandingGetPayload<typeof standingWithUser>;

export type RankedStanding = {
  position: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  scorePoints: number;
  totalPoints: number;
  exactScores: number;
  correctWinners: number;
  wrongPredictions: number;
};

export type MyStanding = Pick<
  RankedStanding,
  'position' | 'totalPoints' | 'exactScores' | 'correctWinners'
> & {
  totalPlayers: number;
};

@Injectable()
export class StandingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveSeasonRanking(): Promise<RankedStanding[]> {
    const seasonId = await this.findActiveSeasonId();
    const standings = await this.findOrderedStandings(seasonId);

    return standings.map((standing, index) =>
      this.toRankedStanding(standing, index),
    );
  }

  async findMyActiveSeasonStanding(userId: string): Promise<MyStanding> {
    const ranking = await this.findActiveSeasonRanking();
    const standing = ranking.find((item) => item.userId === userId);

    if (!standing) {
      throw new NotFoundException(
        'Usuário não possui classificação na temporada ativa.',
      );
    }

    return {
      position: standing.position,
      totalPlayers: ranking.length,
      totalPoints: standing.totalPoints,
      exactScores: standing.exactScores,
      correctWinners: standing.correctWinners,
    };
  }

  private async findActiveSeasonId(): Promise<string> {
    const season = await this.prisma.season.findFirst({
      where: activeSeasonWhere,
      orderBy: latestCreatedOrderBy,
      select: {
        id: true,
      },
    });

    if (!season) {
      throw new NotFoundException('Temporada ativa não encontrada.');
    }

    return season.id;
  }

  private findOrderedStandings(seasonId: string): Promise<StandingWithUser[]> {
    return this.prisma.standing.findMany({
      where: {
        seasonId,
      },
      orderBy: standingRankingOrderBy,
      include: standingWithUser.include,
    });
  }

  private toRankedStanding(
    standing: StandingWithUser,
    index: number,
  ): RankedStanding {
    return {
      position: index + 1,
      userId: standing.user.id,
      name: standing.user.name,
      avatarUrl: standing.user.avatarUrl,
      scorePoints: standing.scorePoints,
      totalPoints: standing.totalPoints,
      exactScores: standing.exactScores,
      correctWinners: standing.correctWinners,
      wrongPredictions: standing.wrongPredictions,
    };
  }
}
