import assert from "node:assert/strict";
import test from "node:test";

import type { RoundStats } from "../../types/round.ts";
import {
  formatHighlightNames,
  getRoundContentState,
  getRoundStatusCopy,
  getRoundsCatalogState,
} from "./rounds-view.ts";

test("distingue carregamento, erro e catálogo vazio", () => {
  assert.equal(
    getRoundsCatalogState({
      competitionCount: 0,
      isError: false,
      isLoading: true,
    }),
    "LOADING",
  );
  assert.equal(
    getRoundsCatalogState({
      competitionCount: 0,
      isError: true,
      isLoading: false,
    }),
    "ERROR",
  );
  assert.equal(
    getRoundsCatalogState({
      competitionCount: 0,
      isError: false,
      isLoading: false,
    }),
    "EMPTY",
  );
});

test("identifica rodada futura sem expor ranking", () => {
  const stats = createStats({ status: "UPCOMING", ranking: [] });

  assert.equal(getRoundContentState(stats), "UPCOMING");
  assert.match(getRoundStatusCopy(stats).description, /privados/);
});

test("distingue rodada sem palpites de rodada parcial", () => {
  assert.equal(
    getRoundContentState(createStats({ status: "IN_PROGRESS", ranking: [] })),
    "NO_PREDICTIONS",
  );
  assert.equal(
    getRoundContentState(
      createStats({ status: "IN_PROGRESS", ranking: [participant] }),
    ),
    "IN_PROGRESS",
  );
});

test("apresenta estado encerrado com denominador real", () => {
  const stats = createStats({
    status: "COMPLETED",
    completedFixtures: 9,
    totalFixtures: 9,
    ranking: [participant],
  });

  assert.equal(getRoundContentState(stats), "COMPLETED");
  assert.match(getRoundStatusCopy(stats).description, /9\/9/);
});

test("resume empates de destaque sem criar nomes", () => {
  assert.equal(
    formatHighlightNames([
      { name: "Ana" },
      { name: "Bruno" },
      { name: "Carla" },
    ]),
    "Ana, Bruno +1",
  );
});

const participant = {
  userId: "user-1",
  name: "Ana",
  avatarUrl: null,
  position: 1,
  naturalPoints: 3,
  predictionsCount: 1,
  evaluatedPredictions: 1,
  exactScores: 1,
  correctWinners: 1,
  wrongPredictions: 0,
  accuracy: 100,
};

function createStats(overrides: Partial<RoundStats> = {}): RoundStats {
  return {
    status: "IN_PROGRESS",
    competition: { id: "competition-1", name: "Premier League", logo: "" },
    season: { id: "season-1", year: 2026, name: "2026/2027" },
    round: 7,
    totalFixtures: 10,
    publicFixtures: 5,
    completedFixtures: 4,
    cancelledFixtures: 0,
    dataIncomplete: false,
    highlights: {
      best: null,
      mostExactScores: [],
      mostCorrectWinners: [],
      worst: null,
    },
    myPerformance: {
      position: null,
      naturalPoints: 0,
      predictionsCount: 0,
      evaluatedPredictions: 0,
      exactScores: 0,
      correctWinners: 0,
      wrongPredictions: 0,
      pendingPredictions: 0,
      accuracy: null,
    },
    ranking: [],
    ...overrides,
  };
}
