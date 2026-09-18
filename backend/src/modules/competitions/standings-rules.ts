import type {
  StandingZoneOrigin,
  StandingZoneType,
} from './competitions.types';

export type NormalizedStandingZone = {
  type: StandingZoneType;
  origin: StandingZoneOrigin;
  description: string;
  rank: number | null;
  color: string | null;
};

type DerivedZoneRule = {
  from: number;
  to: number;
  type: StandingZoneType;
  description: string;
};

const RULES_BY_COMPETITION_AND_SEASON: Readonly<
  Record<string, Readonly<Record<number, readonly DerivedZoneRule[]>>>
> = {
  'bra.1': {
    2026: [
      {
        from: 1,
        to: 4,
        type: 'CONTINENTAL_PRIMARY',
        description: 'Libertadores — fase de grupos',
      },
      {
        from: 5,
        to: 5,
        type: 'CONTINENTAL_PRIMARY_QUALIFYING',
        description: 'Libertadores — fase preliminar',
      },
      {
        from: 6,
        to: 11,
        type: 'CONTINENTAL_SECONDARY',
        description: 'Sul-Americana',
      },
      {
        from: 17,
        to: 20,
        type: 'RELEGATION',
        description: 'Rebaixamento à Série B',
      },
    ],
  },
  'bra.2': {
    2026: [
      {
        from: 1,
        to: 2,
        type: 'PROMOTION',
        description: 'Acesso direto à Série A',
      },
      {
        from: 3,
        to: 6,
        type: 'PROMOTION_PLAYOFF',
        description: 'Playoff de acesso à Série A',
      },
      {
        from: 17,
        to: 20,
        type: 'RELEGATION',
        description: 'Rebaixamento à Série C',
      },
    ],
  },
  'uefa.champions': {
    2026: uefaLeaguePhaseRules(),
  },
  'uefa.europa': {
    2026: uefaLeaguePhaseRules(),
  },
};

export function normalizeExplicitStandingZone(
  description: string,
): StandingZoneType {
  const value = normalizeLabel(description);

  if (value.includes('relegation playoff')) return 'RELEGATION_PLAYOFF';
  if (value.includes('relegation') || value.includes('relegated')) {
    return 'RELEGATION';
  }
  if (value.includes('promotion playoff')) return 'PROMOTION_PLAYOFF';
  if (value.includes('promotion') || value.includes('promoted')) {
    return 'PROMOTION';
  }
  if (value.includes('knockout phase playoffs')) {
    return value.includes('unseeded')
      ? 'KNOCKOUT_PLAYOFF_UNSEEDED'
      : 'KNOCKOUT_PLAYOFF_SEEDED';
  }
  if (
    value.includes('qualifies for round of 16') ||
    value.includes('direct qualification')
  ) {
    return 'KNOCKOUT_DIRECT';
  }
  if (value.includes('eliminated')) return 'ELIMINATED';
  if (value.includes('champions league qualifying')) {
    return 'CONTINENTAL_PRIMARY_QUALIFYING';
  }
  if (value.includes('champions league') || value.includes('libertadores')) {
    return 'CONTINENTAL_PRIMARY';
  }
  if (value.includes('europa league qualifying')) {
    return 'CONTINENTAL_SECONDARY_QUALIFYING';
  }
  if (
    value.includes('europa league') ||
    value.includes('sudamericana') ||
    value.includes('sul-americana')
  ) {
    return 'CONTINENTAL_SECONDARY';
  }
  if (value.includes('conference league qualifying')) {
    return 'CONTINENTAL_TERTIARY_QUALIFYING';
  }
  if (value.includes('conference league')) return 'CONTINENTAL_TERTIARY';
  if (value.includes('qualified') || value.includes('qualifies')) {
    return 'QUALIFIED';
  }

  return 'OTHER';
}

export function getDerivedStandingZone(
  competitionId: string,
  season: number,
  position: number,
): NormalizedStandingZone | null {
  const rule = RULES_BY_COMPETITION_AND_SEASON[competitionId]?.[season]?.find(
    (candidate) => position >= candidate.from && position <= candidate.to,
  );

  if (!rule) return null;

  return {
    type: rule.type,
    origin: 'RULE_DERIVED',
    description: rule.description,
    rank: position,
    color: null,
  };
}

function uefaLeaguePhaseRules(): readonly DerivedZoneRule[] {
  return [
    {
      from: 1,
      to: 8,
      type: 'KNOCKOUT_DIRECT',
      description: 'Classificação direta para as oitavas',
    },
    {
      from: 9,
      to: 16,
      type: 'KNOCKOUT_PLAYOFF_SEEDED',
      description: 'Playoff do mata-mata — cabeça de chave',
    },
    {
      from: 17,
      to: 24,
      type: 'KNOCKOUT_PLAYOFF_UNSEEDED',
      description: 'Playoff do mata-mata — não cabeça de chave',
    },
    {
      from: 25,
      to: 36,
      type: 'ELIMINATED',
      description: 'Eliminado',
    },
  ];
}

function normalizeLabel(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}
