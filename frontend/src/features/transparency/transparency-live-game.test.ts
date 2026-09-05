import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPremierLeagueGamesBySourceEventId,
  getDailyGameForFixture,
  getTransparencyFixtureStatusLabel,
  getTransparencyStatusLabel,
  getTransparencyVisualGame,
  getUniqueFixtureDates,
  hasCompleteDailyGameScore,
} from "./transparency-live-game.ts";
import type {
  DailyGame,
  DailyGameStatus,
  DailyGamesCompetition,
} from "@/types/daily-game";

test("mantem o visual atual para SCHEDULED sem inventar 0 x 0", () => {
  const scheduled = createGame("SCHEDULED", null, null);

  assert.equal(getTransparencyVisualGame(scheduled), undefined);
  assert.equal(hasCompleteDailyGameScore(scheduled), false);
});

test("preserva placares completos, inclusive LIVE em 0 x 0", () => {
  const liveNilNil = createGame("LIVE", 0, 0);
  const liveWithGoals = createGame("LIVE", 2, 1);

  assert.equal(getTransparencyVisualGame(liveNilNil), liveNilNil);
  assert.equal(hasCompleteDailyGameScore(liveNilNil), true);
  assert.equal(hasCompleteDailyGameScore(liveWithGoals), true);
});

test("mantem os rotulos normalizados para intervalo e encerrado", () => {
  assert.equal(
    getTransparencyStatusLabel(createGame("HALFTIME", 1, 0)),
    "Intervalo",
  );
  assert.equal(
    getTransparencyStatusLabel(createGame("FINAL", 2, 1)),
    "Encerrado",
  );
  assert.equal(
    getTransparencyStatusLabel(createGame("FINAL_PENALTIES", 4, 3)),
    "Pênaltis",
  );
});

test("associa somente Premier League pelo sourceEventId exato", () => {
  const premierLeagueGame = createGame("LIVE", 2, 1, "401860308");
  const anotherCompetitionGame = createGame(
    "LIVE",
    1,
    0,
    "401860309",
  );
  const competitions: DailyGamesCompetition[] = [
    {
      id: "bra.1",
      name: "Brasileirão Série A",
      logo: null,
      games: [anotherCompetitionGame],
    },
    {
      id: "eng.1",
      name: "Premier League",
      logo: null,
      games: [premierLeagueGame],
    },
  ];

  const gamesBySourceEventId =
    buildPremierLeagueGamesBySourceEventId(competitions);

  assert.equal(gamesBySourceEventId.get("401860308"), premierLeagueGame);
  assert.equal(gamesBySourceEventId.has("401860309"), false);
  assert.equal(gamesBySourceEventId.has("missing"), false);
});

test("descarta o enriquecimento visual quando Daily Games esta indisponivel", () => {
  const competitions: DailyGamesCompetition[] = [
    {
      id: "eng.1",
      name: "Premier League",
      logo: null,
      games: [createGame("LIVE", 2, 1)],
    },
  ];

  assert.equal(
    buildPremierLeagueGamesBySourceEventId(competitions, true).size,
    0,
  );
});

test("mantem o liveContext de cada data independente da partida selecionada", () => {
  const finishedOnSeptemberFourth = createGame(
    "FINAL",
    2,
    0,
    "event-04",
    "2026-09-04",
  );
  const halftimeOnSeptemberFifth = createGame(
    "HALFTIME",
    1,
    1,
    "event-05",
    "2026-09-05",
  );
  const fixtures = [
    {
      id: "fixture-04",
      kickoff: "2026-09-04T19:00:00.000Z",
      sourceEventId: "event-04",
    },
    {
      id: "fixture-05",
      kickoff: "2026-09-05T19:00:00.000Z",
      sourceEventId: "event-05",
    },
    {
      id: "fixture-without-daily-game",
      kickoff: "2026-09-05T21:00:00.000Z",
      sourceEventId: "missing-event",
    },
  ];
  const dates = getUniqueFixtureDates(fixtures, (kickoff) =>
    kickoff.slice(0, 10),
  );
  const competitions: DailyGamesCompetition[] = [
    createPremierLeagueCompetition([finishedOnSeptemberFourth]),
    createPremierLeagueCompetition([halftimeOnSeptemberFifth]),
  ];
  const gamesBySourceEventId =
    buildPremierLeagueGamesBySourceEventId(competitions);

  assert.deepEqual(dates, ["2026-09-04", "2026-09-05"]);

  for (const selectedFixtureId of ["fixture-04", "fixture-05"]) {
    assert.ok(selectedFixtureId);
    assert.equal(
      getDailyGameForFixture(gamesBySourceEventId, fixtures[0]),
      finishedOnSeptemberFourth,
    );
    assert.equal(
      getDailyGameForFixture(gamesBySourceEventId, fixtures[1]),
      halftimeOnSeptemberFifth,
    );
    assert.equal(
      getDailyGameForFixture(gamesBySourceEventId, fixtures[2]),
      undefined,
    );
  }
});

test("nao associa DailyGame por nome ou horario quando sourceEventId difere", () => {
  const dailyGame = createGame(
    "LIVE",
    0,
    0,
    "correct-event",
    "2026-09-05",
  );
  const gamesBySourceEventId = buildPremierLeagueGamesBySourceEventId([
    createPremierLeagueCompetition([dailyGame]),
  ]);

  assert.equal(
    getDailyGameForFixture(gamesBySourceEventId, {
      sourceEventId: "different-event",
    }),
    undefined,
  );
});

test("padroniza FT e FINAL como Encerrado na Transparencia", () => {
  assert.equal(getTransparencyFixtureStatusLabel("FT"), "Encerrado");
  assert.equal(
    getTransparencyStatusLabel(createGame("FINAL", 2, 1)),
    "Encerrado",
  );
});

function createPremierLeagueCompetition(
  games: DailyGame[],
): DailyGamesCompetition {
  return {
    id: "eng.1",
    name: "Premier League",
    logo: null,
    games,
  };
}

function createGame(
  status: DailyGameStatus,
  home: number | null,
  away: number | null,
  sourceEventId = "401860308",
  localDate = "2026-09-01",
): DailyGame {
  const statusLabels: Record<DailyGameStatus, string> = {
    SCHEDULED: "Pré-jogo",
    LIVE: "Ao vivo",
    HALFTIME: "Intervalo",
    FINAL: "Encerrado",
    FINAL_PENALTIES: "Encerrado nos pênaltis",
    DELAYED: "Atrasado",
    POSTPONED: "Adiado",
    CANCELED: "Cancelado",
    SUSPENDED: "Suspenso",
    UNKNOWN: "Status desconhecido",
  };

  return {
    id: `espn:eng.1:${sourceEventId}`,
    sourceEventId,
    kickoff: `${localDate}T19:00:00.000Z`,
    localDate,
    localTime: "16:00",
    status,
    statusLabel: statusLabels[status],
    minute: status === "LIVE" ? 67 : null,
    period: status === "SCHEDULED" ? 0 : 1,
    homeTeam: {
      id: "359",
      name: "Arsenal",
      abbreviation: "ARS",
      logo: null,
    },
    awayTeam: {
      id: "363",
      name: "Chelsea",
      abbreviation: "CHE",
      logo: null,
    },
    score: { home, away },
    stage: null,
  };
}
