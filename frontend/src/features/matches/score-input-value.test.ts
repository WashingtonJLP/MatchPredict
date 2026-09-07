import assert from "node:assert/strict";
import test from "node:test";

import {
  decrementScore,
  getScoreInputState,
  incrementScore,
} from "./score-input-value.ts";

test("substitui o zero inicial quando outro algarismo e digitado", () => {
  const initialValue = "0";

  assert.deepEqual(getScoreInputState(`${initialValue}2`), {
    inputValue: "2",
    value: 2,
  });
  assert.deepEqual(getScoreInputState(`${initialValue}5`), {
    inputValue: "5",
    value: 5,
  });
});

test("remove zeros a esquerda de forma consistente", () => {
  assert.deepEqual(getScoreInputState("00"), {
    inputValue: "0",
    value: 0,
  });
  assert.deepEqual(getScoreInputState("01"), {
    inputValue: "1",
    value: 1,
  });
  assert.deepEqual(getScoreInputState("02"), {
    inputValue: "2",
    value: 2,
  });
  assert.deepEqual(getScoreInputState("007"), {
    inputValue: "7",
    value: 7,
  });
});

test("preserva zero sozinho e placares sem zero a esquerda", () => {
  assert.deepEqual(getScoreInputState("0"), {
    inputValue: "0",
    value: 0,
  });
  assert.deepEqual(getScoreInputState("10"), {
    inputValue: "10",
    value: 10,
  });
  assert.deepEqual(getScoreInputState("20"), {
    inputValue: "20",
    value: 20,
  });
});

test("permite apagar o conteudo antes de digitar um novo placar", () => {
  assert.deepEqual(getScoreInputState(""), {
    inputValue: "",
    value: null,
  });
  assert.deepEqual(getScoreInputState("4"), {
    inputValue: "4",
    value: 4,
  });
});

test("incrementa a partir de vazio usando o limite minimo", () => {
  assert.equal(incrementScore(null), 0);
  assert.equal(incrementScore(0), 1);
  assert.equal(incrementScore(1), 2);
});

test("decremento nunca produz placar negativo", () => {
  assert.equal(decrementScore(null), null);
  assert.equal(decrementScore(1), 0);
  assert.equal(decrementScore(0), 0);
});

test("mantem a digitacao manual e os limites existentes", () => {
  assert.deepEqual(getScoreInputState("2"), {
    inputValue: "2",
    value: 2,
  });
  assert.deepEqual(getScoreInputState("21"), {
    inputValue: "20",
    value: 20,
  });
});
