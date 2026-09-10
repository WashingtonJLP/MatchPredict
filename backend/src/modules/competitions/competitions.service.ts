import {
  BadGatewayException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { EspnHttpClient } from '../../common/espn/espn-http.client';
import {
  FOOTBALL_COMPETITIONS,
  FOOTBALL_REGIONS,
  FootballCompetitionConfig,
} from './competitions.catalog';
import {
  CompetitionTeam,
  EspnCollection,
  EspnRef,
  EspnScoreboardCompetitor,
  EspnScoreboardEvent,
  EspnScoreboardResponse,
  EspnSeason,
  EspnSeasonType,
  EspnStandingEntry,
  EspnStandingsResponse,
  EspnTournament,
} from './competitions.types';

const catalogCacheTtlSeconds = 86_400;
const seasonCacheTtlSeconds = 21_600;
const standingsCacheTtlSeconds = 600;
const tournamentCacheTtlSeconds = 1_800;
const pendingTournamentCacheTtlSeconds = 600;

type CacheEntry = {
  expiresAt: number;
  value: unknown;
};

type SeasonBundle = {
  partial: boolean;
  season: EspnSeason;
  types: EspnSeasonType[];
};

@Injectable()
export class CompetitionsService {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly inFlight = new Map<string, Promise<unknown>>();

  constructor(private readonly espnClient: EspnHttpClient) {}

  findAll() {
    return {
      regions: FOOTBALL_REGIONS,
      competitions: FOOTBALL_COMPETITIONS.map((competition) => ({
        id: competition.id,
        name: competition.name,
        shortName: competition.shortName,
        regionId: competition.regionId,
        format: competition.format,
        logo: this.buildLeagueLogo(competition.logoId),
        capabilities: competition.capabilities,
      })),
      meta: {
        generatedAt: new Date().toISOString(),
        cacheTtlSeconds: catalogCacheTtlSeconds,
      },
    };
  }

  async findCurrentSeason(competitionId: string) {
    const competition = this.getCompetition(competitionId);
    const bundle = await this.getSeasonBundle(competition.id);

    return {
      competitionId: competition.id,
      year: bundle.season.year,
      displayName:
        bundle.season.displayName ?? String(bundle.season.year ?? ''),
      startDate: bundle.season.startDate ?? null,
      endDate: bundle.season.endDate ?? null,
      phases: bundle.types.map((type) => this.toPhaseSummary(type)),
      partial: bundle.partial,
      meta: this.meta(seasonCacheTtlSeconds),
    };
  }

  async findStandings(competitionId: string, requestedSeason?: number) {
    const competition = this.getCompetition(competitionId);

    if (!competition.capabilities.standings) {
      return {
        competitionId: competition.id,
        applicable: false,
        kind: 'NONE' as const,
        season: requestedSeason ?? null,
        seasonName: null,
        sections: [],
        partial: false,
        reason: 'Esta competição não possui tabela de classificação.',
        meta: this.meta(standingsCacheTtlSeconds),
      };
    }

    const bundle = await this.getSeasonBundle(competition.id, requestedSeason);
    const season = bundle.season.year;

    if (!season) {
      throw new BadGatewayException('Temporada da ESPN inválida.');
    }

    const response = await this.getCached(
      `competitions:${competition.id}:${season}:standings:v1`,
      standingsCacheTtlSeconds,
      () =>
        this.espnClient.getStandings<EspnStandingsResponse>(
          competition.id,
          season,
        ),
    );
    const children = Array.isArray(response.children) ? response.children : [];
    let partial = bundle.partial || !Array.isArray(response.children);
    const sections = children.map((child, sectionIndex) => {
      const sourceEntries = Array.isArray(child.standings?.entries)
        ? child.standings.entries
        : [];
      const entries = sourceEntries
        .map((entry, index) => this.toStandingEntry(entry, index, competition))
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

      if (entries.length !== sourceEntries.length) {
        partial = true;
      }

      return {
        id: child.id ?? String(sectionIndex + 1),
        name: this.normalizeSectionName(
          child.name ??
            child.abbreviation ??
            response.season?.displayName ??
            competition.name,
          competition,
        ),
        entries,
      };
    });

    return {
      competitionId: competition.id,
      applicable: true,
      kind: competition.format,
      season,
      seasonName:
        response.season?.displayName ??
        bundle.season.displayName ??
        String(season),
      sections,
      partial,
      reason:
        sections.length === 0
          ? 'A ESPN ainda não publicou a classificação desta competição.'
          : null,
      meta: this.meta(standingsCacheTtlSeconds),
    };
  }

  async findTournament(competitionId: string, requestedSeason?: number) {
    const competition = this.getCompetition(competitionId);

    if (!competition.capabilities.tournament) {
      return {
        competitionId: competition.id,
        applicable: false,
        season: requestedSeason ?? null,
        seasonName: null,
        phases: [],
        partial: false,
        reason: 'Esta competição não possui fases eliminatórias.',
        warnings: [],
        meta: this.meta(tournamentCacheTtlSeconds),
      };
    }

    const bundle = await this.getSeasonBundle(competition.id, requestedSeason);
    const season = bundle.season.year;

    if (!season) {
      throw new BadGatewayException('Temporada da ESPN inválida.');
    }

    return this.getCached(
      `competitions:${competition.id}:${season}:tournament:v1`,
      pendingTournamentCacheTtlSeconds,
      () => this.loadTournament(competition, bundle),
      (response) => response.meta.cacheTtlSeconds,
    );
  }

  private async loadTournament(
    competition: FootballCompetitionConfig,
    bundle: SeasonBundle,
  ) {
    const season = bundle.season.year as number;
    const tournamentRef = bundle.season.tournament?.$ref;
    const warnings: string[] = [];

    if (!tournamentRef) {
      return {
        competitionId: competition.id,
        applicable: true,
        season,
        seasonName: bundle.season.displayName ?? String(season),
        phases: bundle.types.map((type) => this.toUnpublishedPhase(type)),
        partial: true,
        reason: 'A ESPN ainda não publicou a estrutura do torneio.',
        warnings: ['Referência de torneio ausente na temporada da ESPN.'],
        meta: this.meta(pendingTournamentCacheTtlSeconds),
      };
    }

    const dates = this.toEspnSeasonDateRange(bundle.season);
    const [tournamentResult, scoreboardResult] = await Promise.allSettled([
      this.espnClient.getRef<EspnTournament>(tournamentRef),
      this.espnClient.getScoreboard<EspnScoreboardResponse>(
        competition.id,
        dates,
      ),
    ]);

    if (tournamentResult.status === 'rejected') {
      warnings.push(
        'A estrutura de fases da ESPN está temporariamente indisponível.',
      );
    }

    if (scoreboardResult.status === 'rejected') {
      warnings.push(
        'Os detalhes dos confrontos estão temporariamente indisponíveis.',
      );
    }

    const tournament =
      tournamentResult.status === 'fulfilled' ? tournamentResult.value : null;
    const scoreboard =
      scoreboardResult.status === 'fulfilled' ? scoreboardResult.value : null;
    const eventMap = new Map(
      (scoreboard?.events ?? [])
        .filter((event) => event.season?.year === season && event.id)
        .map((event) => [event.id as string, event]),
    );
    const tournamentGroups = Array.isArray(tournament?.groups)
      ? tournament.groups
      : [];
    const phases =
      tournamentGroups.length > 0
        ? tournamentGroups.map((group, index) =>
            this.toTournamentPhase(
              group,
              index,
              bundle.types,
              eventMap,
              Boolean(scoreboard),
            ),
          )
        : bundle.types.map((type) => this.toUnpublishedPhase(type));
    const partial =
      bundle.partial ||
      tournamentResult.status === 'rejected' ||
      scoreboardResult.status === 'rejected' ||
      phases.some((phase) => phase.state === 'UNAVAILABLE');
    const hasPendingPhase = phases.some(
      (phase) => phase.state === 'NOT_PUBLISHED' || phase.state === 'TBD',
    );
    const hasLiveEvent = phases.some((phase) =>
      phase.ties.some((tie) => tie.legs.some((leg) => leg.status === 'LIVE')),
    );
    const ttl = hasLiveEvent
      ? 120
      : hasPendingPhase
        ? pendingTournamentCacheTtlSeconds
        : tournamentCacheTtlSeconds;

    return {
      competitionId: competition.id,
      applicable: true,
      season,
      seasonName: bundle.season.displayName ?? String(season),
      phases,
      partial,
      reason:
        phases.length === 0
          ? 'A ESPN ainda não publicou as fases desta competição.'
          : null,
      warnings,
      meta: this.meta(ttl),
    };
  }

  private toTournamentPhase(
    group: NonNullable<EspnTournament['groups']>[number],
    index: number,
    seasonTypes: EspnSeasonType[],
    eventMap: Map<string, EspnScoreboardEvent>,
    hasScoreboard: boolean,
  ) {
    const seasonType = seasonTypes.find(
      (type) =>
        String(type.type) === String(group.id) ||
        String(type.id) === String(group.id),
    );
    const slug =
      seasonType?.slug ??
      this.slugify(group.displayName ?? `fase-${index + 1}`);
    const kind = this.isTablePhase(slug) ? 'TABLE' : 'KNOCKOUT';
    const eventIds = (group.matchups ?? []).flatMap((matchup) => {
      const refs = matchup.events ?? [];

      if (refs.length === 0 && matchup.id) {
        return [matchup.id];
      }

      return refs
        .map((ref) => this.extractEventId(ref.$ref))
        .filter((eventId): eventId is string => eventId !== null);
    });
    const events = eventIds
      .map((eventId) => eventMap.get(eventId))
      .filter((event): event is EspnScoreboardEvent => Boolean(event));
    const ties =
      kind === 'KNOCKOUT' ? this.groupEventsIntoTies(events, slug) : [];
    let state: 'NOT_PUBLISHED' | 'TBD' | 'AVAILABLE' | 'UNAVAILABLE';

    if (eventIds.length === 0) {
      state = 'NOT_PUBLISHED';
    } else if (!hasScoreboard || events.length === 0) {
      state = 'UNAVAILABLE';
    } else if (events.every((event) => this.eventHasOnlyTbdTeams(event))) {
      state = 'TBD';
    } else if (
      kind === 'KNOCKOUT' &&
      ties.length > 0 &&
      ties.every((tie) => tie.state === 'UNAVAILABLE')
    ) {
      state = 'UNAVAILABLE';
    } else {
      state = 'AVAILABLE';
    }

    return {
      id: seasonType?.id ?? group.id ?? String(index + 1),
      sourceTypeId: seasonType?.type ?? this.toNumber(group.id),
      slug,
      name: this.translatePhase(slug, group.displayName ?? seasonType?.name),
      sourceName: group.displayName ?? seasonType?.name ?? null,
      kind,
      startDate: group.startDate ?? seasonType?.startDate ?? null,
      endDate: group.endDate ?? seasonType?.endDate ?? null,
      state,
      ties,
    };
  }

  private groupEventsIntoTies(
    events: EspnScoreboardEvent[],
    phaseSlug: string,
  ) {
    const groups = new Map<string, EspnScoreboardEvent[]>();

    for (const event of events) {
      const competitors = event.competitions?.[0]?.competitors ?? [];
      const teamIds = competitors
        .map((competitor) => competitor.team?.id ?? competitor.id)
        .filter((id): id is string => Boolean(id));
      const hasTbd = competitors.some((competitor) =>
        this.isTbdName(competitor.team?.displayName),
      );
      const key =
        teamIds.length === 2 && !hasTbd
          ? `${phaseSlug}:${[...teamIds].sort().join(':')}`
          : `${phaseSlug}:event:${event.id ?? groups.size}`;
      const current = groups.get(key) ?? [];

      current.push(event);
      groups.set(key, current);
    }

    return [...groups.entries()].map(([key, groupedEvents]) =>
      this.toTie(key, groupedEvents),
    );
  }

  private toTie(key: string, events: EspnScoreboardEvent[]) {
    const sortedEvents = [...events].sort((first, second) => {
      const firstLeg = first.competitions?.[0]?.leg?.value ?? 99;
      const secondLeg = second.competitions?.[0]?.leg?.value ?? 99;

      return (
        firstLeg - secondLeg ||
        (first.date ?? '').localeCompare(second.date ?? '')
      );
    });
    const lastEvent = sortedEvents[sortedEvents.length - 1];
    const lastCompetition = lastEvent?.competitions?.[0];
    const series = [...sortedEvents]
      .reverse()
      .map((event) => event.competitions?.[0]?.series)
      .find(Boolean);
    const aggregate = (series?.competitors ?? [])
      .filter(
        (competitor) =>
          Boolean(competitor.id) &&
          this.toNumber(competitor.aggregateScore) !== null,
      )
      .map((competitor) => ({
        teamId: competitor.id as string,
        value: this.toNumber(competitor.aggregateScore) as number,
      }));
    const penalties = (lastCompetition?.competitors ?? [])
      .filter(
        (competitor) =>
          Boolean(competitor.team?.id ?? competitor.id) &&
          this.toNumber(competitor.shootoutScore) !== null,
      )
      .map((competitor) => ({
        teamId: (competitor.team?.id ?? competitor.id) as string,
        value: this.toNumber(competitor.shootoutScore) as number,
      }));
    const winnerTeamId =
      series?.competitors?.find((competitor) => competitor.winner)?.id ??
      lastCompetition?.competitors?.find((competitor) => competitor.advance)
        ?.team?.id ??
      (sortedEvents.length === 1 && this.isCompleted(lastEvent)
        ? lastCompetition?.competitors?.find((competitor) => competitor.winner)
            ?.team?.id
        : undefined) ??
      null;
    const teams = this.uniqueTeams(sortedEvents);
    const note = [...sortedEvents]
      .reverse()
      .flatMap((event) => event.competitions?.[0]?.notes ?? [])
      .map((item) => item.headline)
      .find(Boolean);

    return {
      id: key,
      title: series?.title ?? null,
      state:
        teams.length === 0
          ? 'UNAVAILABLE'
          : teams.every((team) => team.isTbd)
            ? 'TBD'
            : 'AVAILABLE',
      teams,
      legs: sortedEvents.map((event) => this.toTournamentEvent(event)),
      aggregate: aggregate.length > 0 ? aggregate : null,
      penalties: penalties.length > 0 ? penalties : null,
      winnerTeamId,
      completed:
        series?.completed ??
        (sortedEvents.length === 1 && this.isCompleted(lastEvent)),
      note: note ?? null,
      progression: null,
    };
  }

  private toTournamentEvent(event: EspnScoreboardEvent) {
    const competition = event.competitions?.[0];
    const status = competition?.status ?? event.status;
    const exposeScore = status?.type?.state === 'in' || status?.type?.completed;
    const home = competition?.competitors?.find(
      (competitor) => competitor.homeAway === 'home',
    );
    const away = competition?.competitors?.find(
      (competitor) => competitor.homeAway === 'away',
    );

    return {
      id: event.id ?? '',
      kickoff: competition?.date ?? event.date ?? null,
      leg: competition?.leg?.value ?? null,
      legLabel: this.translateLeg(competition?.leg?.value),
      status: this.normalizeStatus(
        status?.type?.name,
        status?.type?.state,
        status?.type?.completed,
      ),
      statusLabel:
        status?.type?.detail ??
        status?.type?.description ??
        'Status indisponível',
      homeTeam: this.toCompetitionTeam(home),
      awayTeam: this.toCompetitionTeam(away),
      score: {
        home: exposeScore ? this.toNumber(home?.score) : null,
        away: exposeScore ? this.toNumber(away?.score) : null,
      },
    };
  }

  private uniqueTeams(events: EspnScoreboardEvent[]) {
    const teams = new Map<string, CompetitionTeam & { isTbd: boolean }>();

    for (const competitor of events.flatMap(
      (event) => event.competitions?.[0]?.competitors ?? [],
    )) {
      const team = this.toCompetitionTeam(competitor);

      if (team) {
        teams.set(team.id, {
          ...team,
          isTbd: this.isTbdName(team.name),
        });
      }
    }

    return [...teams.values()];
  }

  private toCompetitionTeam(
    competitor: EspnScoreboardCompetitor | undefined,
  ): (CompetitionTeam & { isTbd: boolean }) | null {
    if (!competitor) {
      return null;
    }

    const id = competitor.team?.id ?? competitor.id;
    const name =
      competitor.team?.displayName ??
      competitor.team?.shortDisplayName ??
      (id ? `Time ${id}` : null);

    if (!id || !name) {
      return null;
    }

    return {
      id,
      name,
      abbreviation: competitor.team?.abbreviation ?? null,
      logo: competitor.team?.logo ?? null,
      isTbd: this.isTbdName(name),
    };
  }

  private toStandingEntry(
    entry: EspnStandingEntry,
    index: number,
    competition: FootballCompetitionConfig,
  ) {
    const teamId = entry.team?.id;
    const teamName = entry.team?.displayName ?? entry.team?.shortDisplayName;

    if (!teamId || !teamName || !Array.isArray(entry.stats)) {
      return null;
    }

    const stat = (name: string) =>
      entry.stats?.find((item) => item.name === name)?.value ?? null;

    const position = stat('rank') ?? index + 1;

    return {
      position,
      team: {
        id: teamId,
        name: teamName,
        abbreviation: entry.team?.abbreviation ?? null,
        logo:
          entry.team?.logos?.find((logo) => logo.rel?.includes('default'))
            ?.href ??
          entry.team?.logos?.[0]?.href ??
          null,
      },
      played: stat('gamesPlayed'),
      wins: stat('wins'),
      draws: stat('ties'),
      losses: stat('losses'),
      goalsFor: stat('pointsFor'),
      goalsAgainst: stat('pointsAgainst'),
      goalDifference: stat('pointDifferential'),
      points: stat('points'),
      deductions: stat('deductions') ?? 0,
      zone: this.toStandingZone(entry, competition, position),
    };
  }

  private async getSeasonBundle(competitionId: string, season?: number) {
    const key = `competitions:${competitionId}:${season ?? 'current'}:season:v1`;

    return this.getCached(key, seasonCacheTtlSeconds, async () => {
      const seasonPath = season
        ? `/sports/soccer/leagues/${encodeURIComponent(competitionId)}/seasons/${season}?lang=en&region=us`
        : `/sports/soccer/leagues/${encodeURIComponent(competitionId)}/season?lang=en&region=us`;
      const source = await this.espnClient.getCore<EspnSeason>(seasonPath);

      if (!source.year || !source.startDate || !source.endDate) {
        throw new BadGatewayException('Temporada da ESPN inválida.');
      }

      try {
        const collection = await this.espnClient.getCore<
          EspnCollection<EspnRef>
        >(
          `/sports/soccer/leagues/${encodeURIComponent(competitionId)}/seasons/${source.year}/types?limit=100&lang=en&region=us`,
        );
        const refs = (collection.items ?? [])
          .map((item) => item.$ref)
          .filter((ref): ref is string => Boolean(ref));
        const results = await Promise.allSettled(
          refs.map((ref) => this.espnClient.getRef<EspnSeasonType>(ref)),
        );
        const types = results
          .filter(
            (result): result is PromiseFulfilledResult<EspnSeasonType> =>
              result.status === 'fulfilled',
          )
          .map((result) => result.value)
          .sort(
            (first, second) =>
              Number(first.id ?? Number.MAX_SAFE_INTEGER) -
              Number(second.id ?? Number.MAX_SAFE_INTEGER),
          );

        return {
          season: source,
          types,
          partial: results.some((result) => result.status === 'rejected'),
        } satisfies SeasonBundle;
      } catch {
        return {
          season: source,
          types: [],
          partial: true,
        } satisfies SeasonBundle;
      }
    });
  }

  private getCached<T>(
    key: string,
    ttlSeconds: number,
    loader: () => Promise<T>,
    resolveTtl?: (value: T) => number,
  ): Promise<T> {
    const cached = this.cache.get(key);

    if (cached && cached.expiresAt > Date.now()) {
      return Promise.resolve(cached.value as T);
    }

    const existing = this.inFlight.get(key) as Promise<T> | undefined;

    if (existing) {
      return existing;
    }

    const request = loader()
      .then((value) => {
        const resolvedTtl = resolveTtl?.(value) ?? ttlSeconds;

        this.cache.set(key, {
          value,
          expiresAt: Date.now() + resolvedTtl * 1000,
        });

        return value;
      })
      .finally(() => this.inFlight.delete(key));

    this.inFlight.set(key, request);

    return request;
  }

  private getCompetition(competitionId: string) {
    const competition = FOOTBALL_COMPETITIONS.find(
      (item) => item.id === competitionId,
    );

    if (!competition) {
      throw new NotFoundException('Competição não suportada.');
    }

    return competition;
  }

  private toStandingZone(
    entry: EspnStandingEntry,
    competition: FootballCompetitionConfig,
    position: number,
  ) {
    if (entry.note?.description) {
      return {
        description: entry.note.description,
        rank: entry.note.rank ?? null,
        color: entry.note.color ?? null,
      };
    }

    if (competition.format !== 'LEAGUE_PHASE') {
      return null;
    }

    let description: string;

    if (position <= 8) {
      description = 'Classificação direta para as oitavas';
    } else if (position <= 16) {
      description = 'Playoff do mata-mata — cabeça de chave';
    } else if (position <= 24) {
      description = 'Playoff do mata-mata — não cabeça de chave';
    } else {
      description = 'Eliminado';
    }

    return { description, rank: position, color: null };
  }

  private normalizeSectionName(
    name: string,
    competition: FootballCompetitionConfig,
  ) {
    if (competition.format === 'GROUPS') {
      return name.replace(/^Group\s+/i, 'Grupo ');
    }

    if (competition.format === 'LEAGUE_PHASE' && /^League Phase$/i.test(name)) {
      return 'Fase de liga';
    }

    return name;
  }

  private toPhaseSummary(type: EspnSeasonType) {
    const slug = type.slug ?? this.slugify(type.name ?? type.id ?? 'fase');

    return {
      id: type.id ?? slug,
      sourceTypeId: type.type ?? null,
      slug,
      name: this.translatePhase(slug, type.name),
      sourceName: type.name ?? null,
      kind: this.isTablePhase(slug) ? 'TABLE' : 'KNOCKOUT',
      startDate: type.startDate ?? null,
      endDate: type.endDate ?? null,
    };
  }

  private toUnpublishedPhase(type: EspnSeasonType) {
    return {
      ...this.toPhaseSummary(type),
      state: 'NOT_PUBLISHED' as const,
      ties: [],
    };
  }

  private isTablePhase(slug: string) {
    return slug === 'group-stage' || slug === 'league-phase';
  }

  private eventHasOnlyTbdTeams(event: EspnScoreboardEvent) {
    const competitors = event.competitions?.[0]?.competitors ?? [];

    return (
      competitors.length > 0 &&
      competitors.every((competitor) =>
        this.isTbdName(competitor.team?.displayName),
      )
    );
  }

  private isTbdName(name: string | undefined) {
    return Boolean(name && /^TBD(?:\s|$)/i.test(name));
  }

  private isCompleted(event: EspnScoreboardEvent | undefined) {
    return Boolean(
      event?.competitions?.[0]?.status?.type?.completed ??
      event?.status?.type?.completed,
    );
  }

  private normalizeStatus(name?: string, state?: string, completed?: boolean) {
    if (name === 'STATUS_FINAL_PEN') return 'FINAL_PENALTIES';
    if (completed) return 'FINAL';
    if (state === 'in') return 'LIVE';
    if (name === 'STATUS_POSTPONED') return 'POSTPONED';
    if (name === 'STATUS_CANCELED' || name === 'STATUS_CANCELLED') {
      return 'CANCELED';
    }
    if (state === 'pre') return 'SCHEDULED';

    return 'UNKNOWN';
  }

  private translatePhase(slug: string, fallback?: string) {
    const labels: Record<string, string> = {
      'first-stage': 'Primeira fase',
      'first-round': 'Primeira fase',
      'second-stage': 'Segunda fase',
      'second-round': 'Segunda fase',
      'third-stage': 'Terceira fase',
      'third-round': 'Terceira fase',
      'fourth-round': 'Quarta fase',
      'fifth-round': 'Quinta fase',
      'group-stage': 'Fase de grupos',
      'league-phase': 'Fase de liga',
      'knockout-round-playoffs': 'Playoffs do mata-mata',
      'round-of-16': 'Oitavas de final',
      quarterfinals: 'Quartas de final',
      semifinals: 'Semifinais',
      final: 'Final',
      finals: 'Final',
    };

    return labels[slug] ?? fallback ?? slug;
  }

  private translateLeg(leg?: number) {
    if (leg === 1) return 'Ida';
    if (leg === 2) return 'Volta';

    return null;
  }

  private toEspnSeasonDateRange(season: EspnSeason) {
    const start = this.formatEspnDate(season.startDate);
    const end = this.formatEspnDate(season.endDate);

    return `${start}-${end}`;
  }

  private formatEspnDate(value: string | undefined) {
    const date = value ? new Date(value) : null;

    if (!date || Number.isNaN(date.getTime())) {
      throw new BadGatewayException('Período da temporada da ESPN inválido.');
    }

    return [
      date.getUTCFullYear(),
      String(date.getUTCMonth() + 1).padStart(2, '0'),
      String(date.getUTCDate()).padStart(2, '0'),
    ].join('');
  }

  private extractEventId(ref: string | undefined) {
    const [, eventId] = ref?.match(/\/events\/(\d+)/) ?? [];

    return eventId ?? null;
  }

  private toNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const number = Number(value);

    return Number.isFinite(number) ? number : null;
  }

  private slugify(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private buildLeagueLogo(logoId: string) {
    return `https://a.espncdn.com/i/leaguelogos/soccer/500/${logoId}.png`;
  }

  private meta(cacheTtlSeconds: number) {
    return {
      generatedAt: new Date().toISOString(),
      cacheTtlSeconds,
    };
  }
}
