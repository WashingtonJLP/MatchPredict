import assert from "node:assert/strict";
import test from "node:test";

import {
  canSubmitPredictionForm,
  getInitialPredictionFormState,
  getPredictionFormValues,
} from "./prediction-form-state.ts";

test("novo palpite comeca com os dois placares vazios", () => {
  assert.deepEqual(getInitialPredictionFormState(null), {
    homeGoals: null,
    awayGoals: null,
  });
});

test("salvar permanece desabilitado enquanto algum placar esta vazio", () => {
  assert.equal(canSubmitPredictionForm(null, null), false);
  assert.equal(canSubmitPredictionForm(1, null), false);
  assert.equal(canSubmitPredictionForm(null, 2), false);
});

test("zero e aceito como placar preenchido e valido", () => {
  assert.equal(canSubmitPredictionForm(0, 0), true);
  assert.equal(canSubmitPredictionForm(0, 1), true);
  assert.equal(canSubmitPredictionForm(1, 0), true);
  assert.equal(canSubmitPredictionForm(2, 1), true);
});

test("edicao preserva os valores do palpite existente", () => {
  assert.deepEqual(
    getInitialPredictionFormState({ homeGoals: 2, awayGoals: 1 }),
    { homeGoals: 2, awayGoals: 1 },
  );
  assert.deepEqual(
    getInitialPredictionFormState({ homeGoals: 0, awayGoals: 0 }),
    { homeGoals: 0, awayGoals: 0 },
  );
});

test("submit nunca produz payload com placar nulo ou invalido", () => {
  assert.equal(getPredictionFormValues(null, null), null);
  assert.equal(getPredictionFormValues(1, null), null);
  assert.equal(getPredictionFormValues(null, 2), null);
  assert.equal(getPredictionFormValues(1.5, 2), null);
  assert.equal(getPredictionFormValues(21, 2), null);

  assert.deepEqual(getPredictionFormValues(0, 0), {
    homeGoals: 0,
    awayGoals: 0,
  });
});
