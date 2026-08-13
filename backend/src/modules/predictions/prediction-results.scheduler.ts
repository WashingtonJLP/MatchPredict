import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FixtureStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { FootballService } from '../football/football.service';
import { PredictionProcessorService } from './prediction-processor.service';

@Injectable()
export class PredictionResultsScheduler {
  private readonly logger = new Logger(PredictionResultsScheduler.name);

  constructor(
    private readonly footballService: FootballService,
    private readonly predictionProcessor: PredictionProcessorService,
    private readonly prisma: PrismaService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async syncAndProcessFinishedFixtures() {
    this.logger.log('Sincronizando resultados das fixtures pendentes.');

    const syncResult = await this.footballService.syncResults();
    const finishedFixtures = await this.prisma.fixture.findMany({
      where: {
        status: FixtureStatus.FT,
        processedAt: null,
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
}
