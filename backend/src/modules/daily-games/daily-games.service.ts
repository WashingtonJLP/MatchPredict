import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { DailyGamesEspnClient } from './daily-games-espn.client';
import {
  DAILY_GAMES_COMPETITIONS,
  DAILY_GAMES_COMPETITIONS_VERSION,
  DAILY_GAMES_TIMEZONE,
  DailyGame,
  DailyGamesCompetition,
  DailyGamesCompetitionConfig,
  DailyGamesResponse,
  DailyGameStatus,
} from './types/daily-game.types';
import {
  EspnScoreboardCompetition,
  EspnScoreboardCompetitor,
  EspnScoreboardEvent,
  EspnScoreboardLeague,
  EspnScoreboardStatus,
} from './types/espn-scoreboard.types';

type CachedDailyGames = {
  expiresAt: number;
  response: DailyGamesResponse;
};

type CompetitionResult = {
  competition: DailyGamesCompetition;
  success: boolean;
};

const statusLabels: Record<DailyGameStatus, string> = {
  SCHEDULED: 'Pré-jogo',
  LIVE: 'Ao vivo',
  HALFTIME: 'Intervalo',
  FINAL: 'Encerrado',
  FINAL_PENALTIES: 'Encerrado nos pênaltis',
  DELAYED: 'Atrasado',
  POSTPONED: 'Adiado',
  CANCELED: 'Cancelado',
  SUSPENDED: 'Suspenso',
  UNKNOWN: 'Status desconhecido',
};

@Injectable()
export class DailyGamesService {
  private readonly cache = new Map<string, CachedDailyGames>();
  private readonly logger = new Logger(DailyGamesService.name);
  private readonly timezone = DAILY_GAMES_TIMEZONE;

  constructor(private readonly espnClient: DailyGamesEspnClient) {}

  async findDailyGames(date: string): Promise<DailyGamesResponse> {
    this.ensureValidPlainDate(date);

    const cacheKey = this.buildCacheKey(date);
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.response;
    }

    const dates = this.buildEspnDateRange(date);
    const results = await Promise.all(
      DAILY_GAMES_COMPETITIONS.map((competition) =>
        this.fetchCompetition(competition, date, dates),
      ),
    );
    const successfulResults = results.filter((result) => result.success);
    const competitions = successfulResults
      .map((result) => result.competition)
      .filter((competition) => competition.games.length > 0);
    const hasLiveGame = competitions.some((competition) =>
      competition.games.some((game) =>
        ['LIVE', 'HALFTIME', 'DELAYED', 'SUSPENDED'].includes(game.status),
      ),
    );
    const cacheTtlSeconds = this.resolveCacheTtlSeconds(date, hasLiveGame);
    const response: DailyGamesResponse = {
      date,
      timezone: this.timezone,
      competitions,
      meta: {
        generatedAt: new Date().toISOString(),
        cacheTtlSeconds,
        requestedCompetitions: DAILY_GAMES_COMPETITIONS.length,
        successfulCompetitions: successfulResults.length,
        failedCompetitions: results.length - successfulResults.length,
      },
    };

    this.cache.set(cacheKey, {
      response,
      expiresAt: Date.now() + cacheTtlSeconds * 1000,
    });

    return response;
  }

  private async fetchCompetition(
    competitionConfig: DailyGamesCompetitionConfig,
    requestedDate: string,
    dates: string,
  ): Promise<CompetitionResult> {
    try {
      const scoreboard = await this.espnClient.getScoreboard(
        competitionConfig.id,
        dates,
      );
      const league = scoreboard.leagues?.[0];
      const games = (scoreboard.events ?? [])
        .map((event) =>
          this.toDailyGame(event, competitionConfig.id, requestedDate),
        )
        .filter((game): game is DailyGame => game !== null)
        .sort((a, b) => a.kickoff.localeCompare(b.kickoff));

      return {
        success: true,
        competition: {
          id: competitionConfig.id,
          name: competitionConfig.name,
          logo: this.resolveLeagueLogo(league),
          games,
        },
      };
    } catch (error) {
      this.logger.warn(
        `Falha ao consultar jogos diarios da competicao ${competitionConfig.id}: ${
          error instanceof Error ? error.message : 'erro desconhecido'
        }`,
      );

      return {
        success: false,
        competition: {
          id: competitionConfig.id,
          name: competitionConfig.name,
          logo: null,
          games: [],
        },
      };
    }
  }

  private toDailyGame(
    event: EspnScoreboardEvent,
    competitionId: string,
    requestedDate: string,
  ): DailyGame | null {
    const sourceEventId = event.id;
    const competition = event.competitions?.[0];
    const kickoffSource = competition?.date ?? event.date;

    if (!sourceEventId || !competition || !kickoffSource) {
      return null;
    }

    const kickoff = new Date(kickoffSource);

    if (Number.isNaN(kickoff.getTime())) {
      return null;
    }

    const localDate = this.formatLocalDate(kickoff);

    if (localDate !== requestedDate) {
      return null;
    }

    const homeCompetitor = competition.competitors?.find(
      (competitor) => competitor.homeAway === 'home',
    );
    const awayCompetitor = competition.competitors?.find(
      (competitor) => competitor.homeAway === 'away',
    );

    if (!homeCompetitor || !awayCompetitor) {
      return null;
    }

    const rawStatus = event.status ?? competition.status;
    const status = this.mapStatus(rawStatus, competition);
    const shouldExposeScore = this.shouldExposeScore(status, rawStatus);

    return {
      id: `espn:${competitionId}:${sourceEventId}`,
      sourceEventId,
      kickoff: kickoff.toISOString(),
      localDate,
      localTime: this.formatLocalTime(kickoff),
      status,
      statusLabel: statusLabels[status],
      minute: this.resolveMinute(event.status ?? competition.status),
      period: event.status?.period ?? competition.status?.period ?? null,
      homeTeam: this.toDailyGameTeam(homeCompetitor),
      awayTeam: this.toDailyGameTeam(awayCompetitor),
      score: {
        home: shouldExposeScore ? this.parseScore(homeCompetitor.score) : null,
        away: shouldExposeScore ? this.parseScore(awayCompetitor.score) : null,
      },
    };
  }

  private toDailyGameTeam(competitor: EspnScoreboardCompetitor) {
    const team = competitor.team;
    const id = team?.id ?? competitor.id ?? '';

    return {
      id,
      name:
        team?.displayName ??
        team?.shortDisplayName ??
        team?.name ??
        `Time ${id || 'desconhecido'}`,
      abbreviation: team?.abbreviation ?? null,
      logo: team?.logo ?? null,
    };
  }

  private mapStatus(
    status: EspnScoreboardStatus | undefined,
    competition: EspnScoreboardCompetition,
  ): DailyGameStatus {
    const statusName = status?.type?.name;
    const state = status?.type?.state;
    const completed = status?.type?.completed;

    if (competition.wasSuspended) {
      return 'SUSPENDED';
    }

    if (statusName === 'STATUS_FINAL_PEN') {
      return 'FINAL_PENALTIES';
    }

    if (completed || statusName === 'STATUS_FULL_TIME') {
      return 'FINAL';
    }

    if (statusName === 'STATUS_HALFTIME') {
      return 'HALFTIME';
    }

    if (statusName === 'STATUS_DELAYED') {
      return 'DELAYED';
    }

    if (statusName === 'STATUS_POSTPONED') {
      return 'POSTPONED';
    }

    if (
      statusName === 'STATUS_CANCELED' ||
      statusName === 'STATUS_CANCELLED' ||
      statusName === 'STATUS_ABANDONED'
    ) {
      return 'CANCELED';
    }

    if (state === 'in') {
      return 'LIVE';
    }

    if (state === 'pre' || statusName === 'STATUS_SCHEDULED') {
      return 'SCHEDULED';
    }

    return 'UNKNOWN';
  }

  private resolveMinute(
    status: EspnScoreboardStatus | undefined,
  ): number | null {
    const displayClock = status?.displayClock ?? status?.type?.detail;
    const [minuteText] = displayClock?.match(/\d+/) ?? [];
    const minute = Number(minuteText);

    return Number.isInteger(minute) ? minute : null;
  }

  private shouldExposeScore(
    status: DailyGameStatus,
    rawStatus: EspnScoreboardStatus | undefined,
  ): boolean {
    if (['LIVE', 'HALFTIME', 'FINAL', 'FINAL_PENALTIES'].includes(status)) {
      return true;
    }

    if (status === 'SCHEDULED') {
      return false;
    }

    return this.hasMatchStarted(rawStatus);
  }

  private hasMatchStarted(status: EspnScoreboardStatus | undefined): boolean {
    const period = status?.period ?? 0;
    const clock = status?.clock ?? 0;
    const minute = this.resolveMinute(status) ?? 0;

    return period > 0 || clock > 0 || minute > 0;
  }

  private parseScore(score: string | undefined): number | null {
    if (score === undefined || score === '') {
      return null;
    }

    const parsedScore = Number(score);

    return Number.isInteger(parsedScore) ? parsedScore : null;
  }

  private resolveLeagueLogo(league: EspnScoreboardLeague | undefined) {
    return (
      league?.logos?.find((logo) => logo.rel?.includes('default'))?.href ??
      league?.logos?.[0]?.href ??
      null
    );
  }

  private buildEspnDateRange(date: string): string {
    return `${this.formatEspnDate(this.addDays(date, -1))}-${this.formatEspnDate(
      this.addDays(date, 1),
    )}`;
  }

  private addDays(date: string, days: number): Date {
    const { day, month, year } = this.parsePlainDate(date);

    return new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0, 0));
  }

  private formatEspnDate(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');

    return `${year}${month}${day}`;
  }

  private formatLocalDate(date: Date): string {
    const parts = new Intl.DateTimeFormat('en-US', {
      day: '2-digit',
      month: '2-digit',
      timeZone: this.timezone,
      year: 'numeric',
    }).formatToParts(date);

    return `${this.getDatePart(parts, 'year')}-${this.getDatePart(
      parts,
      'month',
    )}-${this.getDatePart(parts, 'day')}`;
  }

  private formatLocalTime(date: Date): string {
    const parts = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      hourCycle: 'h23',
      minute: '2-digit',
      timeZone: this.timezone,
    }).formatToParts(date);

    return `${this.getDatePart(parts, 'hour')}:${this.getDatePart(
      parts,
      'minute',
    )}`;
  }

  private getDatePart(
    parts: Intl.DateTimeFormatPart[],
    type: Intl.DateTimeFormatPartTypes,
  ): string {
    return parts.find((part) => part.type === type)?.value ?? '';
  }

  private resolveCacheTtlSeconds(date: string, hasLiveGame: boolean): number {
    if (hasLiveGame) {
      return 30;
    }

    const today = this.formatLocalDate(new Date());

    if (date < today) {
      return 21_600;
    }

    if (date === today) {
      return 60;
    }

    return 1_800;
  }

  private buildCacheKey(date: string): string {
    return [
      'daily-games',
      date,
      this.timezone,
      DAILY_GAMES_COMPETITIONS_VERSION,
    ].join(':');
  }

  private ensureValidPlainDate(date: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('date deve estar no formato YYYY-MM-DD.');
    }

    const { day, month, year } = this.parsePlainDate(date);
    const parsedDate = new Date(Date.UTC(year, month - 1, day));

    if (
      parsedDate.getUTCFullYear() !== year ||
      parsedDate.getUTCMonth() + 1 !== month ||
      parsedDate.getUTCDate() !== day
    ) {
      throw new BadRequestException('date deve ser uma data valida.');
    }
  }

  private parsePlainDate(date: string) {
    const [year, month, day] = date.split('-').map(Number);

    return {
      day,
      month,
      year,
    };
  }
}
