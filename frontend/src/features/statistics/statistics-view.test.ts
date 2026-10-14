import assert from "node:assert/strict";
import test from "node:test";

import { buildStatisticsRoundFilterOptions } from "./statistics-view.ts";

test("mantém somente as rodadas avaliadas recebidas pelas estatísticas", () => {
  assert.deepEqual(
    buildStatisticsRoundFilterOptions([{ round: 2 }, { round: 7 }]),
    [
      { badge: "2", label: "Rodada 2", value: "2" },
      { badge: "7", label: "Rodada 7", value: "7" },
    ],
  );
});

test("retorna opções vazias quando não há rodadas avaliadas", () => {
  assert.deepEqual(buildStatisticsRoundFilterOptions([]), []);
});
