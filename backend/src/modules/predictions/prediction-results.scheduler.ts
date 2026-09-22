import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FixtureStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { DailyGamesService } from '../daily-games/daily-games.service';
import {
  DAILY_GAMES_TIMEZONE,
  DailyGame,
} from '../daily-games/types/daily-game.types';
import { FootballService } from '../football/football.service';
import { PredictionProcessorService } from './prediction-processor.service';

const predictionCompetitionId = 'eng.1' as const;
const gateDateOffsets = [-2, -1, 0, 1] as const;

@Injectable()
export class PredictionResultsScheduler {
  private readonly logger = new Logger(PredictionResultsScheduler.name);
  private readonly reconciledFingerprints = new Map<string, string>();
  private startupReconciliationPending = true;
  private lastDailyReconciliationAttemptDate: string | null = null;

  constructor(
    private readonly dailyGamesService: DailyGamesService,
    private readonly footballService: FootballService,
    private readonly predictionProcessor: PredictionProcessorService,
    private readonly prisma: PrismaService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES, { waitForCompletion: true })
  async syncAndProcessFinishedFixtures() {
    const today = this.formatDateInSaoPaulo(new Date());
    const shouldRunFullReconciliation =
      this.startupReconciliationPending ||
      this.lastDailyReconciliationAttemptDate !== today;

    if (shouldRunFullReconciliation) {
      this.startupReconciliationPending = false;
      this.lastDailyReconciliationAttemptDate = today;
    }

    let games: DailyGame[] = [];

    try {
      games = await this.findPredictionCompetitionGames(today);
    } catch (error) {
      this.logger.error(
        'Falha ao consultar a ESPN para avaliar resultados pendentes.',
        error instanceof Error ? error.stack : undefined,
      );

      if (shouldRunFullReconciliation) {
        await this.tryReconciliation();
      }

      return;
    }

    if (shouldRunFullReconciliation) {
      const reconciled = await this.tryReconciliation();

      if (reconciled) {
        this.rememberFingerprints(games);
      }

      return;
    }

    const changedGames = games.filter(
      (game) =>
        this.reconciledFingerprints.get(game.sourceEventId) !==
        this.createFingerprint(game),
    );
    const apiFixtureIds = changedGames
      .map((game) => this.toApiFixtureId(game.sourceEventId))
      .filter((id): id is number => id !== null);

    if (apiFixtureIds.length === 0) {
      return;
    }

    const reconciled = await this.tryReconciliation(apiFixtureIds);

    if (reconciled) {
      this.rememberFingerprints(changedGames);
    }
  }

  private async tryReconciliation(apiFixtureIds?: number[]) {
    try {
      await this.reconcileFixtures(apiFixtureIds);
      return true;
    } catch (error) {
      this.logger.error(
        'Falha ao sincronizar ou processar resultados pendentes.',
        error instanceof Error ? error.stack : undefined,
      );
      return false;
    }
  }

  private async reconcileFixtures(apiFixtureIds?: number[]) {
    if (apiFixtureIds?.length === 0) {
      return;
    }

    this.logger.log('Sincronizando resultados das fixtures pendentes.');

    const syncResult = await this.footballService.syncResults(apiFixtureIds);
    const finishedFixtures = await this.prisma.fixture.findMany({
      where: {
        status: FixtureStatus.FT,
        processedAt: null,
        ...(apiFixtureIds
          ? {
              apiFixtureId: {
                in: apiFixtureIds,
              },
            }
          : {}),
      },
      select: {
        id: true,
      },
    });

    for (const fixture of finishedFixtures) {
      await this.predictionProcessor.processFixture(fixture.id);
    }

    this.logger.log(
      `Resultados sincronizados: checked=${syncResult.checked}, updated=${syncResult.updated}, processed=${finishedFixtures.length}.`,
    );
  }

  private async findPredictionCompetitionGames(today: string) {
    const responses = await Promise.all(
      gateDateOffsets.map((offset) =>
        this.dailyGamesService.findDailyGames(
          this.addDays(today, offset),
          predictionCompetitionId,
        ),
      ),
    );
    const gamesBySourceEventId = new Map<string, DailyGame>();

    for (const response of responses) {
      if (response.meta.failedCompetitions > 0) {
        this.logger.warn(
          `Consulta ESPN parcial para resultados em ${response.date}.`,
        );
      }

      for (const competition of response.competitions) {
        if (competition.id !== predictionCompetitionId) {
          continue;
        }

        for (const game of competition.games) {
          if (this.toApiFixtureId(game.sourceEventId) !== null) {
            gamesBySourceEventId.set(game.sourceEventId, game);
          }
        }
      }
    }

    return [...gamesBySourceEventId.values()];
  }

  private rememberFingerprints(games: DailyGame[]) {
    for (const game of games) {
      this.reconciledFingerprints.set(
        game.sourceEventId,
        this.createFingerprint(game),
      );
    }
  }

  private createFingerprint(game: DailyGame) {
    return JSON.stringify([
      game.sourceEventId,
      game.kickoff,
      game.status,
      game.score.home,
      game.score.away,
      game.shootoutScore?.home ?? null,
      game.shootoutScore?.away ?? null,
    ]);
  }

  private toApiFixtureId(sourceEventId: string): number | null {
    if (!/^\d+$/.test(sourceEventId)) {
      return null;
    }

    const apiFixtureId = Number(sourceEventId);

    return Number.isSafeInteger(apiFixtureId) ? apiFixtureId : null;
  }

  private addDays(date: string, days: number) {
    const [year, month, day] = date.split('-').map(Number);
    const value = new Date(Date.UTC(year, month - 1, day + days, 12));

    return this.formatPlainDate(value);
  }

  private formatDateInSaoPaulo(date: Date) {
    const parts = new Intl.DateTimeFormat('en-US', {
      day: '2-digit',
      month: '2-digit',
      timeZone: DAILY_GAMES_TIMEZONE,
      year: 'numeric',
    }).formatToParts(date);
    const getPart = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value ?? '';

    return `${getPart('year')}-${getPart('month')}-${getPart('day')}`;
  }

  private formatPlainDate(date: Date) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
