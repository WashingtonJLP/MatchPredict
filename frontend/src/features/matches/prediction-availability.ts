import type { MatchFixture } from "../../types/fixture";

const timeZone = "America/Sao_Paulo";
const periodFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone,
  year: "numeric",
  month: "2-digit",
});

function getPeriodIndex(date: Date) {
  const parts = periodFormatter.formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  return year * 12 + month;
}

export function getFuturePredictionMessage(kickoff: string, now = new Date()) {
  const date = new Date(kickoff);
  if (getPeriodIndex(date) <= getPeriodIndex(now)) {
    return null;
  }

  const month = new Intl.DateTimeFormat("pt-BR", {
    timeZone,
    month: "long",
    year: "numeric",
  }).format(date);
  return `Palpites para este jogo estarão disponíveis em ${month}.`;
}

export function canFixtureReceivePrediction(
  fixture: MatchFixture,
  now = new Date(),
) {
  return (
    fixture.canPredict &&
    new Date(fixture.kickoff).getTime() > now.getTime() &&
    fixture.status !== "LIVE" &&
    fixture.status !== "FT" &&
    getFuturePredictionMessage(fixture.kickoff, now) === null
  );
}
