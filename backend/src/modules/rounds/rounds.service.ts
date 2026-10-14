import { Injectable, NotFoundException } from '@nestjs/common';
import { FixtureStatus } from '@prisma/client';

import { PrismaService } from '../../common/prisma/prisma.service';

type RoundFixture = {
  id: string;
  kickoff: Date;
  status: FixtureStatus;
  homeGoals: number | null;
  awayGoals: number | null;
  processedAt: Date | null;
};

type RoundPrediction = {
  userId: string;
  fixtureId: string;
  scorePoints: number;
  exactScore: boolean;
  correctWinner: boolean;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
    createdAt: Date;
  };
};

export type RoundRankingEntry = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  position: number;
  naturalPoints: number;
  predictionsCount: number;
  evaluatedPredictions: number;
  exactScores: number;
  correctWinners: number;
  wrongPredictions: number;
  accuracy: number | null;
};

export type RoundBestTieBreakCriterion =
  | 'EXACT_SCORES'
  | 'CORRECT_WINNERS'
  | 'FEWER_WRONG_PREDICTIONS'
  | 'EARLIER_REGISTRATION'
  | 'EARLIER_PREDICTION'
  | 'STABLE_ID';

type MutableRoundRankingEntry = Omit<
  RoundRankingEntry,
  'position' | 'accuracy'
> & {
  userCreatedAt: Date;
  firstPredictionAt: Date;
};

type CatalogRound = {
  number: number;
  fixtureCount: number;
  startsAt: Date;
  endsAt: Date;
  statuses: Map<FixtureStatus, number>;
};

@Injectable()
export class RoundsService {
  constructor(private readonly prisma: PrismaService) {}

  async findCatalog() {
    const seasons = await this.prisma.season.findMany({
      where: {
        league: {
          isActive: true,
        },
        fixtures: {
          some: {},
        },
      },
      orderBy: [{ isActive: 'desc' }, { year: 'desc' }],
      select: {
        id: true,
        year: true,
        name: true,
        isActive: true,
        league: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });

    if (seasons.length === 0) {
      return {
        competitions: [],
        defaults: {
          competitionId: null,
          seasonId: null,
          round: null,
        },
      };
    }

    const fixturesByRound = await this.prisma.fixture.groupBy({
      by: ['seasonId', 'round', 'status'],
      where: {
        seasonId: {
          in: seasons.map((season) => season.id),
        },
      },
      _count: {
        _all: true,
      },
      _min: {
        kickoff: true,
      },
      _max: {
        kickoff: true,
      },
    });

    const roundsBySeason = this.buildCatalogRounds(fixturesByRound);
    const competitionsById = new Map<
      string,
      {
        id: string;
        name: string;
        logo: string;
        seasons: Array<{
          id: string;
          year: number;
          name: string;
          isActive: boolean;
          defaultRound: number | null;
          rounds: Array<{
            number: number;
            fixtureCount: number;
            startsAt: Date;
            endsAt: Date;
          }>;
        }>;
      }
    >();

    for (const season of seasons) {
      const competition = competitionsById.get(season.league.id) ?? {
        ...season.league,
        seasons: [],
      };

      const seasonRounds = roundsBySeason.get(season.id) ?? [];
      const selectableRounds = this.selectSelectableRounds(seasonRounds);

      competition.seasons.push({
        id: season.id,
        year: season.year,
        name: season.name,
        isActive: season.isActive,
        defaultRound: this.resolveDefaultRound(seasonRounds),
        rounds: selectableRounds.map((round) => ({
          number: round.number,
          fixtureCount: round.fixtureCount,
          startsAt: round.startsAt,
          endsAt: round.endsAt,
        })),
      });
      competitionsById.set(competition.id, competition);
    }

    const competitions = [...competitionsById.values()];
    const defaultSeason =
      competitions
        .flatMap((competition) =>
          competition.seasons.map((season) => ({ competition, season })),
        )
        .find(({ season }) => season.isActive) ??
      (competitions[0]?.seasons[0]
        ? { competition: competitions[0], season: competitions[0].seasons[0] }
        : null);

    return {
      competitions,
      defaults: {
        competitionId: defaultSeason?.competition.id ?? null,
        seasonId: defaultSeason?.season.id ?? null,
        round: defaultSeason?.season.defaultRound ?? null,
      },
    };
  }

  async findRoundStats(
    userId: string,
    competitionId: string,
    seasonId: string,
    round: number,
  ) {
    const season = await this.prisma.season.findFirst({
      where: {
        id: seasonId,
        leagueId: competitionId,
      },
      select: {
        id: true,
        year: true,
        name: true,
        league: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });

    if (!season) {
      throw new NotFoundException('Competição ou temporada não encontrada.');
    }

    const fixtures = await this.prisma.fixture.findMany({
      where: {
        seasonId,
        round,
      },
      orderBy: {
        kickoff: 'asc',
      },
      select: {
        id: true,
        kickoff: true,
        status: true,
        homeGoals: true,
        awayGoals: true,
        processedAt: true,
      },
    });

    if (fixtures.length === 0) {
      throw new NotFoundException('Rodada não encontrada para esta temporada.');
    }

    const eligibleFixtures = fixtures.filter(
      (fixture) => fixture.status !== FixtureStatus.CANCELLED,
    );
    const eligibleFixtureIds = eligibleFixtures.map((fixture) => fixture.id);
    const predictions = eligibleFixtureIds.length
      ? await this.prisma.prediction.findMany({
          where: {
            fixtureId: {
              in: eligibleFixtureIds,
            },
          },
          select: {
            userId: true,
            fixtureId: true,
            scorePoints: true,
            exactScore: true,
            correctWinner: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                createdAt: true,
              },
            },
          },
        })
      : [];

    const now = new Date();
    const publicFixtures = eligibleFixtures.filter((fixture) =>
      this.isFixtureTransparent(fixture, now),
    );
    const publicFixtureIds = new Set(
      publicFixtures.map((fixture) => fixture.id),
    );
    const evaluatedFixtureIds = new Set(
      eligibleFixtures
        .filter((fixture) => this.isFixtureEvaluated(fixture))
        .map((fixture) => fixture.id),
    );
    const publicPredictions = predictions.filter((prediction) =>
      publicFixtureIds.has(prediction.fixtureId),
    );
    const { ranking, bestTieBreakCriterion } = this.buildRanking(
      publicPredictions,
      evaluatedFixtureIds,
    );
    const ownPredictions = predictions.filter(
      (prediction) => prediction.userId === userId,
    );
    const ownRankingEntry = ranking.find((entry) => entry.userId === userId);
    return {
      status: this.resolveRoundStatus(
        eligibleFixtures.length,
        publicFixtures.length,
        evaluatedFixtureIds.size,
      ),
      competition: season.league,
      season: {
        id: season.id,
        year: season.year,
        name: season.name,
      },
      round,
      totalFixtures: eligibleFixtures.length,
      publicFixtures: publicFixtures.length,
      completedFixtures: evaluatedFixtureIds.size,
      cancelledFixtures: fixtures.length - eligibleFixtures.length,
      dataIncomplete: eligibleFixtures.some(
        (fixture) =>
          fixture.status === FixtureStatus.FT &&
          (fixture.homeGoals === null ||
            fixture.awayGoals === null ||
            fixture.processedAt === null),
      ),
      highlights: this.buildHighlights(ranking, bestTieBreakCriterion),
      myPerformance: this.buildMyPerformance(
        ownRankingEntry,
        ownPredictions.length,
      ),
      ranking,
    };
  }

  private buildCatalogRounds(
    groups: Array<{
      seasonId: string;
      round: number;
      status: FixtureStatus;
      _count: { _all: number };
      _min: { kickoff: Date | null };
      _max: { kickoff: Date | null };
    }>,
  ) {
    const rounds = new Map<string, Map<number, CatalogRound>>();

    for (const group of groups) {
      if (!group._min.kickoff || !group._max.kickoff) {
        continue;
      }

      const seasonRounds =
        rounds.get(group.seasonId) ?? new Map<number, CatalogRound>();
      const current: CatalogRound = seasonRounds.get(group.round) ?? {
        number: group.round,
        fixtureCount: 0,
        startsAt: group._min.kickoff,
        endsAt: group._max.kickoff,
        statuses: new Map<FixtureStatus, number>(),
      };

      current.fixtureCount += group._count._all;
      current.startsAt =
        group._min.kickoff < current.startsAt
          ? group._min.kickoff
          : current.startsAt;
      current.endsAt =
        group._max.kickoff > current.endsAt
          ? group._max.kickoff
          : current.endsAt;
      current.statuses.set(group.status, group._count._all);
      seasonRounds.set(group.round, current);
      rounds.set(group.seasonId, seasonRounds);
    }

    return new Map(
      [...rounds.entries()].map(([seasonId, seasonRounds]) => [
        seasonId,
        [...seasonRounds.values()]
          .sort((first, second) => first.number - second.number)
          .map((round) => round),
      ]),
    );
  }

  private resolveDefaultRound(
    rounds: Array<{
      number: number;
      startsAt: Date;
      endsAt: Date;
      statuses: Map<FixtureStatus, number>;
    }>,
  ) {
    if (rounds.length === 0) {
      return null;
    }

    const now = Date.now();
    const current = rounds
      .filter(
        (round) =>
          round.startsAt.getTime() <= now &&
          [...round.statuses.entries()].some(
            ([status, count]) =>
              count > 0 &&
              status !== FixtureStatus.FT &&
              status !== FixtureStatus.CANCELLED,
          ),
      )
      .at(-1);

    if (current) {
      return current.number;
    }

    const next = rounds.find((round) => round.startsAt.getTime() > now);

    return next?.number ?? rounds[rounds.length - 1].number;
  }

  private selectSelectableRounds(rounds: CatalogRound[]) {
    const now = Date.now();
    const nextRound = [...rounds]
      .filter((round) => round.startsAt.getTime() > now)
      .sort(
        (first, second) =>
          first.startsAt.getTime() - second.startsAt.getTime() ||
          first.number - second.number,
      )[0];

    return rounds.filter(
      (round) =>
        round.startsAt.getTime() <= now || round.number === nextRound?.number,
    );
  }

  private isFixtureTransparent(fixture: RoundFixture, now: Date) {
    return (
      fixture.kickoff.getTime() <= now.getTime() ||
      fixture.status === FixtureStatus.LIVE ||
      fixture.status === FixtureStatus.FT
    );
  }

  private isFixtureEvaluated(fixture: RoundFixture) {
    return (
      fixture.status === FixtureStatus.FT &&
      fixture.homeGoals !== null &&
      fixture.awayGoals !== null &&
      fixture.processedAt !== null
    );
  }

  private buildRanking(
    predictions: RoundPrediction[],
    evaluatedFixtureIds: Set<string>,
  ) {
    const entries = new Map<string, MutableRoundRankingEntry>();

    for (const prediction of predictions) {
      const isEvaluated = evaluatedFixtureIds.has(prediction.fixtureId);
      const current = entries.get(prediction.userId) ?? {
        userId: prediction.user.id,
        name: prediction.user.name,
        avatarUrl: prediction.user.avatarUrl,
        naturalPoints: 0,
        predictionsCount: 0,
        evaluatedPredictions: 0,
        exactScores: 0,
        correctWinners: 0,
        wrongPredictions: 0,
        userCreatedAt: prediction.user.createdAt,
        firstPredictionAt: prediction.createdAt,
      };

      current.predictionsCount++;
      current.firstPredictionAt =
        prediction.createdAt < current.firstPredictionAt
          ? prediction.createdAt
          : current.firstPredictionAt;

      if (isEvaluated) {
        current.naturalPoints += prediction.scorePoints;
        current.evaluatedPredictions++;
        current.exactScores += Number(prediction.exactScore);
        current.correctWinners += Number(prediction.correctWinner);
        current.wrongPredictions += Number(!prediction.correctWinner);
      }

      entries.set(prediction.userId, current);
    }

    const orderedEntries = [...entries.values()].sort(compareRoundPerformance);
    const evaluatedEntries = orderedEntries.filter(
      (entry) => entry.evaluatedPredictions > 0,
    );
    const bestTieBreakCriterion = resolveBestTieBreakCriterion(
      evaluatedEntries[0],
      evaluatedEntries[1],
    );
    const ranking = orderedEntries.map((entry, index) => ({
      userId: entry.userId,
      name: entry.name,
      avatarUrl: entry.avatarUrl,
      position: index + 1,
      naturalPoints: entry.naturalPoints,
      predictionsCount: entry.predictionsCount,
      evaluatedPredictions: entry.evaluatedPredictions,
      exactScores: entry.exactScores,
      correctWinners: entry.correctWinners,
      wrongPredictions: entry.wrongPredictions,
      accuracy:
        entry.evaluatedPredictions > 0
          ? Math.round(
              (entry.correctWinners / entry.evaluatedPredictions) * 1000,
            ) / 10
          : null,
    }));

    return { ranking, bestTieBreakCriterion };
  }

  private buildHighlights(
    ranking: RoundRankingEntry[],
    bestTieBreakCriterion: RoundBestTieBreakCriterion | null,
  ) {
    const evaluatedRanking = ranking.filter(
      (entry) => entry.evaluatedPredictions > 0,
    );
    const best = evaluatedRanking[0]
      ? {
          ...this.toHighlight(
            evaluatedRanking[0],
            evaluatedRanking[0].naturalPoints,
          ),
          tieBreakCriterion: bestTieBreakCriterion,
        }
      : null;
    const maxExactScores = Math.max(
      0,
      ...evaluatedRanking.map((entry) => entry.exactScores),
    );
    const maxCorrectWinners = Math.max(
      0,
      ...evaluatedRanking.map((entry) => entry.correctWinners),
    );
    const worst =
      evaluatedRanking.length >= 2
        ? [...evaluatedRanking].sort(compareWorstPerformance)[0]
        : null;

    return {
      best,
      mostExactScores:
        maxExactScores > 0
          ? evaluatedRanking
              .filter((entry) => entry.exactScores === maxExactScores)
              .map((entry) => this.toHighlight(entry, entry.exactScores))
          : [],
      mostCorrectWinners:
        maxCorrectWinners > 0
          ? evaluatedRanking
              .filter((entry) => entry.correctWinners === maxCorrectWinners)
              .map((entry) => this.toHighlight(entry, entry.correctWinners))
          : [],
      worst: worst ? this.toHighlight(worst, worst.naturalPoints) : null,
    };
  }

  private toHighlight(entry: RoundRankingEntry, value: number) {
    return {
      userId: entry.userId,
      name: entry.name,
      avatarUrl: entry.avatarUrl,
      position: entry.position,
      value,
    };
  }

  private buildMyPerformance(
    entry: RoundRankingEntry | undefined,
    predictionsCount: number,
  ) {
    return {
      position: entry?.position ?? null,
      naturalPoints: entry?.naturalPoints ?? 0,
      predictionsCount,
      evaluatedPredictions: entry?.evaluatedPredictions ?? 0,
      exactScores: entry?.exactScores ?? 0,
      correctWinners: entry?.correctWinners ?? 0,
      wrongPredictions: entry?.wrongPredictions ?? 0,
      pendingPredictions: predictionsCount - (entry?.evaluatedPredictions ?? 0),
      accuracy: entry?.accuracy ?? null,
    };
  }

  private resolveRoundStatus(
    totalFixtures: number,
    publicFixtures: number,
    completedFixtures: number,
  ): 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' {
    if (publicFixtures === 0) {
      return 'UPCOMING';
    }

    if (totalFixtures > 0 && completedFixtures === totalFixtures) {
      return 'COMPLETED';
    }

    return 'IN_PROGRESS';
  }
}

function compareRoundPerformance(
  first: MutableRoundRankingEntry,
  second: MutableRoundRankingEntry,
) {
  return (
    second.naturalPoints - first.naturalPoints ||
    second.exactScores - first.exactScores ||
    second.correctWinners - first.correctWinners ||
    first.wrongPredictions - second.wrongPredictions ||
    first.userCreatedAt.getTime() - second.userCreatedAt.getTime() ||
    first.firstPredictionAt.getTime() - second.firstPredictionAt.getTime() ||
    first.userId.localeCompare(second.userId)
  );
}

function compareWorstPerformance(
  first: RoundRankingEntry,
  second: RoundRankingEntry,
) {
  return (
    first.naturalPoints - second.naturalPoints ||
    first.exactScores - second.exactScores ||
    first.correctWinners - second.correctWinners ||
    second.wrongPredictions - first.wrongPredictions ||
    second.position - first.position
  );
}

function resolveBestTieBreakCriterion(
  first?: MutableRoundRankingEntry,
  second?: MutableRoundRankingEntry,
): RoundBestTieBreakCriterion | null {
  if (!first || !second || first.naturalPoints !== second.naturalPoints) {
    return null;
  }

  if (first.exactScores !== second.exactScores) {
    return 'EXACT_SCORES';
  }

  if (first.correctWinners !== second.correctWinners) {
    return 'CORRECT_WINNERS';
  }

  if (first.wrongPredictions !== second.wrongPredictions) {
    return 'FEWER_WRONG_PREDICTIONS';
  }

  if (first.userCreatedAt.getTime() !== second.userCreatedAt.getTime()) {
    return 'EARLIER_REGISTRATION';
  }

  if (
    first.firstPredictionAt.getTime() !== second.firstPredictionAt.getTime()
  ) {
    return 'EARLIER_PREDICTION';
  }

  return 'STABLE_ID';
}
