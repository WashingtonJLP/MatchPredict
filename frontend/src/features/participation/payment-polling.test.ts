import assert from "node:assert/strict";
import test from "node:test";

import { getPaymentStatusPollInterval } from "./payment-polling.ts";

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
