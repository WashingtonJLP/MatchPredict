import assert from "node:assert/strict";
import test from "node:test";

import type { FootballCompetition } from "../../types/competition.ts";
import {
  formatTournamentScore,
  formatStandingValue,
  getCompetitionDataState,
  getCompetitionTabs,
  getGroupSections,
  getKnockoutPhases,
  getTeamScore,
  resolveCompetitionSelection,
} from "./competition-view.ts";

function competition(
  id: string,
  capabilities: FootballCompetition["capabilities"],
): FootballCompetition {
  return {
    id,
    name: id,
    shortName: id,
    regionId: "test",
    format: "LEAGUE",
    logo: null,
    capabilities,
  };
}

test("cria somente as abas suportadas pela competição", () => {
  const league = competition("eng.1", {
    games: true,
    standings: true,
    groups: false,
    tournament: false,
  });
  const groupedCup = competition("conmebol.libertadores", {
    games: true,
    standings: true,
    groups: true,
    tournament: true,
  });

  assert.deepEqual(
    getCompetitionTabs(league).map((tab) => tab.id),
    ["games", "standings"],
  );
  assert.deepEqual(
    getCompetitionTabs(groupedCup).map((tab) => tab.id),
    ["games", "groups", "tournament"],
  );
});

test("seleciona o id solicitado ou usa a primeira competição", () => {
  const first = competition("eng.1", {
    games: true,
    standings: true,
    groups: false,
    tournament: false,
  });
  const second = competition("bra.1", first.capabilities);

  assert.equal(resolveCompetitionSelection("bra.1", [first, second])?.id, "bra.1");
  assert.equal(resolveCompetitionSelection("invalid", [first, second])?.id, "eng.1");
});

test("formata ausências sem convertê-las em zero", () => {
  assert.equal(formatStandingValue(null), "—");
  assert.equal(formatStandingValue(0), "0");
  assert.equal(getTeamScore(null, "1"), null);
  assert.equal(getTeamScore([{ teamId: "1", value: 0 }], "1"), 0);
  assert.equal(formatTournamentScore({ home: null, away: null }), null);
  assert.equal(formatTournamentScore({ home: 0, away: 0 }), "0 x 0");
});

test("diferencia dados vazios de recurso não aplicável", () => {
  assert.equal(getCompetitionDataState(false, 0), "NOT_APPLICABLE");
  assert.equal(getCompetitionDataState(true, 0), "EMPTY");
  assert.equal(getCompetitionDataState(true, 1), "READY");
});

test("preserva grupos densos com entradas e seleciona somente fases eliminatórias", () => {
  const sections = [
    { id: "a", name: "Grupo A", entries: [] },
    { id: "b", name: "Grupo B", entries: [{}] },
  ];
  const phases = [
    { id: "groups", kind: "TABLE" },
    { id: "round-of-16", kind: "KNOCKOUT" },
  ];

  assert.deepEqual(
    getGroupSections(sections as never).map((section) => section.id),
    ["b"],
  );
  assert.deepEqual(
    getKnockoutPhases(phases as never).map((phase) => phase.id),
    ["round-of-16"],
  );
});
