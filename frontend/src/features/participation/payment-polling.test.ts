import assert from "node:assert/strict";
import test from "node:test";

import {
  getPaymentStatusPollInterval,
  getReconciliationCooldownMs,
} from "./payment-polling.ts";

test("faz polling a cada 30 segundos somente para PENDING", () => {
  assert.equal(getPaymentStatusPollInterval("PENDING"), 30_000);

  for (const status of [
    "PAID",
    "EXPIRED",
    "CANCELLED",
    "FAILED",
    undefined,
  ] as const) {
    assert.equal(getPaymentStatusPollInterval(status), false);
  }
});

test("extrai cooldown seguro de resposta 429", () => {
  assert.equal(
    getReconciliationCooldownMs({
      response: { status: 429, data: { retryAfterSeconds: 73 } },
    }),
    73_000,
  );
  assert.equal(
    getReconciliationCooldownMs({
      response: { status: 503, data: { retryAfterSeconds: 73 } },
    }),
    null,
  );
  assert.equal(
    getReconciliationCooldownMs({
      response: { status: 429, data: { retryAfterSeconds: -1 } },
    }),
    null,
  );
});
