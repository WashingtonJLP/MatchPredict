import { HttpService } from '@nestjs/axios';
import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';

import { EspnScoreboardResponse } from './types/espn-scoreboard.types';

@Injectable()
export class DailyGamesEspnClient {
  private readonly defaultScoreboardBaseUrl =
    'https://site.web.api.espn.com/apis/site/v2';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getScoreboard(
    league: string,
    dates: string,
  ): Promise<EspnScoreboardResponse> {
    const response = await this.getEspnScoreboard<EspnScoreboardResponse>(
      `/sports/soccer/${league}/scoreboard?dates=${dates}`,
    );

    if (!Array.isArray(response.events)) {
      throw new BadGatewayException('Lista de jogos da ESPN invalida.');
    }

    return response;
  }

  private async getEspnScoreboard<TResponse>(path: string): Promise<TResponse> {
    const normalizedBaseUrl = this.scoreboardBaseUrl.replace(/\/+$/, '');
    const normalizedPath = path.replace(/^\/+/, '');
    const url = `${normalizedBaseUrl}/${normalizedPath}`;

    try {
      const response = await firstValueFrom(
        this.httpService.get<TResponse>(url, {
          headers: {
            Accept: 'application/json',
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        }),
      );

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;
      const statusText = axiosError.response?.statusText;

      throw new BadGatewayException(
        `Falha ao consultar ESPN Scoreboard${status ? ` (${status} ${statusText ?? ''})` : ''}.`,
      );
    }
  }

  private get scoreboardBaseUrl(): string {
    return (
      this.configService.get<string>('ESPN_SCOREBOARD_API_URL') ??
      this.defaultScoreboardBaseUrl
    );
  }
}
