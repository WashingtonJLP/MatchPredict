import {
  getDerivedStandingZone,
  normalizeExplicitStandingZone,
} from './standings-rules';

describe('standings rules', () => {
  it.each([
    ['Champions League', 'CONTINENTAL_PRIMARY'],
    ['Champions League qualifying', 'CONTINENTAL_PRIMARY_QUALIFYING'],
    ['Europa League', 'CONTINENTAL_SECONDARY'],
    ['Europa League qualifying', 'CONTINENTAL_SECONDARY_QUALIFYING'],
    ['Conference League', 'CONTINENTAL_TERTIARY'],
    ['Conference League qualifying', 'CONTINENTAL_TERTIARY_QUALIFYING'],
    ['Promotion', 'PROMOTION'],
    ['Promotion playoff', 'PROMOTION_PLAYOFF'],
    ['Qualifies for round of 16', 'KNOCKOUT_DIRECT'],
    ['Knockout phase playoffs - seeded', 'KNOCKOUT_PLAYOFF_SEEDED'],
    ['Knockout phase playoffs - unseeded', 'KNOCKOUT_PLAYOFF_UNSEEDED'],
    ['Eliminated', 'ELIMINATED'],
    ['Relegation playoff', 'RELEGATION_PLAYOFF'],
    ['Relegated', 'RELEGATION'],
    ['Qualified', 'QUALIFIED'],
  ] as const)('normaliza %s como %s', (description, expected) => {
    expect(normalizeExplicitStandingZone(description)).toBe(expected);
  });

  it('não aplica uma regra de 2026 silenciosamente a outra temporada', () => {
    expect(getDerivedStandingZone('bra.1', 2025, 1)).toBeNull();
    expect(getDerivedStandingZone('bra.2', 2027, 20)).toBeNull();
  });
});
