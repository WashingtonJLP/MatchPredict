export const PARTICIPATION_TIME_ZONE = 'America/Sao_Paulo';
export const MONTHLY_PARTICIPATION_FEE_CENTS = 2_500;
export const PARTICIPATION_CURRENCY = 'BRL';

export type ParticipationPeriodDescriptor = {
  referenceYear: number;
  referenceMonth: number;
  startsAt: Date;
  endsAt: Date;
};

const zonedPartsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: PARTICIPATION_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

export function getParticipationPeriodForDate(
  date: Date,
): ParticipationPeriodDescriptor {
  const parts = getZonedParts(date);
  const nextMonth = parts.month === 12 ? 1 : parts.month + 1;
  const nextYear = parts.month === 12 ? parts.year + 1 : parts.year;

  return {
    referenceYear: parts.year,
    referenceMonth: parts.month,
    startsAt: zonedMidnightToUtc(parts.year, parts.month, 1),
    endsAt: zonedMidnightToUtc(nextYear, nextMonth, 1),
  };
}

function zonedMidnightToUtc(year: number, month: number, day: number) {
  const targetAsUtc = Date.UTC(year, month - 1, day);
  let candidate = new Date(targetAsUtc);

  // Recalculate to account for the timezone offset in force at each boundary.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = getZonedParts(candidate);
    const candidateAsUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    );
    const difference = targetAsUtc - candidateAsUtc;

    if (difference === 0) {
      break;
    }

    candidate = new Date(candidate.getTime() + difference);
  }

  return candidate;
}

function getZonedParts(date: Date) {
  const parts = zonedPartsFormatter.formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? '0');

  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour: read('hour'),
    minute: read('minute'),
    second: read('second'),
  };
}
