import { Module } from '@nestjs/common';

import { EspnModule } from '../../common/espn/espn.module';

import { DailyGamesController } from './daily-games.controller';
import { DailyGamesEspnClient } from './daily-games-espn.client';
import { DailyGamesService } from './daily-games.service';

@Module({
  imports: [EspnModule],
  controllers: [DailyGamesController],
  providers: [DailyGamesEspnClient, DailyGamesService],
})
export class DailyGamesModule {}
