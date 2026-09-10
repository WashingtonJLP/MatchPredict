import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { EspnHttpClient } from './espn-http.client';

@Module({
  imports: [HttpModule],
  providers: [EspnHttpClient],
  exports: [EspnHttpClient],
})
export class EspnModule {}
