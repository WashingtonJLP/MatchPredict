import { getParticipationPeriodForDate } from './participation-period';

describe('getParticipationPeriodForDate', () => {
  it('usa o mês do kickoff em America/Sao_Paulo', () => {
    const period = getParticipationPeriodForDate(
      new Date('2026-11-01T02:30:00.000Z'),
    );

    expect(period).toEqual({
      referenceYear: 2026,
      referenceMonth: 10,
      startsAt: new Date('2026-10-01T03:00:00.000Z'),
      endsAt: new Date('2026-11-01T03:00:00.000Z'),
    });
  });

  it('vira o ano no limite local de janeiro', () => {
    const period = getParticipationPeriodForDate(
      new Date('2027-01-01T03:00:00.000Z'),
    );

    expect(period.referenceYear).toBe(2027);
    expect(period.referenceMonth).toBe(1);
    expect(period.startsAt).toEqual(new Date('2027-01-01T03:00:00.000Z'));
    expect(period.endsAt).toEqual(new Date('2027-02-01T03:00:00.000Z'));
  });

  it.each([
    ['um milissegundo antes de outubro', '2026-10-01T02:59:59.999Z', 2026, 9],
    ['inÃ­cio inclusivo de outubro', '2026-10-01T03:00:00.000Z', 2026, 10],
    ['Ãºltimo instante de outubro', '2026-11-01T02:59:59.999Z', 2026, 10],
    ['fim exclusivo de outubro', '2026-11-01T03:00:00.000Z', 2026, 11],
    ['Ãºltimo instante do ano', '2027-01-01T02:59:59.999Z', 2026, 12],
    ['primeiro instante do ano novo', '2027-01-01T03:00:00.000Z', 2027, 1],
  ])(
    'classifica %s em America/Sao_Paulo',
    (_label, timestamp, referenceYear, referenceMonth) => {
      const period = getParticipationPeriodForDate(new Date(timestamp));

      expect(period).toMatchObject({ referenceYear, referenceMonth });
      expect(period.startsAt.getTime()).toBeLessThanOrEqual(
        new Date(timestamp).getTime(),
      );
      expect(period.endsAt.getTime()).toBeGreaterThan(
        new Date(timestamp).getTime(),
      );
    },
  );
});
