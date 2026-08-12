import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { ScoreEngineService } from '../../common/score-engine/score-engine.service';
import { PredictionsController } from './predictions.controller';
import { PredictionsService } from './predictions.service';

@Module({
  imports: [PrismaModule],
  controllers: [PredictionsController],
  providers: [PredictionsService, ScoreEngineService],
})
export class PredictionsModule {}
