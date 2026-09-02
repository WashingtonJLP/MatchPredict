import { BadRequestException } from '@nestjs/common';

import { DailyGamesEspnClient } from './daily-games-espn.client';
import { DailyGamesService } from './daily-games.service';
import {
  EspnScoreboardCompetitor,
  EspnScoreboardEvent,
} from './types/espn-scoreboard.types';

describe('DailyGamesService', () => {
  let service: DailyGamesService;
  let getScoreboard: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-09-01T12:00:00.000Z'));
    getScoreboard = jest.fn().mockResolvedValue(emptyScoreboard());
    service = new DailyGamesService({
      getScoreboard,
    } as unknown as DailyGamesEspnClient);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it.each(['abc', '2026-99-99', '01-09-2026'])(
    'rejeita date invalida: %s',
    async (date) => {
      await expect(service.findDailyGames(date)).rejects.toThrow(
        BadRequestException,
      );
      expect(getScoreboard).not.toHaveBeenCalled();
    },
  );

  it('consulta a ESPN com range D-1 a D+1 e filtra pelo dia local de Sao Paulo', async () => {
    getScoreboard.mockImplementation((league: string) => {
      if (league !== 'bra.2') {
        return Promise.resolve(emptyScoreboard());
      }

      return Promise.resolve(
        scoreboard([
          createEvent({
            date: '2026-09-01T22:30Z',
            id: '401860308',
            statusName: 'STATUS_HALFTIME',
          }),
          createEvent({
            date: '2026-09-02T03:30Z',
            id: '401860309',
            statusName: 'STATUS_SCHEDULED',
          }),
        ]),
      );
    });

    const response = await service.findDailyGames('2026-09-01');

    expect(getScoreboard).toHaveBeenCalledWith('bra.2', '20260831-20260902');
    expect(response.date).toBe('2026-09-01');
    expect(response.timezone).toBe('America/Sao_Paulo');
    expect(response.competitions).toHaveLength(1);
    expect(response.competitions[0]).toMatchObject({
      id: 'bra.2',
      name: 'Brasileirão Série B',
      logo: 'https://example.com/league.png',
      games: [
        {
          id: 'espn:bra.2:401860308',
          kickoff: '2026-09-01T22:30:00.000Z',
          localDate: '2026-09-01',
          localTime: '19:30',
        },
      ],
    });
  });

  it('identifica mandante e visitante por homeAway sem depender da ordem do array', async () => {
    getScoreboard.mockImplementation((league: string) =>
      Promise.resolve(
        league === 'bra.2'
          ? scoreboard([
              createEvent({
                competitors: [
                  createCompetitor('away', {
                    id: '6270',
                    name: 'Juventude',
                    abbreviation: 'JUV',
                    score: '1',
                  }),
                  createCompetitor('home', {
                    id: '17333',
                    name: 'Londrina',
                    abbreviation: 'LON',
                    score: '2',
                  }),
                ],
              }),
            ])
          : emptyScoreboard(),
      ),
    );

    const [competition] = (await service.findDailyGames('2026-09-01'))
      .competitions;
    const [game] = competition.games;

    expect(game.homeTeam).toMatchObject({
      id: '17333',
      name: 'Londrina',
      abbreviation: 'LON',
    });
    expect(game.awayTeam).toMatchObject({
      id: '6270',
      name: 'Juventude',
      abbreviation: 'JUV',
    });
  });

  it('retorna null/null para SCHEDULED mesmo quando a ESPN envia score 0/0', async () => {
    getScoreboard.mockImplementation((league: string) =>
      Promise.resolve(
        league === 'bra.2'
          ? scoreboard([
              createEvent({
                competitors: [
                  createCompetitor('home', { score: '0' }),
                  createCompetitor('away', { score: '0' }),
                ],
              }),
            ])
          : emptyScoreboard(),
      ),
    );

    const [game] = (await service.findDailyGames('2026-09-01')).competitions[0]
      .games;

    expect(game.score).toEqual({
      home: null,
      away: null,
    });
  });

  it.each([
    [
      'LIVE em 0 x 0',
      'STATUS_FIRST_HALF',
      'in',
      false,
      false,
      1,
      300,
      "5'",
      0,
      0,
    ],
    [
      'HALFTIME em 0 x 0',
      'STATUS_HALFTIME',
      'in',
      false,
      false,
      1,
      2700,
      'HT',
      0,
      0,
    ],
    [
      'FINAL em 0 x 0',
      'STATUS_FULL_TIME',
      'post',
      true,
      false,
      2,
      5400,
      'FT',
      0,
      0,
    ],
    [
      'FINAL_PENALTIES em 0 x 0',
      'STATUS_FINAL_PEN',
      'post',
      true,
      false,
      2,
      5400,
      'FT-Pens',
      0,
      0,
    ],
    [
      'SUSPENDED apos inicio',
      'STATUS_DELAYED',
      'in',
      false,
      true,
      1,
      1200,
      "20'",
      0,
      0,
    ],
    [
      'SUSPENDED antes do inicio',
      'STATUS_DELAYED',
      'pre',
      false,
      true,
      0,
      0,
      'Delay',
      null,
      null,
    ],
    [
      'POSTPONED antes do inicio',
      'STATUS_POSTPONED',
      'post',
      false,
      false,
      0,
      0,
      'Postponed',
      null,
      null,
    ],
    [
      'CANCELED antes do inicio',
      'STATUS_CANCELED',
      'post',
      false,
      false,
      0,
      0,
      'Canceled',
      null,
      null,
    ],
  ])(
    'normaliza score para %s',
    async (
      _caseName,
      statusName,
      state,
      completed,
      wasSuspended,
      period,
      clock,
      displayClock,
      expectedHomeScore,
      expectedAwayScore,
    ) => {
      getScoreboard.mockImplementation((league: string) =>
        Promise.resolve(
          league === 'bra.2'
            ? scoreboard([
                createEvent({
                  clock,
                  completed,
                  displayClock,
                  period,
                  state,
                  statusName,
                  wasSuspended,
                }),
              ])
            : emptyScoreboard(),
        ),
      );

      const [game] = (await service.findDailyGames('2026-09-01'))
        .competitions[0].games;

      expect(game.score).toEqual({
        home: expectedHomeScore,
        away: expectedAwayScore,
      });
    },
  );

  it.each([
    ['STATUS_SCHEDULED', 'pre', false, 'SCHEDULED', 'Pré-jogo'],
    ['STATUS_FIRST_HALF', 'in', false, 'LIVE', 'Ao vivo'],
    ['STATUS_HALFTIME', 'in', false, 'HALFTIME', 'Intervalo'],
    ['STATUS_FULL_TIME', 'post', true, 'FINAL', 'Encerrado'],
    [
      'STATUS_FINAL_PEN',
      'post',
      true,
      'FINAL_PENALTIES',
      'Encerrado nos pênaltis',
    ],
    ['STATUS_POSTPONED', 'post', false, 'POSTPONED', 'Adiado'],
  ])(
    'mapeia status ESPN %s para %s',
    async (statusName, state, completed, expectedStatus, expectedLabel) => {
      getScoreboard.mockImplementation((league: string) =>
        Promise.resolve(
          league === 'bra.2'
            ? scoreboard([
                createEvent({
                  statusName,
                  state,
                  completed,
                }),
              ])
            : emptyScoreboard(),
        ),
      );

      const [game] = (await service.findDailyGames('2026-09-01'))
        .competitions[0].games;

      expect(game.status).toBe(expectedStatus);
      expect(game.statusLabel).toBe(expectedLabel);
    },
  );

  it('mapeia jogo suspenso por competitions[0].wasSuspended', async () => {
    getScoreboard.mockImplementation((league: string) =>
      Promise.resolve(
        league === 'bra.2'
          ? scoreboard([
              createEvent({
                wasSuspended: true,
              }),
            ])
          : emptyScoreboard(),
      ),
    );

    const [game] = (await service.findDailyGames('2026-09-01')).competitions[0]
      .games;

    expect(game.status).toBe('SUSPENDED');
    expect(game.statusLabel).toBe('Suspenso');
  });

  it('nao inventa rodada de liga quando a ESPN fornece apenas a season anual', async () => {
    getScoreboard.mockImplementation((league: string) =>
      Promise.resolve(
        league === 'eng.1'
          ? scoreboard([
              createEvent({
                seasonSlug: '2025-26-english-premier-league',
              }),
            ])
          : emptyScoreboard(),
      ),
    );

    const [game] = (await service.findDailyGames('2026-09-01')).competitions[0]
      .games;

    expect(game.stage).toBeNull();
  });

  it('normaliza fase de liga a partir de events[].season.slug', async () => {
    getScoreboard.mockImplementation((league: string) =>
      Promise.resolve(
        league === 'uefa.champions'
          ? scoreboard([createEvent({ seasonSlug: 'league-phase' })])
          : emptyScoreboard(),
      ),
    );

    const [game] = (await service.findDailyGames('2026-09-01')).competitions[0]
      .games;

    expect(game.stage).toEqual({
      label: 'Fase de liga',
      number: null,
      type: 'LEAGUE_PHASE',
    });
  });

  it('normaliza fase mata-mata a partir de events[].season.slug', async () => {
    getScoreboard.mockImplementation((league: string) =>
      Promise.resolve(
        league === 'bra.copa_do_brazil'
          ? scoreboard([createEvent({ seasonSlug: 'quarterfinals' })])
          : emptyScoreboard(),
      ),
    );

    const [game] = (await service.findDailyGames('2026-09-01')).competitions[0]
      .games;

    expect(game.stage).toEqual({
      label: 'Quartas de final',
      number: null,
      type: 'KNOCKOUT',
    });
  });

  it('retorna stage null quando a ESPN nao fornece season.slug', async () => {
    getScoreboard.mockImplementation((league: string) =>
      Promise.resolve(
        league === 'bra.2' ? scoreboard([createEvent()]) : emptyScoreboard(),
      ),
    );

    const [game] = (await service.findDailyGames('2026-09-01')).competitions[0]
      .games;

    expect(game.stage).toBeNull();
  });

  it('retorna stage null para season.slug inesperado', async () => {
    const malformedEvent = {
      ...createEvent(),
      season: {
        slug: { value: 'quarterfinals' },
      },
    } as unknown as EspnScoreboardEvent;

    getScoreboard.mockImplementation((league: string) =>
      Promise.resolve(
        league === 'bra.copa_do_brazil'
          ? scoreboard([malformedEvent])
          : emptyScoreboard(),
      ),
    );

    const [game] = (await service.findDailyGames('2026-09-01')).competitions[0]
      .games;

    expect(game.stage).toBeNull();
  });

  it('preserva fases diferentes por jogo quando a mesma data as mistura', async () => {
    getScoreboard.mockImplementation((league: string) =>
      Promise.resolve(
        league === 'uefa.champions'
          ? scoreboard([
              createEvent({
                id: 'league-phase-game',
                seasonSlug: 'league-phase',
              }),
              createEvent({
                id: 'quarterfinal-game',
                seasonSlug: 'quarterfinals',
              }),
            ])
          : emptyScoreboard(),
      ),
    );

    const games = (await service.findDailyGames('2026-09-01')).competitions[0]
      .games;

    expect(games.map((game) => game.stage?.label)).toEqual([
      'Fase de liga',
      'Quartas de final',
    ]);
  });

  it('mantem resposta parcial quando uma competicao falha', async () => {
    getScoreboard.mockImplementation((league: string) => {
      if (league === 'eng.1') {
        return Promise.reject(new Error('403'));
      }

      if (league === 'bra.2') {
        return Promise.resolve(scoreboard([createEvent()]));
      }

      return Promise.resolve(emptyScoreboard());
    });

    const response = await service.findDailyGames('2026-09-01');

    expect(response.meta).toMatchObject({
      requestedCompetitions: 12,
      successfulCompetitions: 11,
      failedCompetitions: 1,
    });
    expect(response.competitions).toHaveLength(1);
    expect(response.competitions[0].id).toBe('bra.2');
  });

  it('usa cache basico por data', async () => {
    getScoreboard.mockImplementation((league: string) =>
      Promise.resolve(
        league === 'bra.2' ? scoreboard([createEvent()]) : emptyScoreboard(),
      ),
    );

    const firstResponse = await service.findDailyGames('2026-09-01');
    const secondResponse = await service.findDailyGames('2026-09-01');

    expect(secondResponse).toBe(firstResponse);
    expect(getScoreboard).toHaveBeenCalledTimes(12);
    expect(firstResponse.meta.cacheTtlSeconds).toBe(60);
  });
});

function emptyScoreboard() {
  return scoreboard([]);
}

function scoreboard(events: EspnScoreboardEvent[]) {
  return {
    leagues: [
      {
        id: '4007',
        name: 'Brazilian Serie B',
        slug: 'bra.2',
        logos: [
          {
            href: 'https://example.com/league.png',
            rel: ['full', 'default'],
          },
        ],
      },
    ],
    events,
  };
}

function createEvent(
  overrides: {
    clock?: number;
    completed?: boolean;
    competitors?: EspnScoreboardCompetitor[];
    date?: string;
    displayClock?: string;
    id?: string;
    period?: number;
    seasonSlug?: string;
    state?: string;
    statusName?: string;
    wasSuspended?: boolean;
  } = {},
): EspnScoreboardEvent {
  const status = {
    clock: overrides.clock ?? 2700,
    displayClock: overrides.displayClock ?? "45'+1'",
    period: overrides.period ?? 1,
    type: {
      completed: overrides.completed ?? false,
      description: 'Scheduled',
      detail: 'Scheduled',
      name: overrides.statusName ?? 'STATUS_SCHEDULED',
      shortDetail: 'Scheduled',
      state: overrides.state ?? 'pre',
    },
  };

  return {
    id: overrides.id ?? '401860308',
    date: overrides.date ?? '2026-09-01T22:30Z',
    season: overrides.seasonSlug
      ? {
          slug: overrides.seasonSlug,
          type: 13281,
          year: 2026,
        }
      : undefined,
    status,
    competitions: [
      {
        date: overrides.date ?? '2026-09-01T22:30Z',
        status,
        wasSuspended: overrides.wasSuspended,
        competitors: overrides.competitors ?? [
          createCompetitor('home', {
            id: '17333',
            name: 'Londrina',
            abbreviation: 'LON',
            score: '0',
          }),
          createCompetitor('away', {
            id: '6270',
            name: 'Juventude',
            abbreviation: 'JUV',
            score: '0',
          }),
        ],
      },
    ],
  };
}

function createCompetitor(
  homeAway: 'home' | 'away',
  overrides: {
    abbreviation?: string;
    id?: string;
    name?: string;
    score?: string;
  } = {},
) {
  const id = overrides.id ?? (homeAway === 'home' ? '17333' : '6270');
  const name =
    overrides.name ?? (homeAway === 'home' ? 'Londrina' : 'Juventude');

  return {
    homeAway,
    id,
    score: overrides.score,
    team: {
      abbreviation: overrides.abbreviation ?? name.slice(0, 3).toUpperCase(),
      displayName: name,
      id,
      logo: `https://example.com/${id}.png`,
    },
  };
}
