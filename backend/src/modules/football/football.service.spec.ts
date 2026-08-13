import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';

import { PrismaService } from '../../common/prisma/prisma.service';
import { FootballService } from './football.service';

describe('FootballService', () => {
  let service: FootballService;
  let httpGet: jest.Mock;
  let teamFindMany: jest.Mock;
  let playerFindMany: jest.Mock;
  let playerUpsert: jest.Mock;

  beforeEach(() => {
    httpGet = jest.fn();
    teamFindMany = jest.fn();
    playerFindMany = jest.fn();
    playerUpsert = jest.fn();

    const httpService = {
      get: httpGet,
    } as unknown as HttpService;
    const configService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          ESPN_API_URL: 'https://site.api.espn.com/apis/site/v2',
          ESPN_LEAGUE: 'eng.1',
        };

        return config[key];
      }),
    } as unknown as ConfigService;
    const prisma = {
      team: {
        findMany: teamFindMany,
      },
      player: {
        findMany: playerFindMany,
        upsert: playerUpsert,
      },
    } as unknown as PrismaService;

    service = new FootballService(httpService, configService, prisma);
  });

  it('sincroniza jogadores dos times cadastrados', async () => {
    teamFindMany.mockResolvedValue([
      {
        id: firstTeamId,
        apiTeamId: 359,
      },
      {
        id: secondTeamId,
        apiTeamId: 364,
      },
    ]);
    playerFindMany.mockResolvedValue([
      {
        apiPlayerId: 1001,
      },
    ]);
    httpGet
      .mockReturnValueOnce(
        of({
          data: {
            team: {
              id: '359',
            },
          },
        }),
      )
      .mockReturnValueOnce(
        of({
          data: {
            athletes: [
              {
                items: [
                  {
                    id: '1001',
                    displayName: 'Existing Player',
                    jersey: '7',
                    position: {
                      displayName: 'Forward',
                    },
                    headshot: {
                      href: 'https://example.com/player.png',
                    },
                  },
                  {
                    id: '1002',
                    fullName: 'New Player',
                  },
                ],
              },
            ],
          },
        }),
      )
      .mockReturnValueOnce(
        of({
          data: {
            team: {
              athletes: [
                {
                  id: '1003',
                  name: 'Direct Athlete',
                  number: 10,
                  position: {
                    abbreviation: 'MID',
                  },
                },
              ],
            },
          },
        }),
      );

    await expect(service.syncPlayers()).resolves.toEqual({
      created: 2,
      updated: 1,
    });

    expect(httpGet).toHaveBeenNthCalledWith(
      1,
      'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/teams/359',
    );
    expect(httpGet).toHaveBeenNthCalledWith(
      2,
      'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/teams/359/roster',
    );
    expect(httpGet).toHaveBeenNthCalledWith(
      3,
      'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/teams/364',
    );
    expect(playerFindMany).toHaveBeenCalledWith({
      where: {
        apiPlayerId: {
          in: [1001, 1002, 1003],
        },
      },
      select: {
        apiPlayerId: true,
      },
    });
    expect(playerUpsert).toHaveBeenCalledTimes(3);
    expect(playerUpsert).toHaveBeenNthCalledWith(1, {
      where: {
        apiPlayerId: 1001,
      },
      update: {
        teamId: firstTeamId,
        name: 'Existing Player',
        number: 7,
        position: 'Forward',
        photo: 'https://example.com/player.png',
      },
      create: {
        apiPlayerId: 1001,
        teamId: firstTeamId,
        name: 'Existing Player',
        number: 7,
        position: 'Forward',
        photo: 'https://example.com/player.png',
      },
    });
    expect(playerUpsert).toHaveBeenNthCalledWith(2, {
      where: {
        apiPlayerId: 1002,
      },
      update: {
        teamId: firstTeamId,
        name: 'New Player',
        number: null,
        position: null,
        photo: null,
      },
      create: {
        apiPlayerId: 1002,
        teamId: firstTeamId,
        name: 'New Player',
        number: null,
        position: null,
        photo: null,
      },
    });
    expect(playerUpsert).toHaveBeenNthCalledWith(3, {
      where: {
        apiPlayerId: 1003,
      },
      update: {
        teamId: secondTeamId,
        name: 'Direct Athlete',
        number: 10,
        position: 'MID',
        photo: null,
      },
      create: {
        apiPlayerId: 1003,
        teamId: secondTeamId,
        name: 'Direct Athlete',
        number: 10,
        position: 'MID',
        photo: null,
      },
    });
  });

  it('ignora atleta sem id numerico ou sem nome', async () => {
    teamFindMany.mockResolvedValue([
      {
        id: firstTeamId,
        apiTeamId: 359,
      },
    ]);
    playerFindMany.mockResolvedValue([]);
    httpGet.mockReturnValueOnce(
      of({
        data: {
          team: {
            id: '359',
          },
        },
      }),
    );
    httpGet.mockReturnValueOnce(
      of({
        data: {
          athletes: [
            {
              items: [
                {
                  id: 'invalid',
                  displayName: 'Invalid Id',
                },
                {
                  id: '1001',
                },
              ],
            },
          ],
        },
      }),
    );

    await expect(service.syncPlayers()).resolves.toEqual({
      created: 0,
      updated: 0,
    });
    expect(playerFindMany).toHaveBeenCalledWith({
      where: {
        apiPlayerId: {
          in: [],
        },
      },
      select: {
        apiPlayerId: true,
      },
    });
    expect(playerUpsert).not.toHaveBeenCalled();
  });
});

const firstTeamId = '11111111-1111-4111-8111-111111111111';
const secondTeamId = '22222222-2222-4222-8222-222222222222';
