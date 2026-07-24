import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { FootballController } from './football.controller';
import { FootballService } from './football.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [
    HttpModule,
    PrismaModule,
  ],
  controllers: [FootballController],
  providers: [FootballService],
})
export class FootballModule {}