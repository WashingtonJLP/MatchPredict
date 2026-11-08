import assert from "node:assert/strict";
import test from "node:test";

import {
  canFixtureReceivePrediction,
  getFuturePredictionMessage,
} from "./prediction-availability.ts";
import type { MatchFixture } from "../../types/fixture";

const november = new Date("2026-11-08T15:00:00Z");

test("mês corrente continua disponível; meses futuros não entram na contagem", () => {
  const fixtures = [
    "2026-11-20T19:00:00Z",
    "2026-12-20T19:00:00Z",
    "2027-01-20T19:00:00Z",
  ].map(
    (kickoff) => ({ kickoff, status: "NS", canPredict: true }) as MatchFixture,
  );
  assert.equal(
    fixtures.filter((fixture) => canFixtureReceivePrediction(fixture, november))
      .length,
    1,
  );
  assert.equal(getFuturePredictionMessage(fixtures[0].kickoff, november), null);
  assert.match(
    getFuturePredictionMessage(fixtures[1].kickoff, november)!,
    /dezembro de 2026/,
  );
  assert.match(
    getFuturePredictionMessage(fixtures[2].kickoff, november)!,
    /janeiro de 2027/,
  );
});

test("competência usa meia-noite de São Paulo e vira naturalmente com o relógio", () => {
  const kickoff = "2026-12-01T03:00:00.000Z";
  assert.ok(
    getFuturePredictionMessage(kickoff, new Date("2026-12-01T02:59:59.999Z")),
  );
  assert.equal(getFuturePredictionMessage(kickoff, new Date(kickoff)), null);
  assert.equal(
    getFuturePredictionMessage("2026-12-01T02:59:59.999Z", november),
    null,
  );
  assert.ok(
    getFuturePredictionMessage(
      "2027-01-01T03:00:00Z",
      new Date("2027-01-01T02:59:59.999Z"),
    ),
  );
  assert.equal(
    getFuturePredictionMessage(
      "2027-01-01T03:00:00Z",
      new Date("2027-01-01T03:00:00Z"),
    ),
    null,
  );
});

test("competência mensal não afrouxa kickoff, status ou indisponibilidade existente", () => {
  const fixture = {
    kickoff: "2026-11-08T15:00:00Z",
    status: "NS",
    canPredict: true,
  } as MatchFixture;
  assert.equal(canFixtureReceivePrediction(fixture, november), false);
  for (const status of ["LIVE", "FT"] as const) {
    assert.equal(
      canFixtureReceivePrediction(
        { ...fixture, kickoff: "2026-11-20T19:00:00Z", status },
        november,
      ),
      false,
    );
  }
  assert.equal(
    canFixtureReceivePrediction(
      { ...fixture, kickoff: "2026-11-20T19:00:00Z", canPredict: false },
      november,
    ),
    false,
  );
});
