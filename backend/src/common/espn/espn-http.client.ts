import { HttpService } from '@nestjs/axios';
import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class EspnHttpClient {
  private readonly inFlight = new Map<string, Promise<unknown>>();
  private readonly defaultCoreBaseUrl = 'https://sports.core.api.espn.com/v2';
  private readonly defaultScoreboardBaseUrl =
    'https://site.web.api.espn.com/apis/site/v2';
  private readonly defaultStandingsBaseUrl =
    'https://site.web.api.espn.com/apis/v2';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  getScoreboard<TResponse>(league: string, dates: string) {
    return this.get<TResponse>(
      this.scoreboardBaseUrl,
      `/sports/soccer/${encodeURIComponent(league)}/scoreboard?limit=1000&dates=${encodeURIComponent(dates)}`,
    );
  }

  getSummary<TResponse>(league: string, eventId: string) {
    return this.get<TResponse>(
      this.scoreboardBaseUrl,
      `/sports/soccer/${encodeURIComponent(league)}/summary?event=${encodeURIComponent(eventId)}`,
    );
  }

  getStandings<TResponse>(league: string, season?: number) {
    const params = new URLSearchParams({
      contentorigin: 'espn',
      isqualified: 'true',
      lang: 'en',
      level: '0',
      region: 'us',
      sort: 'rank:asc',
      type: '0',
    });

    if (season !== undefined) {
      params.set('season', String(season));
    }

    return this.get<TResponse>(
      this.standingsBaseUrl,
      `/sports/soccer/${encodeURIComponent(league)}/standings?${params.toString()}`,
    );
  }

  getCore<TResponse>(path: string) {
    return this.get<TResponse>(this.coreBaseUrl, path);
  }

  getRef<TResponse>(url: string) {
    const secureUrl = url.replace(/^http:\/\//, 'https://');

    return this.request<TResponse>(secureUrl);
  }

  private get<TResponse>(baseUrl: string, path: string) {
    const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
    const normalizedPath = path.replace(/^\/+/, '');

    return this.request<TResponse>(`${normalizedBaseUrl}/${normalizedPath}`);
  }

  private request<TResponse>(url: string): Promise<TResponse> {
    const current = this.inFlight.get(url) as Promise<TResponse> | undefined;

    if (current) {
      return current;
    }

    const request = firstValueFrom(
      this.httpService.get<TResponse>(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }),
    )
      .then((response) => response.data)
      .catch((error: AxiosError) => {
        const status = error.response?.status;
        const statusText = error.response?.statusText;

        throw new BadGatewayException(
          `Falha ao consultar ESPN${status ? ` (${status} ${statusText ?? ''})` : ''}.`,
        );
      })
      .finally(() => {
        this.inFlight.delete(url);
      });

    this.inFlight.set(url, request);

    return request;
  }

  private get coreBaseUrl() {
    return (
      this.configService.get<string>('ESPN_CORE_API_URL') ??
      this.defaultCoreBaseUrl
    );
  }

  private get scoreboardBaseUrl() {
    return (
      this.configService.get<string>('ESPN_SCOREBOARD_API_URL') ??
      this.defaultScoreboardBaseUrl
    );
  }

  private get standingsBaseUrl() {
    return (
      this.configService.get<string>('ESPN_STANDINGS_API_URL') ??
      this.defaultStandingsBaseUrl
    );
  }
}
