import assert from "node:assert/strict";
import test from "node:test";

import { getPredictionPointsState } from "./prediction-points-state.ts";

test("não exibe pontos para partida futura", () => {
  assert.deepEqual(
    getPredictionPointsState({
      hasPrediction: true,
      processedAt: null,
      status: "NS",
      totalPoints: 0,
    }),
    { kind: "hidden" },
  );
});

test("não exibe pontos para partida em andamento", () => {
  assert.deepEqual(
    getPredictionPointsState({
      hasPrediction: true,
      processedAt: null,
      status: "LIVE",
      totalPoints: 0,
    }),
    { kind: "hidden" },
  );
});

test("mantém pontos pendentes quando a partida terminou mas não foi processada", () => {
  assert.deepEqual(
    getPredictionPointsState({
      hasPrediction: true,
      processedAt: null,
      status: "FT",
      totalPoints: 0,
    }),
    { kind: "pending" },
  );
});

test("preserva zero como pontuação real depois do processamento", () => {
  assert.deepEqual(
    getPredictionPointsState({
      hasPrediction: true,
      processedAt: "2026-10-01T12:00:00.000Z",
      status: "FT",
      totalPoints: 0,
    }),
    { kind: "available", points: 0 },
  );
});

test("usa os pontos persistidos sem recalcular", () => {
  assert.deepEqual(
    getPredictionPointsState({
      hasPrediction: true,
      processedAt: "2026-10-01T12:00:00.000Z",
      status: "FT",
      totalPoints: 5,
    }),
    { kind: "available", points: 5 },
  );
});
