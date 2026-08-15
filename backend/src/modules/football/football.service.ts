import { HttpService } from '@nestjs/axios';
import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FixtureStatus, Team, WinnerType } from '@prisma/client';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../../common/prisma/prisma.service';

type EspnLogo = {
  href?: string;
  rel?: string[];
};

type EspnLeague = {
  id: string;
  logos?: EspnLogo[];
  name: string;
  slug: string;
  teams?: Array<{ team: EspnTeam }>;
};

type EspnTeam = {
  displayName?: string;
  id: string;
  location?: string;
  logos?: EspnLogo[];
  name?: string;
};

type EspnAthlete = {
  displayName?: string;
  fullName?: string;
  headshot?: {
    href?: string;
  };
  id?: string;
  jersey?: string;
  name?: string;
  number?: number | string;
  position?: {
    abbreviation?: string;
    displayName?: string;
    name?: string;
  };
};

type EspnRosterGroup = {
  athletes?: EspnAthlete[];
  items?: EspnAthlete[];
};

type EspnTeamAthletesResponse = {
  athletes?: Array<EspnAthlete | EspnRosterGroup>;
  team?: {
    athletes?: Array<EspnAthlete | EspnRosterGroup>;
  };
};

type EspnTeamsResponse = {
  sports?: Array<{
    leagues?: EspnLeague[];
  }>;
};

type EspnSeasonResponse = {
  abbreviation?: string;
  displayName?: string;
  endDate: string;
  shortDisplayName?: string;
  startDate: string;
  year: number;
};

type EspnRef = {
  $ref: string;
};

type EspnEventsResponse = {
  count: number;
  items?: EspnRef[];
};

type EspnEventResponse = {
  competitions?: EspnRef;
  date: string;
  id: string;
};

type EspnCompetitionResponse = {
  competitors?: EspnRef[];
  date?: string;
  status?: EspnRef;
};

type EspnStatusResponse = {
  type?: {
    completed?: boolean;
    name?: string;
    state?: string;
  };
};

type EspnCompetitorResponse = {
  homeAway?: 'home' | 'away';
  id: string;
  score?: EspnRef;
  winner?: boolean;
};

type EspnScoreResponse = {
  value?: number;
};

type FixtureSyncData = {
  apiFixtureId: number;
  awayGoals: number | null;
  awayTeamId: string;
  homeGoals: number | null;
  homeTeamId: string;
  kickoff: Date;
  round: number;
  seasonId: string;
  status: FixtureStatus;
  winnerType: WinnerType | null;
};

type FixtureResultData = {
  awayGoals: number | null;
  homeGoals: number | null;
  kickoff: Date;
  status: FixtureStatus;
  winnerType: WinnerType | null;
};

type PlayerSyncData = {
  apiPlayerId: number;
  name: string;
  number: number | null;
  photo: string | null;
  position: string | null;
  teamId: string;
};

@Injectable()
export class FootballService {
  private readonly logger = new Logger(FootballService.name);
  private readonly defaultLeague = 'eng.1';
  private readonly defaultCountry = 'England';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async syncLeague() {
    const [espnLeague, espnSeason] = await Promise.all([
      this.getEspnLeague(),
      this.getCurrentEspnSeason(),
    ]);

    const league = await this.prisma.league.upsert({
      where: {
        apiLeagueId: Number(espnLeague.id),
      },
      update: {
        name: espnLeague.name,
        country: this.espnCountry,
        logo: this.resolveLeagueLogo(espnLeague.logos),
        isActive: true,
      },
      create: {
        apiLeagueId: Number(espnLeague.id),
        name: espnLeague.name,
        country: this.espnCountry,
        logo: this.resolveLeagueLogo(espnLeague.logos),
        isActive: true,
      },
    });

    await this.prisma.season.updateMany({
      where: {
        leagueId: league.id,
        year: {
          not: espnSeason.year,
        },
      },
      data: {
        isActive: false,
      },
    });

    const season = await this.prisma.season.upsert({
      where: {
        leagueId_year: {
          leagueId: league.id,
          year: espnSeason.year,
        },
      },
      update: {
        name: this.resolveSeasonName(espnSeason),
        startDate: new Date(espnSeason.startDate),
        endDate: new Date(espnSeason.endDate),
        isActive: true,
      },
      create: {
        leagueId: league.id,
        year: espnSeason.year,
        name: this.resolveSeasonName(espnSeason),
        startDate: new Date(espnSeason.startDate),
        endDate: new Date(espnSeason.endDate),
        isActive: true,
      },
    });

    return {
      league,
      season,
    };
  }

  async syncTeams() {
    const espnLeague = await this.getEspnLeague();
    const teams = espnLeague.teams ?? [];
    const teamIds = teams.map((item) => Number(item.team.id));
    const existingTeams = await this.prisma.team.findMany({
      where: {
        apiTeamId: {
          in: teamIds,
        },
      },
      select: {
        apiTeamId: true,
      },
    });
    const existingTeamIds = new Set(
      existingTeams.map((team) => team.apiTeamId),
    );
    let created = 0;
    let updated = 0;

    for (const item of teams) {
      const team = item.team;
      const apiTeamId = Number(team.id);

      if (!Number.isInteger(apiTeamId)) {
        throw new BadGatewayException('ID do time da ESPN inválido.');
      }

      const data = {
        name: this.resolveTeamName(team),
        logo: this.resolveTeamLogo(team.logos),
        country: this.espnCountry,
      };

      await this.prisma.team.upsert({
        where: {
          apiTeamId,
        },
        update: data,
        create: {
          apiTeamId,
          ...data,
        },
      });

      if (existingTeamIds.has(apiTeamId)) {
        updated++;
      } else {
        created++;
      }
    }

    return {
      created,
      updated,
      total: teams.length,
    };
  }

  async syncFixtures() {
    const season = await this.getActiveSeason();
    const espnEvents = await this.getSeasonEvents(season.year);
    const eventRefs = espnEvents.items ?? [];
    const apiFixtureIds = eventRefs
      .map((eventRef) => this.extractIdFromRef(eventRef.$ref))
      .filter((eventId): eventId is number => eventId !== null);
    const existingFixtures = await this.prisma.fixture.findMany({
      where: {
        apiFixtureId: {
          in: apiFixtureIds,
        },
      },
      select: {
        apiFixtureId: true,
      },
    });
    const existingFixtureIds = new Set(
      existingFixtures.map((fixture) => fixture.apiFixtureId),
    );
    const teamsByApiId = await this.getTeamsByApiId();
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const eventRef of eventRefs) {
      const fixtureData = await this.buildFixtureSyncData(
        eventRef.$ref,
        season.id,
        teamsByApiId,
      );

      if (!fixtureData) {
        skipped++;
        continue;
      }

      await this.prisma.fixture.upsert({
        where: {
          apiFixtureId: fixtureData.apiFixtureId,
        },
        update: {
          seasonId: fixtureData.seasonId,
          homeTeamId: fixtureData.homeTeamId,
          awayTeamId: fixtureData.awayTeamId,
          round: fixtureData.round,
          kickoff: fixtureData.kickoff,
          status: fixtureData.status,
          homeGoals: fixtureData.homeGoals,
          awayGoals: fixtureData.awayGoals,
          winnerType: fixtureData.winnerType,
        },
        create: fixtureData,
      });

      if (existingFixtureIds.has(fixtureData.apiFixtureId)) {
        updated++;
      } else {
        created++;
      }
    }

    return {
      fixturesFound: espnEvents.count,
      created,
      updated,
      skipped,
    };
  }

  async syncResults() {
    const pendingFixtures = await this.prisma.fixture.findMany({
      where: {
        status: {
          not: FixtureStatus.FT,
        },
      },
      select: {
        apiFixtureId: true,
        awayGoals: true,
        homeGoals: true,
        id: true,
        kickoff: true,
        status: true,
        winnerType: true,
      },
    });
    let updated = 0;
    let finished = 0;
    let unchanged = 0;

    for (const fixture of pendingFixtures) {
      const resultData = await this.getFixtureResultData(fixture.apiFixtureId);

      if (!resultData) {
        unchanged++;
        continue;
      }

      const hasChanges =
        fixture.status !== resultData.status ||
        fixture.kickoff.getTime() !== resultData.kickoff.getTime() ||
        fixture.homeGoals !== resultData.homeGoals ||
        fixture.awayGoals !== resultData.awayGoals ||
        fixture.winnerType !== resultData.winnerType;

      if (!hasChanges) {
        unchanged++;
        continue;
      }

      await this.prisma.fixture.update({
        where: {
          id: fixture.id,
        },
        data: resultData,
      });

      updated++;

      if (resultData.status === FixtureStatus.FT) {
        finished++;
      }
    }

    return {
      checked: pendingFixtures.length,
      updated,
      finished,
      unchanged,
    };
  }

  async syncPlayers() {
    const teams = await this.prisma.team.findMany({
      select: {
        apiTeamId: true,
        id: true,
      },
    });
    const apiPlayerIds = new Set<number>();
    const playerDataByApiId = new Map<number, PlayerSyncData>();

    for (const team of teams) {
      const athletes = await this.getTeamAthletes(team.apiTeamId);

      for (const athlete of athletes) {
        const playerData = this.toPlayerSyncData(athlete, team.id);

        if (!playerData) {
          continue;
        }

        apiPlayerIds.add(playerData.apiPlayerId);
        playerDataByApiId.set(playerData.apiPlayerId, playerData);
      }
    }

    const existingPlayers = await this.prisma.player.findMany({
      where: {
        apiPlayerId: {
          in: [...apiPlayerIds],
        },
      },
      select: {
        apiPlayerId: true,
      },
    });
    const existingPlayerIds = new Set(
      existingPlayers.map((player) => player.apiPlayerId),
    );
    let created = 0;
    let updated = 0;

    for (const playerData of playerDataByApiId.values()) {
      await this.prisma.player.upsert({
        where: {
          apiPlayerId: playerData.apiPlayerId,
        },
        update: {
          teamId: playerData.teamId,
          name: playerData.name,
          number: playerData.number,
          position: playerData.position,
          photo: playerData.photo,
        },
        create: playerData,
      });

      if (existingPlayerIds.has(playerData.apiPlayerId)) {
        updated++;
      } else {
        created++;
      }
    }

    return {
      created,
      updated,
    };
  }

  private async getEspn<TResponse = unknown>(path: string): Promise<TResponse> {
    const baseUrl = this.configService.get<string>('ESPN_API_URL');

    if (!baseUrl) {
      throw new InternalServerErrorException('ESPN_API_URL não configurada.');
    }

    const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
    const normalizedPath = path.replace(/^\/+/, '');
    const url = `${normalizedBaseUrl}/${normalizedPath}`;

    try {
      const response = await firstValueFrom(
        this.httpService.get<TResponse>(url),
      );

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;
      const statusText = axiosError.response?.statusText;

      throw new BadGatewayException(
        `Falha ao consultar ESPN${status ? ` (${status} ${statusText ?? ''})` : ''}.`,
      );
    }
  }

  private async getEspnCore<TResponse = unknown>(
    path: string,
  ): Promise<TResponse> {
    const baseUrl = this.configService.get<string>('ESPN_CORE_API_URL');

    if (!baseUrl) {
      throw new InternalServerErrorException(
        'ESPN_CORE_API_URL não configurada.',
      );
    }

    const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
    const normalizedPath = path.replace(/^\/+/, '');
    const url = `${normalizedBaseUrl}/${normalizedPath}`;

    try {
      const response = await firstValueFrom(
        this.httpService.get<TResponse>(url),
      );

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;
      const statusText = axiosError.response?.statusText;

      throw new BadGatewayException(
        `Falha ao consultar ESPN Core${status ? ` (${status} ${statusText ?? ''})` : ''}.`,
      );
    }
  }

  private async getEspnCoreRef<TResponse = unknown>(
    url: string,
  ): Promise<TResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<TResponse>(url),
      );

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;
      const statusText = axiosError.response?.statusText;

      throw new BadGatewayException(
        `Falha ao consultar ESPN Core${status ? ` (${status} ${statusText ?? ''})` : ''}.`,
      );
    }
  }

  private async getEspnLeague(): Promise<EspnLeague> {
    const response = await this.getEspn<EspnTeamsResponse>(
      `/sports/soccer/${this.espnLeague}/teams`,
    );

    const league = response.sports?.[0]?.leagues?.find(
      (item) => item.slug === this.espnLeague,
    );

    if (!league) {
      throw new NotFoundException('Liga da ESPN não encontrada.');
    }

    if (!Number.isInteger(Number(league.id))) {
      throw new BadGatewayException('ID da liga da ESPN inválido.');
    }

    return league;
  }

  private async getCurrentEspnSeason(): Promise<EspnSeasonResponse> {
    const season = await this.getEspnCore<EspnSeasonResponse>(
      `/sports/soccer/leagues/${this.espnLeague}/season`,
    );

    if (!season.year || !season.startDate || !season.endDate) {
      throw new BadGatewayException('Temporada da ESPN inválida.');
    }

    return season;
  }

  private async getActiveSeason() {
    const league = await this.prisma.league.findFirst({
      where: {
        isActive: true,
      },
    });

    if (!league) {
      throw new NotFoundException('Liga ativa não encontrada.');
    }

    const season = await this.prisma.season.findFirst({
      where: {
        leagueId: league.id,
        isActive: true,
      },
    });

    if (!season) {
      throw new NotFoundException('Temporada ativa não encontrada.');
    }

    return season;
  }

  private async getSeasonEvents(year: number): Promise<EspnEventsResponse> {
    const events = await this.getEspnCore<EspnEventsResponse>(
      `/sports/soccer/leagues/${this.espnLeague}/seasons/${year}/types/1/events?limit=1000`,
    );

    if (!Array.isArray(events.items)) {
      throw new BadGatewayException('Lista de eventos da ESPN inválida.');
    }

    return events;
  }

  private async getTeamsByApiId(): Promise<Map<number, Team>> {
    const teams = await this.prisma.team.findMany();

    return new Map(teams.map((team) => [team.apiTeamId, team]));
  }

  private async getTeamAthletes(apiTeamId: number): Promise<EspnAthlete[]> {
    const teamDetails = await this.getEspnTeamDetails(apiTeamId);
    const teamAthletes = this.extractAthletes(teamDetails);

    if (teamAthletes.length > 0) {
      return teamAthletes;
    }

    const roster = await this.getEspnTeamRoster(apiTeamId);

    return this.extractAthletes(roster);
  }

  private getEspnTeamDetails(
    apiTeamId: number,
  ): Promise<EspnTeamAthletesResponse> {
    return this.getEspn<EspnTeamAthletesResponse>(
      `/sports/soccer/${this.espnLeague}/teams/${apiTeamId}`,
    );
  }

  private getEspnTeamRoster(
    apiTeamId: number,
  ): Promise<EspnTeamAthletesResponse> {
    return this.getEspn<EspnTeamAthletesResponse>(
      `/sports/soccer/${this.espnLeague}/teams/${apiTeamId}/roster`,
    );
  }

  private extractAthletes(response: EspnTeamAthletesResponse): EspnAthlete[] {
    const entries = response.athletes ?? response.team?.athletes ?? [];

    return entries.flatMap((entry) => {
      if (this.isEspnAthlete(entry)) {
        return [entry];
      }

      return entry.items ?? entry.athletes ?? [];
    });
  }

  private isEspnAthlete(
    entry: EspnAthlete | EspnRosterGroup,
  ): entry is EspnAthlete {
    return 'id' in entry;
  }

  private toPlayerSyncData(
    athlete: EspnAthlete,
    teamId: string,
  ): PlayerSyncData | null {
    const apiPlayerId = Number(athlete.id);

    if (!Number.isInteger(apiPlayerId)) {
      return null;
    }

    const name = athlete.displayName ?? athlete.fullName ?? athlete.name;

    if (!name) {
      return null;
    }

    return {
      apiPlayerId,
      teamId,
      name,
      number: this.resolvePlayerNumber(athlete),
      position: this.resolvePlayerPosition(athlete),
      photo: athlete.headshot?.href ?? null,
    };
  }

  private resolvePlayerNumber(athlete: EspnAthlete): number | null {
    const number = athlete.number ?? athlete.jersey;

    if (number === undefined || number === null || number === '') {
      return null;
    }

    const parsedNumber = Number(number);

    return Number.isInteger(parsedNumber) ? parsedNumber : null;
  }

  private resolvePlayerPosition(athlete: EspnAthlete): string | null {
    return (
      athlete.position?.displayName ??
      athlete.position?.name ??
      athlete.position?.abbreviation ??
      null
    );
  }

  private async buildFixtureSyncData(
    eventRef: string,
    seasonId: string,
    teamsByApiId: Map<number, Team>,
  ): Promise<FixtureSyncData | null> {
    const event = await this.getEspnCoreRef<EspnEventResponse>(eventRef);

    if (!event.id || !event.date || !event.competitions?.$ref) {
      this.logger.warn(
        `Fixture ESPN ignorada por evento inválido: ${eventRef}`,
      );
      return null;
    }

    const apiFixtureId = Number(event.id);

    if (!Number.isInteger(apiFixtureId)) {
      this.logger.warn(`Fixture ESPN ignorada por ID inválido: ${event.id}`);
      return null;
    }

    const competition = await this.getEspnCoreRef<EspnCompetitionResponse>(
      event.competitions.$ref,
    );
    const competitors = await this.getFixtureCompetitors(competition);
    const homeCompetitor = competitors.find(
      (competitor) => competitor.homeAway === 'home',
    );
    const awayCompetitor = competitors.find(
      (competitor) => competitor.homeAway === 'away',
    );

    if (!homeCompetitor || !awayCompetitor) {
      this.logger.warn(
        `Fixture ESPN ${apiFixtureId} ignorada sem mandante/visitante.`,
      );
      return null;
    }

    const homeApiTeamId = Number(homeCompetitor.id);
    const awayApiTeamId = Number(awayCompetitor.id);
    const homeTeam = teamsByApiId.get(homeApiTeamId);
    const awayTeam = teamsByApiId.get(awayApiTeamId);

    if (!homeTeam || !awayTeam) {
      this.logger.warn(
        `Fixture ESPN ${apiFixtureId} ignorada por time ausente. home=${homeApiTeamId} away=${awayApiTeamId}`,
      );
      return null;
    }

    const status = await this.getFixtureStatus(competition);
    const [homeGoals, awayGoals] = await Promise.all([
      this.getCompetitorScore(homeCompetitor),
      this.getCompetitorScore(awayCompetitor),
    ]);
    const fixtureStatus = this.mapFixtureStatus(status);

    return {
      apiFixtureId,
      seasonId,
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      round: 0,
      kickoff: new Date(competition.date ?? event.date),
      status: fixtureStatus,
      homeGoals: this.shouldPersistGoals(fixtureStatus) ? homeGoals : null,
      awayGoals: this.shouldPersistGoals(fixtureStatus) ? awayGoals : null,
      winnerType: this.resolveWinnerType(
        homeCompetitor,
        awayCompetitor,
        status,
        homeGoals,
        awayGoals,
      ),
    };
  }

  private async getFixtureResultData(
    apiFixtureId: number,
  ): Promise<FixtureResultData | null> {
    const event = await this.getEspnCore<EspnEventResponse>(
      `/sports/soccer/leagues/${this.espnLeague}/events/${apiFixtureId}`,
    );

    if (!event.date || !event.competitions?.$ref) {
      this.logger.warn(
        `Resultado ESPN ignorado por evento inválido: ${apiFixtureId}`,
      );
      return null;
    }

    const competition = await this.getEspnCoreRef<EspnCompetitionResponse>(
      event.competitions.$ref,
    );
    const competitors = await this.getFixtureCompetitors(competition);
    const homeCompetitor = competitors.find(
      (competitor) => competitor.homeAway === 'home',
    );
    const awayCompetitor = competitors.find(
      (competitor) => competitor.homeAway === 'away',
    );

    if (!homeCompetitor || !awayCompetitor) {
      this.logger.warn(
        `Resultado ESPN ${apiFixtureId} ignorado sem mandante/visitante.`,
      );
      return null;
    }

    const status = await this.getFixtureStatus(competition);
    const fixtureStatus = this.mapFixtureStatus(status);
    const [homeGoals, awayGoals] = await Promise.all([
      this.getCompetitorScore(homeCompetitor),
      this.getCompetitorScore(awayCompetitor),
    ]);

    return {
      kickoff: new Date(competition.date ?? event.date),
      status: fixtureStatus,
      homeGoals: this.shouldPersistGoals(fixtureStatus) ? homeGoals : null,
      awayGoals: this.shouldPersistGoals(fixtureStatus) ? awayGoals : null,
      winnerType: this.resolveWinnerType(
        homeCompetitor,
        awayCompetitor,
        status,
        homeGoals,
        awayGoals,
      ),
    };
  }

  private async getFixtureCompetitors(
    competition: EspnCompetitionResponse,
  ): Promise<EspnCompetitorResponse[]> {
    const competitorRefs = competition.competitors ?? [];

    return Promise.all(
      competitorRefs.map((competitorRef) =>
        this.getEspnCoreRef<EspnCompetitorResponse>(competitorRef.$ref),
      ),
    );
  }

  private async getFixtureStatus(
    competition: EspnCompetitionResponse,
  ): Promise<EspnStatusResponse | null> {
    if (!competition.status?.$ref) {
      return null;
    }

    return this.getEspnCoreRef<EspnStatusResponse>(competition.status.$ref);
  }

  private async getCompetitorScore(
    competitor: EspnCompetitorResponse,
  ): Promise<number | null> {
    if (!competitor.score?.$ref) {
      return null;
    }

    const score = await this.getEspnCoreRef<EspnScoreResponse>(
      competitor.score.$ref,
    );

    return typeof score.value === 'number' ? score.value : null;
  }

  private resolveLeagueLogo(logos?: EspnLogo[]): string {
    return (
      logos?.find((logo) => logo.rel?.includes('default'))?.href ??
      logos?.[0]?.href ??
      this.configService.get<string>('ESPN_LEAGUE_LOGO') ??
      ''
    );
  }

  private resolveTeamLogo(logos?: EspnLogo[]): string {
    return (
      logos?.find((logo) => logo.rel?.includes('default'))?.href ??
      logos?.[0]?.href ??
      ''
    );
  }

  private resolveTeamName(team: EspnTeam): string {
    return team.displayName ?? team.name ?? team.location ?? `Team ${team.id}`;
  }

  private resolveSeasonName(season: EspnSeasonResponse): string {
    return (
      season.displayName ??
      season.shortDisplayName ??
      season.abbreviation ??
      String(season.year)
    );
  }

  private mapFixtureStatus(status: EspnStatusResponse | null): FixtureStatus {
    if (status?.type?.completed) {
      return FixtureStatus.FT;
    }

    if (status?.type?.state === 'in') {
      return FixtureStatus.LIVE;
    }

    if (status?.type?.name === 'STATUS_POSTPONED') {
      return FixtureStatus.POSTPONED;
    }

    if (
      status?.type?.name === 'STATUS_CANCELED' ||
      status?.type?.name === 'STATUS_CANCELLED'
    ) {
      return FixtureStatus.CANCELLED;
    }

    return FixtureStatus.NS;
  }

  private shouldPersistGoals(status: FixtureStatus): boolean {
    return status === FixtureStatus.FT || status === FixtureStatus.LIVE;
  }

  private resolveWinnerType(
    homeCompetitor: EspnCompetitorResponse,
    awayCompetitor: EspnCompetitorResponse,
    status: EspnStatusResponse | null,
    homeGoals: number | null,
    awayGoals: number | null,
  ): WinnerType | null {
    if (!status?.type?.completed) {
      return null;
    }

    if (homeCompetitor.winner) {
      return WinnerType.HOME;
    }

    if (awayCompetitor.winner) {
      return WinnerType.AWAY;
    }

    if (homeGoals !== null && awayGoals !== null && homeGoals === awayGoals) {
      return WinnerType.DRAW;
    }

    return null;
  }

  private extractIdFromRef(ref: string): number | null {
    const [, eventId] = ref.match(/\/events\/(\d+)/) ?? [];
    const parsedId = Number(eventId);

    return Number.isInteger(parsedId) ? parsedId : null;
  }

  private get espnLeague(): string {
    return this.configService.get<string>('ESPN_LEAGUE') ?? this.defaultLeague;
  }

  private get espnCountry(): string {
    return (
      this.configService.get<string>('ESPN_COUNTRY') ?? this.defaultCountry
    );
  }
}
