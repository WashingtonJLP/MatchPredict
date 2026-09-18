import assert from "node:assert/strict";
import test from "node:test";

import type { DailyGame } from "../../types/daily-game.ts";
import { getDailyGameShootoutScore } from "./daily-game-presentation.ts";

test("expõe o shootoutScore de FINAL_PENALTIES sem inverter as equipes", () => {
  const game = createGame({ home: 4, away: 5 });

  assert.deepEqual(getDailyGameShootoutScore(game), { home: 4, away: 5 });
});

test("não inventa números quando o placar dos pênaltis está ausente", () => {
  assert.equal(getDailyGameShootoutScore(createGame(null)), null);
});

test("não mostra shootoutScore fora de FINAL_PENALTIES", () => {
  assert.equal(
    getDailyGameShootoutScore({
      ...createGame({ home: 4, away: 5 }),
      status: "FINAL",
    }),
    null,
  );
});

function createGame(shootoutScore: DailyGame["shootoutScore"]): DailyGame {
  return {
    id: "game",
    sourceEventId: "event",
    kickoff: "2026-09-16T22:00:00.000Z",
    localDate: "2026-09-16",
    localTime: "19:00",
    status: "FINAL_PENALTIES",
    statusLabel: "Encerrado nos pênaltis",
    minute: null,
    period: 5,
    homeTeam: {
      id: "home-team",
      name: "Liga de Quito",
      abbreviation: "LDU",
      logo: null,
    },
    awayTeam: {
      id: "away-team",
      name: "Palmeiras",
      abbreviation: "PAL",
      logo: null,
    },
    score: { home: 3, away: 2 },
    shootoutScore,
    stage: null,
  };
}
