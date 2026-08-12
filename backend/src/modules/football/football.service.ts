import { HttpService } from '@nestjs/axios';
import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

@Injectable()
export class FootballService {
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

  private get espnLeague(): string {
    return this.configService.get<string>('ESPN_LEAGUE') ?? this.defaultLeague;
  }

  private get espnCountry(): string {
    return (
      this.configService.get<string>('ESPN_COUNTRY') ?? this.defaultCountry
    );
  }
}
