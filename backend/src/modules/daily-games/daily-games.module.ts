import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { DailyGamesController } from './daily-games.controller';
import { DailyGamesEspnClient } from './daily-games-espn.client';
import { DailyGamesService } from './daily-games.service';

@Module({
  imports: [HttpModule],
  controllers: [DailyGamesController],
  providers: [DailyGamesEspnClient, DailyGamesService],
})
export class DailyGamesModule {}
