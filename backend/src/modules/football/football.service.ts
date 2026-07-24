import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class FootballService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async getLeagues() {
    const url = `${this.configService.get<string>('API_FOOTBALL_URL')}/leagues`;

    const response = await firstValueFrom(
      this.httpService.get(url, {
        headers: {
          'x-apisports-key': this.configService.get<string>(
            'API_FOOTBALL_KEY',
          ),
        },
      }),
    );

    return response.data;
  }

  async syncLeague() {
    const leagueId = 39;

    const url = `${this.configService.get<string>(
      'API_FOOTBALL_URL',
    )}/leagues?id=${leagueId}`;

    const response = await firstValueFrom(
      this.httpService.get(url, {
        headers: {
          'x-apisports-key': this.configService.get<string>(
            'API_FOOTBALL_KEY',
          ),
        },
      }),
    );

    const data = response.data.response[0];


    const league = await this.prisma.league.upsert({
      where: {
        apiLeagueId: data.league.id,
      },
      update: {
        name: data.league.name,
        country: data.country.name,
        logo: data.league.logo,
      },
      create: {
        apiLeagueId: data.league.id,
        name: data.league.name,
        country: data.country.name,
        logo: data.league.logo,
      },
    });


    const currentSeason = data.seasons.find(
      (season: any) => season.current,
    );

    if (!currentSeason) {
      throw new Error('Temporada atual não encontrada.');
    }

    
    const season = await this.prisma.season.upsert({
      where: {
        leagueId_year: {
          leagueId: league.id,
          year: currentSeason.year,
        },
      },
      update: {
        name: `${currentSeason.year}/${currentSeason.year + 1}`,
        startDate: new Date(currentSeason.start),
        endDate: new Date(currentSeason.end),
        isActive: currentSeason.current,
      },
      create: {
        leagueId: league.id,
        year: currentSeason.year,
        name: `${currentSeason.year}/${currentSeason.year + 1}`,
        startDate: new Date(currentSeason.start),
        endDate: new Date(currentSeason.end),
        isActive: currentSeason.current,
      },
    });

    return {
      message: 'League e Season sincronizadas com sucesso.',
      league,
      season,
    };
  }

  async syncTeams() {
    const leagueId = 39;
    const season = 2025;

    const url = `${this.configService.get<string>(
      'API_FOOTBALL_URL',
    )}/teams?league=${leagueId}&season=${season}`;

    const response = await firstValueFrom(
      this.httpService.get(url, {
        headers: {
          'x-apisports-key': this.configService.get<string>(
            'API_FOOTBALL_KEY',
          ),
        },
      }),
    );

    const teams = response.data.response;

    for (const item of teams) {
      await this.prisma.team.upsert({
        where: {
          apiTeamId: item.team.id,
        },
        update: {
          name: item.team.name,
          country: item.team.country,
          logo: item.team.logo,
        },
        create: {
          apiTeamId: item.team.id,
          name: item.team.name,
          country: item.team.country,
          logo: item.team.logo,
        },
      });
    }

    return {
      message: `${teams.length} times sincronizados com sucesso.`,
    };
  }
}