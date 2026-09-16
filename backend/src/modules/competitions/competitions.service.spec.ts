import { EspnHttpClient } from '../../common/espn/espn-http.client';
import { CompetitionsService } from './competitions.service';

describe('CompetitionsService', () => {
  let service: CompetitionsService;
  let espnClient: {
    getCore: jest.Mock;
    getRef: jest.Mock;
    getScoreboard: jest.Mock;
    getStandings: jest.Mock;
  };

  beforeEach(() => {
    espnClient = {
      getCore: jest.fn(),
      getRef: jest.fn(),
      getScoreboard: jest.fn(),
      getStandings: jest.fn(),
    };
    service = new CompetitionsService(espnClient as unknown as EspnHttpClient);
  });

  it('expõe as 12 competições com capacidades coerentes', () => {
    const result = service.findAll();

    expect(result.competitions).toHaveLength(12);
    expect(
      result.competitions.find((item) => item.id === 'bra.copa_do_brazil'),
    ).toMatchObject({
      format: 'CUP',
      capabilities: {
        games: true,
        standings: false,
        groups: false,
        tournament: true,
      },
    });
    expect(
      result.competitions.find((item) => item.id === 'conmebol.libertadores'),
    ).toMatchObject({
      format: 'GROUPS',
      capabilities: { standings: true, groups: true, tournament: true },
    });
  });

  it('descobre a temporada e os tipos de fase dinamicamente', async () => {
    mockSeason('uefa.champions');
    espnClient.getRef.mockResolvedValueOnce({
      id: '2',
      type: 14533,
      name: 'Knockout Round Playoffs',
      slug: 'knockout-round-playoffs',
      startDate: '2027-02-15T05:00Z',
      endDate: '2027-03-08T04:59Z',
    });

    const result = await service.findCurrentSeason('uefa.champions');

    expect(result.year).toBe(2026);
    expect(result.phases).toEqual([
      expect.objectContaining({
        sourceTypeId: 14533,
        slug: 'knockout-round-playoffs',
        name: 'Playoffs do mata-mata',
      }),
    ]);
  });

  it('normaliza standings procurando stats pelo name, sem depender da ordem', async () => {
    mockSeason('eng.1', []);
    espnClient.getStandings.mockResolvedValue({
      season: { year: 2026, displayName: '2026-27 English Premier League' },
      children: [
        {
          id: '1',
          name: 'Premier League',
          standings: {
            entries: [
              {
                team: {
                  id: '382',
                  displayName: 'Manchester City',
                  abbreviation: 'MNC',
                  logos: [{ href: 'city.png', rel: ['default'] }],
                },
                note: { description: 'Champions League', rank: 1 },
                stats: [
                  { name: 'points', value: 9 },
                  { name: 'losses', value: 0 },
                  { name: 'rank', value: 1 },
                  { name: 'pointDifferential', value: 5 },
                  { name: 'wins', value: 3 },
                  { name: 'pointsAgainst', value: 2 },
                  { name: 'ties', value: 0 },
                  { name: 'gamesPlayed', value: 3 },
                  { name: 'pointsFor', value: 7 },
                  { name: 'deductions', value: 0 },
                ],
              },
            ],
          },
        },
      ],
    });

    const result = await service.findStandings('eng.1');

    expect(result.sections[0].entries[0]).toMatchObject({
      position: 1,
      played: 3,
      wins: 3,
      draws: 0,
      losses: 0,
      goalsFor: 7,
      goalsAgainst: 2,
      goalDifference: 5,
      points: 9,
      deductions: 0,
      zone: { description: 'Champions League' },
    });
  });

  it('preserva grupos e entradas independentes', async () => {
    mockSeason('conmebol.libertadores', []);
    espnClient.getStandings.mockResolvedValue({
      season: { year: 2026, displayName: '2026 Libertadores' },
      children: ['A', 'B'].map((group) => ({
        id: group,
        name: `Group ${group}`,
        standings: {
          entries: [standingEntry(`${group}-1`, `Time ${group}`, 1, 10)],
        },
      })),
    });

    const result = await service.findStandings('conmebol.libertadores');

    expect(result.kind).toBe('GROUPS');
    expect(result.sections.map((section) => section.name)).toEqual([
      'Grupo A',
      'Grupo B',
    ]);
  });

  it('aplica as zonas atuais da fase de liga da UEFA quando a ESPN omite note', async () => {
    mockSeason('uefa.champions', []);
    espnClient.getStandings.mockResolvedValue({
      season: { year: 2026, displayName: '2026-27 Champions League' },
      children: [
        {
          name: 'League Phase',
          standings: {
            entries: [
              standingEntry('1', 'Direto', 8, 18),
              standingEntry('2', 'Seeded', 16, 12),
              standingEntry('3', 'Unseeded', 24, 9),
              standingEntry('4', 'Eliminado', 25, 8),
            ],
          },
        },
      ],
    });

    const result = await service.findStandings('uefa.champions');

    expect(
      result.sections[0].entries.map((entry) => entry.zone?.description),
    ).toEqual([
      'Classificação direta para as oitavas',
      'Playoff do mata-mata — cabeça de chave',
      'Playoff do mata-mata — não cabeça de chave',
      'Eliminado',
    ]);
  });

  it('informa que standings não se aplica à Copa do Brasil', async () => {
    const result = await service.findStandings('bra.copa_do_brazil');

    expect(result).toMatchObject({
      applicable: false,
      kind: 'NONE',
      sections: [],
    });
    expect(espnClient.getStandings).not.toHaveBeenCalled();
  });

  it('normaliza ida, volta, agregado, pênaltis e vencedor sem progressão inventada', async () => {
    mockTournamentSeason('conmebol.libertadores');
    espnClient.getScoreboard.mockResolvedValue({
      events: [
        knockoutEvent('1', 1, '1', '0', false),
        knockoutEvent('2', 2, '0', '1', true),
      ],
    });

    const result = await service.findTournament('conmebol.libertadores');
    const tie = result.phases[0].ties[0];

    expect(espnClient.getScoreboard).toHaveBeenCalledWith(
      'conmebol.libertadores',
      '2026',
    );
    expect(
      espnClient.getScoreboard.mock.calls.some(([, dates]) =>
        /^\d{8}-\d{8}$/.test(dates),
      ),
    ).toBe(false);
    expect(tie.legs).toHaveLength(2);
    expect(tie.legs.map((leg) => leg.legLabel)).toEqual(['Ida', 'Volta']);
    expect(tie.aggregate).toEqual([
      { teamId: 'home', value: 1 },
      { teamId: 'away', value: 1 },
    ]);
    expect(tie.penalties).toEqual([
      { teamId: 'away', value: 5 },
      { teamId: 'home', value: 4 },
    ]);
    expect(tie.winnerTeamId).toBe('away');
    expect(tie.progression).toBeNull();
  });

  it('consulta os anos civis de temporada europeia, consolida e deduplica eventos', async () => {
    mockTournamentSeason('uefa.champions', {
      endDate: '2027-07-01T03:59Z',
      eventIds: ['1', '2', '3'],
      startDate: '2026-07-01T04:00Z',
    });
    espnClient.getScoreboard.mockImplementation(
      (_competitionId: string, year: string) => {
        if (year === '2026') {
          return Promise.resolve({
            events: [
              knockoutEvent('1', 1, '1', '0', false),
              knockoutEvent('2', 2, '0', '1', true),
            ],
          });
        }

        return Promise.resolve({
          events: [
            knockoutEvent('2', 2, '0', '1', true),
            {
              ...knockoutEvent('3', 1, '2', '0', false),
              season: { year: 2025, type: 100, slug: 'quarterfinals' },
            },
          ],
        });
      },
    );

    const result = await service.findTournament('uefa.champions');
    const tie = result.phases[0].ties[0];

    expect(espnClient.getScoreboard.mock.calls).toEqual([
      ['uefa.champions', '2026'],
      ['uefa.champions', '2027'],
    ]);
    expect(tie.legs.map((leg) => leg.id)).toEqual(['1', '2']);
    expect(result.partial).toBe(false);
  });

  it('consulta somente o ano da temporada de ano civil', async () => {
    mockTournamentSeason('conmebol.libertadores', {
      endDate: '2027-01-01T04:59Z',
      eventIds: ['1'],
      startDate: '2026-01-01T05:00Z',
    });
    espnClient.getScoreboard.mockResolvedValue({
      events: [knockoutEvent('1', 1, '1', '0', false)],
    });

    await service.findTournament('conmebol.libertadores');

    expect(espnClient.getScoreboard.mock.calls).toEqual([
      ['conmebol.libertadores', '2026'],
    ]);
  });

  it('preserva eventos recuperados e sinaliza parcial quando um ano falha', async () => {
    mockTournamentSeason('uefa.champions', {
      endDate: '2027-07-01T03:59Z',
      eventIds: ['1'],
      startDate: '2026-07-01T04:00Z',
    });
    espnClient.getScoreboard.mockImplementation(
      (_competitionId: string, year: string) =>
        year === '2026'
          ? Promise.resolve({
              events: [knockoutEvent('1', 1, '1', '0', false)],
            })
          : Promise.reject(new Error('503')),
    );

    const result = await service.findTournament('uefa.champions');

    expect(result.partial).toBe(true);
    expect(result.phases[0].ties[0].legs).toHaveLength(1);
    expect(result.warnings).toContain(
      'Os detalhes dos confrontos estão temporariamente indisponíveis.',
    );
  });

  it('diferencia fase não publicada de participantes TBD', async () => {
    mockSeason(
      'uefa.champions',
      [
        {
          $ref: 'https://espn.test/types/1',
        },
        {
          $ref: 'https://espn.test/types/2',
        },
      ],
      'https://espn.test/tournaments/2',
    );
    espnClient.getRef.mockImplementation((ref: string) => {
      if (ref.endsWith('/types/1')) {
        return Promise.resolve({
          id: '1',
          type: 1,
          name: 'Round of 16',
          slug: 'round-of-16',
        });
      }
      if (ref.endsWith('/types/2')) {
        return Promise.resolve({
          id: '2',
          type: 2,
          name: 'Quarterfinals',
          slug: 'quarterfinals',
        });
      }

      return Promise.resolve({
        groups: [
          { id: '1', displayName: 'Round of 16' },
          {
            id: '2',
            displayName: 'Quarterfinals',
            matchups: [{ events: [{ $ref: 'https://espn.test/events/9' }] }],
          },
        ],
      });
    });
    espnClient.getScoreboard.mockResolvedValue({
      events: [tbdEvent('9')],
    });

    const result = await service.findTournament('uefa.champions');

    expect(result.phases.map((phase) => phase.state)).toEqual([
      'NOT_PUBLISHED',
      'TBD',
    ]);
  });

  it('mantém as fases e sinaliza resposta parcial quando o scoreboard falha', async () => {
    mockTournamentSeason('uefa.europa');
    espnClient.getScoreboard.mockRejectedValue(new Error('503'));

    const result = await service.findTournament('uefa.europa');

    expect(result.partial).toBe(true);
    expect(result.phases[0].state).toBe('UNAVAILABLE');
    expect(result.warnings).toContain(
      'Os detalhes dos confrontos estão temporariamente indisponíveis.',
    );
  });

  function mockSeason(
    id: string,
    typeRefs: Array<{ $ref: string }> = [{ $ref: 'https://espn.test/types/1' }],
    tournament?: string,
    period: { startDate?: string; endDate?: string } = {},
  ) {
    espnClient.getCore.mockImplementation((path: string) => {
      if (path.includes('/types?')) {
        return Promise.resolve({ count: typeRefs.length, items: typeRefs });
      }

      return Promise.resolve({
        year: 2026,
        displayName: `2026 ${id}`,
        startDate: period.startDate ?? '2026-01-01T00:00Z',
        endDate: period.endDate ?? '2026-12-31T23:59Z',
        tournament: tournament ? { $ref: tournament } : undefined,
      });
    });
  }

  function mockTournamentSeason(
    id: string,
    options: {
      startDate?: string;
      endDate?: string;
      eventIds?: string[];
    } = {},
  ) {
    mockSeason(
      id,
      [{ $ref: 'https://espn.test/types/1' }],
      'https://espn.test/tournaments/1',
      options,
    );
    const eventIds = options.eventIds ?? ['1', '2'];

    espnClient.getRef.mockImplementation((ref: string) => {
      if (ref.includes('/types/')) {
        return Promise.resolve({
          id: '1',
          type: 100,
          name: 'Quarterfinals',
          slug: 'quarterfinals',
        });
      }

      return Promise.resolve({
        groups: [
          {
            id: '100',
            displayName: 'Quarterfinals',
            matchups: eventIds.map((eventId) => ({
              events: [{ $ref: `https://espn.test/events/${eventId}` }],
            })),
          },
        ],
      });
    });
  }
});

function standingEntry(id: string, name: string, rank: number, points: number) {
  return {
    team: { id, displayName: name },
    stats: [
      { name: 'rank', value: rank },
      { name: 'points', value: points },
    ],
  };
}

function knockoutEvent(
  id: string,
  leg: number,
  homeScore: string,
  awayScore: string,
  completedSeries: boolean,
) {
  const isSecondLeg = leg === 2;

  return {
    id,
    date: `2026-09-0${leg}T20:00Z`,
    season: { year: 2026, type: 100, slug: 'quarterfinals' },
    status: {
      type: { completed: true, state: 'post', name: 'STATUS_FULL_TIME' },
    },
    competitions: [
      {
        leg: { value: leg, displayValue: `${leg} leg` },
        status: {
          type: { completed: true, state: 'post', name: 'STATUS_FULL_TIME' },
        },
        series: {
          title: 'Quarterfinals',
          completed: completedSeries,
          totalCompetitions: 2,
          competitors: [
            { id: 'home', aggregateScore: 1, winner: false },
            { id: 'away', aggregateScore: 1, winner: completedSeries },
          ],
        },
        competitors: [
          {
            id: isSecondLeg ? 'away' : 'home',
            homeAway: 'home',
            score: homeScore,
            shootoutScore: isSecondLeg ? 5 : undefined,
            advance: isSecondLeg,
            team: {
              id: isSecondLeg ? 'away' : 'home',
              displayName: isSecondLeg ? 'Visitante' : 'Mandante',
            },
          },
          {
            id: isSecondLeg ? 'home' : 'away',
            homeAway: 'away',
            score: awayScore,
            shootoutScore: isSecondLeg ? 4 : undefined,
            team: {
              id: isSecondLeg ? 'home' : 'away',
              displayName: isSecondLeg ? 'Mandante' : 'Visitante',
            },
          },
        ],
      },
    ],
  };
}

function tbdEvent(id: string) {
  return {
    id,
    date: '2026-10-01T20:00Z',
    season: { year: 2026, type: 2, slug: 'quarterfinals' },
    status: {
      type: { completed: false, state: 'pre', name: 'STATUS_SCHEDULED' },
    },
    competitions: [
      {
        competitors: [
          {
            id: 'tbd-home',
            homeAway: 'home',
            team: { id: 'tbd-home', displayName: 'TBD Home' },
          },
          {
            id: 'tbd-away',
            homeAway: 'away',
            team: { id: 'tbd-away', displayName: 'TBD Away' },
          },
        ],
      },
    ],
  };
}
