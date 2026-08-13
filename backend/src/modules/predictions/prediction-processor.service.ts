import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FixtureStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ScoreEngineService } from '../../common/score-engine/score-engine.service';

@Injectable()
export class PredictionProcessorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scoreEngine: ScoreEngineService,
  ) {}

  async processFixture(fixtureId: string) {
    const fixture = await this.prisma.fixture.findUnique({
      where: {
        id: fixtureId,
      },
    });

    if (!fixture) {
      throw new NotFoundException('Partida não encontrada.');
    }

    if (fixture.processedAt) {
      return {
        fixtureId,
        alreadyProcessed: true,
        predictionsProcessed: 0,
        standingsUpdated: 0,
      };
    }

    if (fixture.status !== FixtureStatus.FT) {
      throw new BadRequestException(
        'A partida ainda não foi finalizada e não pode ser processada.',
      );
    }

    if (fixture.homeGoals === null || fixture.awayGoals === null) {
      throw new BadRequestException(
        'A partida não possui placar final para processamento.',
      );
    }

    const predictions = await this.prisma.prediction.findMany({
      where: {
        fixtureId,
      },
    });
    const affectedUserIds = [
      ...new Set(predictions.map((item) => item.userId)),
    ];

    const result = await this.prisma.$transaction(async (tx) => {
      const fixtureLock = await tx.fixture.updateMany({
        where: {
          id: fixture.id,
          processedAt: null,
        },
        data: {
          processedAt: new Date(),
        },
      });

      if (fixtureLock.count === 0) {
        return {
          alreadyProcessed: true,
          predictionsProcessed: 0,
          standingsUpdated: 0,
        };
      }

      for (const prediction of predictions) {
        const score = this.scoreEngine.calculate(prediction, fixture);

        await tx.prediction.update({
          where: {
            id: prediction.id,
          },
          data: score,
        });
      }

      for (const userId of affectedUserIds) {
        await this.refreshUserStanding(tx, userId, fixture.seasonId);
      }

      return {
        alreadyProcessed: false,
        predictionsProcessed: predictions.length,
        standingsUpdated: affectedUserIds.length,
      };
    });

    return {
      fixtureId,
      ...result,
    };
  }

  private async refreshUserStanding(
    tx: Prisma.TransactionClient,
    userId: string,
    seasonId: string,
  ) {
    const predictions = await tx.prediction.findMany({
      where: {
        userId,
        fixture: {
          seasonId,
          status: FixtureStatus.FT,
        },
      },
      include: {
        fixture: true,
      },
    });
    const summary = predictions.reduce(
      (acc, prediction) => {
        const score = this.scoreEngine.calculate(
          {
            homeGoals: prediction.homeGoals,
            awayGoals: prediction.awayGoals,
          },
          {
            homeGoals: prediction.fixture.homeGoals,
            awayGoals: prediction.fixture.awayGoals,
          },
        );

        return {
          scorePoints: acc.scorePoints + score.scorePoints,
          totalPoints: acc.totalPoints + score.totalPoints,
          exactScores: acc.exactScores + Number(score.exactScore),
          correctWinners: acc.correctWinners + Number(score.correctWinner),
          wrongPredictions: acc.wrongPredictions + Number(!score.correctWinner),
        };
      },
      {
        scorePoints: 0,
        totalPoints: 0,
        exactScores: 0,
        correctWinners: 0,
        wrongPredictions: 0,
      },
    );

    await tx.standing.upsert({
      where: {
        seasonId_userId: {
          seasonId,
          userId,
        },
      },
      update: summary,
      create: {
        seasonId,
        userId,
        ...summary,
      },
    });
  }
}
