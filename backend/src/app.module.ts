import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';

import { PrismaModule } from './common/prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { FootballModule } from './modules/football/football.module';
import { PredictionsModule } from './modules/predictions/predictions.module';
import { StandingsModule } from './modules/standings/standings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    ScheduleModule.forRoot(),

    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 60,
      },
    ]),

    PrismaModule,

    UsersModule,

    AuthModule,

    FootballModule,

    PredictionsModule,

    StandingsModule,
  ],
})
export class AppModule {}
