import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { ParticipationPeriodsService } from './participation-periods.service';
import { ParticipationsController } from './participations.controller';
import { ParticipationsService } from './participations.service';

@Module({
  imports: [PrismaModule],
  controllers: [ParticipationsController],
  providers: [ParticipationPeriodsService, ParticipationsService],
  exports: [ParticipationPeriodsService, ParticipationsService],
})
export class ParticipationsModule {}
