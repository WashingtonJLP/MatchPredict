import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { FixtureStatus, WinnerType } from '@prisma/client';
import { of } from 'rxjs';

import { activeSeasonWhere } from '../../common/prisma/query-presets';
import { PrismaService } from '../../common/prisma/prisma.service';
import { FootballService } from './football.service';

describe('FootballService', () => {
  let service: FootballService;
  let httpGet: jest.Mock;
  let teamFindMany: jest.Mock;
  let teamUpsert: jest.Mock;
  let leagueFindFirst: jest.Mock;
  let seasonFindFirst: jest.Mock;
  let playerFindMany: jest.Mock;
  let playerUpsert: jest.Mock;
  let fixtureFindFirst: jest.Mock;
  let fixtureFindMany: jest.Mock;
  let fixtureUpsert: jest.Mock;
  let fixtureCount: jest.Mock;

  beforeEach(() => {
    httpGet = jest.fn();
    teamFindMany = jest.fn();
    teamUpsert = jest.fn();
    leagueFindFirst = jest.fn();
    seasonFindFirst = jest.fn();
    playerFindMany = jest.fn();
    playerUpsert = jest.fn();
    fixtureFindFirst = jest.fn();
    fixtureFindMany = jest.fn();
    fixtureUpsert = jest.fn();
    fixtureCount = jest.fn();

    const httpService = {
      get: httpGet,
    } as unknown as HttpService;
    const configService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          ESPN_API_URL: 'https://site.api.espn.com/apis/site/v2',
          ESPN_CORE_API_URL: 'https://sports.core.api.espn.com/v2',
          ESPN_LEAGUE: 'eng.1',
        };

        return config[key];
      }),
    } as unknown as ConfigService;
    const prisma = {
      team: {
        findMany: teamFindMany,
        upsert: teamUpsert,
      },
      league: {
        findFirst: leagueFindFirst,
      },
      season: {
        findFirst: seasonFindFirst,
      },
      player: {
        findMany: playerFindMany,
        upsert: playerUpsert,
      },
      fixture: {
        findFirst: fixtureFindFirst,
        findMany: fixtureFindMany,
        upsert: fixtureUpsert,
        count: fixtureCount,
      },
    } as unknown as PrismaService;

    service = new FootballService(httpService, configService, prisma);
  });

  it('extrai a competicao quando a ESPN retorna competitions como array', () => {
    expect(
      (
        service as unknown as {
          getCompetitionRef: (event: {
            competitions?: { $ref: string } | Array<{ $ref: string }>;
          }) => string | null;
        }
      ).getCompetitionRef({
        competitions: [
          {
            $ref: 'https://sports.core.api.espn.com/event/competition',
          },
        ],
      }),
    ).toBe('https://sports.core.api.espn.com/event/competition');
  });

  it('sincroniza times da temporada ativa usando refs da ESPN Core', async () => {
    leagueFindFirst.mockResolvedValue({
      id: '99999999-9999-4999-8999-999999999999',
    });
    seasonFindFirst.mockResolvedValue({
      id: '88888888-8888-4888-8888-888888888888',
      year: 2026,
    });
    teamFindMany.mockResolvedValue([
      {
        apiTeamId: 359,
      },
    ]);
    teamUpsert.mockResolvedValue({});
    httpGet
      .mockReturnValueOnce(
        of({
          data: {
            count: 2,
            items: [
              {
                $ref: 'https://sports.core.api.espn.com/team/359',
              },
              {
                $ref: 'https://sports.core.api.espn.com/team/364',
              },
            ],
          },
        }),
      )
      .mockReturnValueOnce(
        of({
          data: {
            id: '359',
            displayName: 'Arsenal',
            logos: [
              {
                href: 'https://example.com/arsenal.png',
                rel: ['default'],
              },
            ],
          },
        }),
      )
      .mockReturnValueOnce(
        of({
          data: {
            id: '364',
            displayName: 'Liverpool',
            logos: [
              {
                href: 'https://example.com/liverpool.png',
                rel: ['default'],
              },
            ],
          },
        }),
      );

    await expect(service.syncTeams()).resolves.toEqual({
      created: 1,
      updated: 1,
      total: 2,
    });

    expect(httpGet).toHaveBeenNthCalledWith(
      1,
      'https://sports.core.api.espn.com/v2/sports/soccer/leagues/eng.1/seasons/2026/teams?limit=1000',
    );
    expect(httpGet).toHaveBeenNthCalledWith(
      2,
      'https://sports.core.api.espn.com/team/359',
    );
    expect(httpGet).toHaveBeenNthCalledWith(
      3,
      'https://sports.core.api.espn.com/team/364',
    );
    expect(teamFindMany).toHaveBeenCalledWith({
      where: {
        apiTeamId: {
          in: [359, 364],
        },
      },
      select: {
        apiTeamId: true,
      },
    });
    expect(teamUpsert).toHaveBeenCalledTimes(2);
    expect(teamUpsert).toHaveBeenNthCalledWith(1, {
      where: {
        apiTeamId: 359,
      },
      update: {
        name: 'Arsenal',
        logo: 'https://example.com/arsenal.png',
        country: 'England',
      },
      create: {
        apiTeamId: 359,
        name: 'Arsenal',
        logo: 'https://example.com/arsenal.png',
        country: 'England',
      },
    });
    expect(teamUpsert).toHaveBeenNthCalledWith(2, {
      where: {
        apiTeamId: 364,
      },
      update: {
        name: 'Liverpool',
        logo: 'https://example.com/liverpool.png',
        country: 'England',
      },
      create: {
        apiTeamId: 364,
        name: 'Liverpool',
        logo: 'https://example.com/liverpool.png',
        country: 'England',
      },
    });
  });

  it('sincroniza fixtures persistindo rodada pela ordem dos eventos da temporada', async () => {
    leagueFindFirst.mockResolvedValue({
      id: '99999999-9999-4999-8999-999999999999',
    });
    seasonFindFirst.mockResolvedValue({
      id: '88888888-8888-4888-8888-888888888888',
      year: 2026,
    });
    fixtureFindMany.mockResolvedValue([]);
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
    fixtureUpsert.mockResolvedValue({});
    httpGet
      .mockReturnValueOnce(
        of({
          data: {
            count: 2,
            items: [
              {
                $ref: 'https://sports.core.api.espn.com/event/1',
              },
              {
                $ref: 'https://sports.core.api.espn.com/event/2',
              },
            ],
          },
        }),
      )
      .mockReturnValueOnce(
        of({
          data: {
            count: 2,
            items: [
              {
                $ref: 'https://sports.core.api.espn.com/team/359',
              },
              {
                $ref: 'https://sports.core.api.espn.com/team/364',
              },
            ],
          },
        }),
      )
      .mockReturnValueOnce(
        of({
          data: {
            id: '1',
            date: '2026-08-21T19:00:00.000Z',
            competitions: {
              $ref: 'https://sports.core.api.espn.com/competition/1',
            },
          },
        }),
      )
      .mockReturnValueOnce(
        of({
          data: {
            date: '2026-08-21T19:00:00.000Z',
            competitors: [
              {
                $ref: 'https://sports.core.api.espn.com/competition/1/home',
              },
              {
                $ref: 'https://sports.core.api.espn.com/competition/1/away',
              },
            ],
          },
        }),
      )
      .mockReturnValueOnce(
        of({
          data: {
            id: '359',
            homeAway: 'home',
          },
        }),
      )
      .mockReturnValueOnce(
        of({
          data: {
            id: '364',
            homeAway: 'away',
          },
        }),
      )
      .mockReturnValueOnce(
        of({
          data: {
            id: '2',
            date: '2026-08-28T19:00:00.000Z',
            competitions: {
              $ref: 'https://sports.core.api.espn.com/competition/2',
            },
          },
        }),
      )
      .mockReturnValueOnce(
        of({
          data: {
            date: '2026-08-28T19:00:00.000Z',
            competitors: [
              {
                $ref: 'https://sports.core.api.espn.com/competition/2/home',
              },
              {
                $ref: 'https://sports.core.api.espn.com/competition/2/away',
              },
            ],
          },
        }),
      )
      .mockReturnValueOnce(
        of({
          data: {
            id: '359',
            homeAway: 'home',
          },
        }),
      )
      .mockReturnValueOnce(
        of({
          data: {
            id: '364',
            homeAway: 'away',
          },
        }),
      );

    await expect(service.syncFixtures()).resolves.toEqual({
      fixturesFound: 2,
      created: 2,
      updated: 0,
      skipped: 0,
    });

    expect(httpGet).toHaveBeenNthCalledWith(
      1,
      'https://sports.core.api.espn.com/v2/sports/soccer/leagues/eng.1/seasons/2026/types/1/groups/1/events?limit=1000',
    );
    expect(fixtureUpsert).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        create: expect.objectContaining({
          round: 1,
        }),
        update: expect.objectContaining({
          round: 1,
        }),
      }),
    );
    expect(fixtureUpsert).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        create: expect.objectContaining({
          round: 2,
        }),
        update: expect.objectContaining({
          round: 2,
        }),
      }),
    );
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

  it('lista fixtures com filtros, paginacao e predicao do usuario', async () => {
    const kickoff = new Date('2030-08-14T19:00:00.000Z');
    const userId = '33333333-3333-4333-8333-333333333333';

    fixtureFindMany.mockResolvedValue([
      createFixtureListItem({
        kickoff,
        predictions: [
          {
            id: '44444444-4444-4444-8444-444444444444',
            homeGoals: 2,
            awayGoals: 1,
            totalPoints: 0,
          },
        ],
      }),
    ]);
    fixtureCount.mockResolvedValue(21);

    await expect(
      service.findFixtures(userId, {
        status: FixtureStatus.NS,
        round: 12,
        teamId: firstTeamId,
        from: '2030-08-01T00:00:00.000Z',
        to: '2030-08-31T23:59:59.999Z',
        page: 2,
        limit: 10,
      }),
    ).resolves.toEqual({
      data: [
        {
          id: fixtureId,
          round: 12,
          kickoff,
          status: FixtureStatus.NS,
          homeGoals: null,
          awayGoals: null,
          winnerType: null,
          homeTeam: {
            id: firstTeamId,
            name: 'Arsenal',
            logo: 'https://example.com/arsenal.png',
          },
          awayTeam: {
            id: secondTeamId,
            name: 'Chelsea',
            logo: 'https://example.com/chelsea.png',
          },
          canPredict: false,
          userPrediction: {
            id: '44444444-4444-4444-8444-444444444444',
            homeGoals: 2,
            awayGoals: 1,
            totalPoints: 0,
          },
        },
      ],
      meta: {
        page: 2,
        limit: 10,
        total: 21,
        totalPages: 3,
      },
    });

    const expectedWhere = {
      status: FixtureStatus.NS,
      round: 12,
      kickoff: {
        gte: new Date('2030-08-01T00:00:00.000Z'),
        lte: new Date('2030-08-31T23:59:59.999Z'),
      },
      OR: [
        {
          homeTeamId: firstTeamId,
        },
        {
          awayTeamId: firstTeamId,
        },
      ],
    };

    expect(fixtureFindMany).toHaveBeenCalledWith({
      where: expectedWhere,
      orderBy: {
        kickoff: 'asc',
      },
      skip: 10,
      take: 10,
      include: {
        homeTeam: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        awayTeam: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        predictions: {
          where: {
            userId,
          },
          take: 1,
          select: {
            id: true,
            homeGoals: true,
            awayGoals: true,
            totalPoints: true,
          },
        },
      },
    });
    expect(fixtureCount).toHaveBeenCalledWith({
      where: expectedWhere,
    });
  });

  describe('findCurrentFixturesPage', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-08-01T12:00:00.000Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('usa a rodada de uma partida ao vivo como rodada atual', async () => {
      fixtureFindFirst
        .mockResolvedValueOnce({ round: 20 })
        .mockResolvedValueOnce({
          kickoff: new Date('2026-11-28T15:00:00.000Z'),
          round: 20,
        });
      fixtureCount.mockResolvedValue(190);

      await expect(
        service.findCurrentFixturesPage({ limit: 10 }),
      ).resolves.toEqual({
        page: 20,
        round: 20,
      });

      expect(fixtureFindFirst).toHaveBeenNthCalledWith(1, {
        where: {
          season: activeSeasonWhere,
          status: FixtureStatus.LIVE,
        },
        orderBy: {
          kickoff: 'asc',
        },
        select: {
          round: true,
        },
      });
      expect(fixtureCount).toHaveBeenCalledWith({
        where: {
          kickoff: {
            lt: new Date('2026-11-28T15:00:00.000Z'),
          },
        },
      });
    });

    it('usa a proxima partida futura quando nao ha partida ao vivo', async () => {
      fixtureFindFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ round: 2 })
        .mockResolvedValueOnce({
          kickoff: new Date('2026-08-22T15:00:00.000Z'),
          round: 2,
        });
      fixtureCount.mockResolvedValue(10);

      await expect(
        service.findCurrentFixturesPage({ limit: 10 }),
      ).resolves.toEqual({
        page: 2,
        round: 2,
      });

      expect(fixtureFindFirst).toHaveBeenNthCalledWith(2, {
        where: {
          season: activeSeasonWhere,
          kickoff: {
            gt: new Date('2026-08-01T12:00:00.000Z'),
          },
        },
        orderBy: {
          kickoff: 'asc',
        },
        select: {
          round: true,
        },
      });
    });

    it('usa a proxima rodada durante intervalo entre rodadas', async () => {
      fixtureFindFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ round: 21 })
        .mockResolvedValueOnce({
          kickoff: new Date('2027-01-03T15:00:00.000Z'),
          round: 21,
        });
      fixtureCount.mockResolvedValue(200);

      await expect(
        service.findCurrentFixturesPage({ limit: 10 }),
      ).resolves.toEqual({
        page: 21,
        round: 21,
      });
    });

    it('usa a ultima rodada finalizada quando nao ha partidas futuras', async () => {
      fixtureFindFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ round: 38 })
        .mockResolvedValueOnce({
          kickoff: new Date('2027-05-23T15:00:00.000Z'),
          round: 38,
        });
      fixtureCount.mockResolvedValue(370);

      await expect(
        service.findCurrentFixturesPage({ limit: 10 }),
      ).resolves.toEqual({
        page: 38,
        round: 38,
      });

      expect(fixtureFindFirst).toHaveBeenNthCalledWith(3, {
        where: {
          season: activeSeasonWhere,
          status: FixtureStatus.FT,
        },
        orderBy: {
          kickoff: 'desc',
        },
        select: {
          round: true,
        },
      });
    });

    it('retorna a primeira pagina antes do inicio da temporada', async () => {
      fixtureFindFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ round: 1 })
        .mockResolvedValueOnce({
          kickoff: new Date('2026-08-15T15:00:00.000Z'),
          round: 1,
        });
      fixtureCount.mockResolvedValue(0);

      await expect(
        service.findCurrentFixturesPage({ limit: 10 }),
      ).resolves.toEqual({
        page: 1,
        round: 1,
      });
    });

    it('calcula corretamente a pagina de uma rodada avancada', async () => {
      fixtureFindFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ round: 30 })
        .mockResolvedValueOnce({
          kickoff: new Date('2027-03-14T15:00:00.000Z'),
          round: 30,
        });
      fixtureCount.mockResolvedValue(290);

      await expect(
        service.findCurrentFixturesPage({ limit: 10 }),
      ).resolves.toEqual({
        page: 30,
        round: 30,
      });
    });

    it('calcula a pagina pelo inicio da rodada mesmo com partidas fora da sequencia cronologica', async () => {
      fixtureFindFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ round: 5 })
        .mockResolvedValueOnce({
          kickoff: new Date('2026-09-12T15:00:00.000Z'),
          round: 5,
        });
      fixtureCount.mockResolvedValue(40);

      await expect(
        service.findCurrentFixturesPage({ limit: 10 }),
      ).resolves.toEqual({
        page: 5,
        round: 5,
      });

      expect(fixtureFindFirst).toHaveBeenNthCalledWith(3, {
        where: {
          season: activeSeasonWhere,
          round: 5,
        },
        orderBy: {
          kickoff: 'asc',
        },
        select: {
          kickoff: true,
          round: true,
        },
      });
    });
  });

  it('usa valores padrao e permite palpite quando partida ainda nao iniciou', async () => {
    fixtureFindMany.mockResolvedValue([
      createFixtureListItem({
        predictions: [],
      }),
    ]);
    fixtureCount.mockResolvedValue(1);

    await expect(
      service.findFixtures('33333333-3333-4333-8333-333333333333', {}),
    ).resolves.toMatchObject({
      data: [
        {
          canPredict: true,
          userPrediction: null,
        },
      ],
      meta: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    });

    expect(fixtureFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: undefined,
          round: undefined,
          kickoff: undefined,
          OR: undefined,
        },
        skip: 0,
        take: 20,
      }),
    );
  });

  it('bloqueia palpite na listagem quando status indica partida ao vivo', async () => {
    fixtureFindMany.mockResolvedValue([
      createFixtureListItem({
        kickoff: new Date('2030-08-14T19:00:00.000Z'),
        status: FixtureStatus.LIVE,
        predictions: [],
      }),
    ]);
    fixtureCount.mockResolvedValue(1);

    await expect(
      service.findFixtures('33333333-3333-4333-8333-333333333333', {}),
    ).resolves.toMatchObject({
      data: [
        {
          canPredict: false,
          status: FixtureStatus.LIVE,
          userPrediction: null,
        },
      ],
    });
  });
});

const firstTeamId = '11111111-1111-4111-8111-111111111111';
const secondTeamId = '22222222-2222-4222-8222-222222222222';
const fixtureId = '55555555-5555-4555-8555-555555555555';

function createFixtureListItem(overrides: Record<string, unknown> = {}) {
  return {
    id: fixtureId,
    apiFixtureId: 123,
    seasonId: '66666666-6666-4666-8666-666666666666',
    homeTeamId: firstTeamId,
    awayTeamId: secondTeamId,
    round: 12,
    kickoff: new Date('2030-08-14T19:00:00.000Z'),
    status: FixtureStatus.NS,
    homeGoals: null,
    awayGoals: null,
    winnerType: null as WinnerType | null,
    processedAt: null,
    createdAt: new Date('2030-08-01T00:00:00.000Z'),
    updatedAt: new Date('2030-08-01T00:00:00.000Z'),
    homeTeam: {
      id: firstTeamId,
      name: 'Arsenal',
      logo: 'https://example.com/arsenal.png',
    },
    awayTeam: {
      id: secondTeamId,
      name: 'Chelsea',
      logo: 'https://example.com/chelsea.png',
    },
    predictions: [],
    ...overrides,
  };
}
