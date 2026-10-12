import assert from "node:assert/strict";
import test from "node:test";

import {
  createSingleFlight,
  isExactDeleteConfirmation,
} from "./single-flight.ts";

test("aceita somente a confirmacao EXCLUIR exata", () => {
  assert.equal(isExactDeleteConfirmation("EXCLUIR"), true);
  assert.equal(isExactDeleteConfirmation("excluir"), false);
  assert.equal(isExactDeleteConfirmation("Excluir"), false);
  assert.equal(isExactDeleteConfirmation(" EXCLUIR "), false);
});

test("bloqueia DELETE concorrente e libera nova tentativa apos sucesso", async () => {
  const gate = deferred<void>();
  const flight = createSingleFlight();
  let calls = 0;

  const first = flight.run(async () => {
    calls += 1;
    await gate.promise;
  });
  const duplicate = flight.run(async () => {
    calls += 1;
  });

  assert.equal(await duplicate, false);
  assert.equal(calls, 1);
  gate.resolve();
  assert.equal(await first, true);
  assert.equal(await flight.run(async () => undefined), true);
});

test("libera nova tentativa apos falha", async () => {
  const flight = createSingleFlight();

  await assert.rejects(
    flight.run(async () => {
      throw new Error("request failed");
    }),
    /request failed/,
  );

  assert.equal(await flight.run(async () => undefined), true);
});

test("confirmacao de desativacao concorrente executa a mutacao uma unica vez", async () => {
  const gate = deferred<void>();
  const disableFlight = createSingleFlight();
  let patchCalls = 0;
  const disableAccount = async () => {
    patchCalls += 1;
    await gate.promise;
  };

  const firstConfirmation = disableFlight.run(disableAccount);
  const doubleClick = disableFlight.run(disableAccount);

  assert.equal(await doubleClick, false);
  assert.equal(patchCalls, 1);
  gate.resolve();
  assert.equal(await firstConfirmation, true);
  assert.equal(patchCalls, 1);
});

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}
