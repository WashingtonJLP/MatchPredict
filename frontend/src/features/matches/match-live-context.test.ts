import assert from "node:assert/strict";
import test from "node:test";

import { getMatchLiveContext } from "./match-live-context.ts";
import type { DailyGame, DailyGameStatus } from "@/types/daily-game";

test("mantem o comportamento atual sem liveContext relevante", () => {
  assert.equal(getMatchLiveContext(undefined), undefined);
  assert.equal(getMatchLiveContext(createGame("SCHEDULED", null)), undefined);
  assert.equal(getMatchLiveContext(createGame("FINAL", null)), undefined);
});

test("exibe minuto normalizado para LIVE, inclusive com placar 0 x 0", () => {
  assert.deepEqual(getMatchLiveContext(createGame("LIVE", 57)), {
    isLive: true,
    label: "Ao vivo · 57'",
  });
});

test("mantem AO VIVO sem inventar minuto quando ele nao esta disponivel", () => {
  assert.deepEqual(getMatchLiveContext(createGame("LIVE", null)), {
    isLive: true,
    label: "Ao vivo",
  });
});

test("exibe INTERVALO para HALFTIME", () => {
  assert.deepEqual(getMatchLiveContext(createGame("HALFTIME", null)), {
    isLive: false,
    label: "Intervalo",
  });
});

function createGame(status: DailyGameStatus, minute: number | null): DailyGame {
  return {
    id: "espn:eng.1:event-1",
    sourceEventId: "event-1",
    kickoff: "2026-09-05T14:00:00.000Z",
    localDate: "2026-09-05",
    localTime: "11:00",
    status,
    statusLabel: status,
    minute,
    period: status === "SCHEDULED" ? 0 : 1,
    homeTeam: {
      id: "home",
      name: "Manchester City",
      abbreviation: "MCI",
      logo: null,
    },
    awayTeam: {
      id: "away",
      name: "Coventry City",
      abbreviation: "COV",
      logo: null,
    },
    score: {
      home: status === "SCHEDULED" ? null : 0,
      away: status === "SCHEDULED" ? null : 0,
    },
    stage: null,
  };
}
