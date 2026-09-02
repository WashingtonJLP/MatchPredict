const saoPauloTimeZone = "America/Sao_Paulo";

export function getTodayInSaoPaulo() {
  return formatDateInSaoPaulo(new Date());
}

export function isValidPlainDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = parsePlainDate(value);

  return formatPlainDate(date) === value;
}

export function addDaysToPlainDate(value: string, days: number) {
  const date = parsePlainDate(value);

  date.setUTCDate(date.getUTCDate() + days);

  return formatPlainDate(date);
}

export function formatLongDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(parsePlainDate(value));
}

export function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(parsePlainDate(value));
}

function formatDateInSaoPaulo(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: saoPauloTimeZone,
    year: "numeric",
  }).formatToParts(date);

  return `${getPart(parts, "year")}-${getPart(parts, "month")}-${getPart(
    parts,
    "day",
  )}`;
}

function parsePlainDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
}

function formatPlainDate(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getPart(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
) {
  return parts.find((part) => part.type === type)?.value ?? "";
}
