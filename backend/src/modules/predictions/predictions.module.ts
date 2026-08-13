import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { ScoreEngineService } from '../../common/score-engine/score-engine.service';
import { FootballModule } from '../football/football.module';
import { PredictionProcessorService } from './prediction-processor.service';
import { PredictionResultsScheduler } from './prediction-results.scheduler';
import { PredictionsController } from './predictions.controller';
import { PredictionsService } from './predictions.service';

@Module({
  imports: [PrismaModule, FootballModule],
  controllers: [PredictionsController],
  providers: [
    PredictionsService,
    PredictionProcessorService,
    PredictionResultsScheduler,
    ScoreEngineService,
  ],
})
export class PredictionsModule {}
