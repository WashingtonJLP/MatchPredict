import { BadGatewayException, Injectable } from '@nestjs/common';

import { EspnHttpClient } from '../../common/espn/espn-http.client';

import { EspnScoreboardResponse } from './types/espn-scoreboard.types';

@Injectable()
export class DailyGamesEspnClient {
  constructor(private readonly espnClient: EspnHttpClient) {}

  async getScoreboard(
    league: string,
    dates: string,
  ): Promise<EspnScoreboardResponse> {
    const response =
      await this.espnClient.getScoreboard<EspnScoreboardResponse>(
        league,
        dates,
      );

    if (!Array.isArray(response.events)) {
      throw new BadGatewayException('Lista de jogos da ESPN invalida.');
    }

    return response;
  }
}
