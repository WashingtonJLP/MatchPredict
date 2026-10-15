import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { RoundStats } from "../../types/round.ts";
import {
  formatGameCount,
  formatRoundPoints,
  getBestHighlightCaption,
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

test("formata unidades de pontos e jogos sem ambiguidade", () => {
  assert.equal(formatRoundPoints(1), "1 pt");
  assert.equal(formatRoundPoints(2), "2 pts");
  assert.equal(formatGameCount(1), "1 jogo");
  assert.equal(formatGameCount(5), "5 jogos");
});

test("não mostra texto de desempate quando o líder vence por pontos", () => {
  assert.equal(
    getBestHighlightCaption({
      ...participant,
      value: participant.naturalPoints,
      tieBreakCriterion: null,
    }),
    null,
  );
});

test("informa o critério real quando o desempate decide o primeiro lugar", () => {
  assert.equal(
    getBestHighlightCaption({
      ...participant,
      value: participant.naturalPoints,
      tieBreakCriterion: "EXACT_SCORES",
    }),
    "Desempate por mais placares exatos",
  );
  assert.equal(
    getBestHighlightCaption({
      ...participant,
      value: participant.naturalPoints,
      tieBreakCriterion: "CORRECT_WINNERS",
    }),
    "Desempate por mais vencedores corretos",
  );
});

test("preserva espaço para nomes e mantém os pontos visíveis nos cards", () => {
  const componentSource = readFileSync(
    new URL("./components/rounds-page-content.tsx", import.meta.url),
    "utf8",
  );
  const lowestScoreHighlight = extractFunctionSource(
    componentSource,
    "function LowestScoreHighlight",
    "function MyRoundPerformance",
  );
  const mobileRanking = extractFunctionSource(
    componentSource,
    "function RankingMobileItem",
    "function PositionBadge",
  );

  assert.doesNotMatch(lowestScoreHighlight, /truncate/);
  assert.match(
    lowestScoreHighlight,
    /grid-cols-\[auto_minmax\(0,1fr\)_max-content\]/,
  );
  assert.match(lowestScoreHighlight, /whitespace-nowrap/);
  assert.doesNotMatch(mobileRanking, /truncate/);
  assert.match(mobileRanking, /grid-cols-\[auto_minmax\(0,1fr\)_max-content\]/);
  assert.match(mobileRanking, /whitespace-nowrap/);
});

function extractFunctionSource(
  source: string,
  startMarker: string,
  endMarker: string,
) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);

  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  return source.slice(start, end);
}

const participant = {
  userId: "user-1",
  name: "Ana",
  avatarUrl: null,
  position: 1,
  naturalPoints: 3,
  predictionsCount: 1,
  evaluatedPredictions: 1,
  exactScores: 1,
  correctWinnersOnly: 0,
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
      lowestScore: null,
    },
    myPerformance: {
      position: null,
      naturalPoints: 0,
      predictionsCount: 0,
      evaluatedPredictions: 0,
      exactScores: 0,
      correctWinnersOnly: 0,
      wrongPredictions: 0,
      pendingPredictions: 0,
      accuracy: null,
    },
    ranking: [],
    ...overrides,
  };
}
