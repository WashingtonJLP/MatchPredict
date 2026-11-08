/* eslint-disable @typescript-eslint/no-require-imports -- Uses the existing external Playwright QA runtime. */
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const runtime =
  process.env.MATCHPREDICT_QA_RUNTIME ||
  path.join(process.env.LOCALAPPDATA, "MatchPredict-Browser-QA");
const { chromium } = require(path.join(runtime, "node_modules/playwright"));
const baseURL = process.env.MATCHPREDICT_QA_URL || "http://127.0.0.1:3102";
const artifacts = path.join(runtime, "artifacts", "monthly-prediction");
const user = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Participante",
  email: "qa@example.test",
  role: "USER",
  avatarUrl: null,
};
const png = fs.readFileSync(path.join(__dirname, "../public/MatchPredict.png"));

function fixture(id, home, kickoff, hasPrediction = false) {
  return {
    id,
    sourceEventId: id,
    round: 12,
    kickoff,
    status: "NS",
    homeGoals: null,
    awayGoals: null,
    processedAt: null,
    winnerType: null,
    homeTeam: { id: `${id}-home`, name: home, logo: "/MatchPredict.png" },
    awayTeam: {
      id: `${id}-away`,
      name: `${home} visitante`,
      logo: "/MatchPredict.png",
    },
    canPredict: !hasPrediction,
    userPrediction: hasPrediction
      ? { id: `${id}-prediction`, homeGoals: 1, awayGoals: 0, totalPoints: 0 }
      : null,
  };
}

(async () => {
  fs.mkdirSync(artifacts, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  let checks = 0;
  const check = (condition, label) => {
    assert.ok(condition, label);
    checks++;
  };
  try {
    for (const [label, width, height, timezoneId] of [
      ["desktop", 1440, 900, "Pacific/Honolulu"],
      ["mobile", 390, 844, "Asia/Tokyo"],
    ]) {
      const context = await browser.newContext({
        viewport: { width, height },
        timezoneId,
        reducedMotion: "reduce",
      });
      await context.addCookies([
        { name: "matchpredict_token", value: "monthly-qa", url: baseURL },
      ]);
      await context.addInitScript(() =>
        localStorage.setItem("matchpredict_token", "monthly-qa"),
      );
      const page = await context.newPage();
      await page.clock.setFixedTime(new Date("2026-11-08T15:00:00Z"));
      const fixtures = [
        fixture("current", "Atual", "2026-11-20T19:00:00Z"),
        fixture("future", "Futuro", "2026-12-20T19:00:00Z"),
        fixture("existing", "Existente", "2026-12-21T19:00:00Z", true),
      ];
      const historical = {
        ...fixture("history", "Histórico", "2026-10-20T19:00:00Z", true),
        status: "FT",
        homeGoals: 1,
        awayGoals: 0,
        processedAt: "2026-10-20T21:00:00Z",
      };
      const predictions = [fixtures[2], historical].map((entry) => ({
        ...entry.userPrediction,
        totalPoints: entry.status === "FT" ? 3 : 0,
        fixture: entry,
      }));
      const errors = [];
      const unexpected = [];
      const writes = [];
      let serverNow = new Date("2026-11-08T15:00:00Z");
      let errorCode = null;
      let paymentRequests = 0;
      page.on("pageerror", (error) => errors.push(error.message));
      await page.route("**/*", async (route) => {
        const req = route.request();
        const url = new URL(req.url());
        if (!url.pathname.startsWith("/api/v1/")) {
          if (url.origin !== baseURL) return route.abort();
          if (url.pathname === "/MatchPredict.png")
            return route.fulfill({ contentType: "image/png", body: png });
          return route.continue();
        }
        const pathname = url.pathname.slice("/api/v1".length);
        let body;
        if (pathname === "/users/me") body = user;
        else if (pathname === "/users/me/statistics") body = {};
        else if (pathname === "/standings") body = [];
        else if (pathname === "/football/fixtures/current-page")
          body = { page: 1, round: 12 };
        else if (pathname === "/football/fixtures")
          body = {
            data: fixtures,
            meta: { page: 1, limit: 12, total: 3, totalPages: 1 },
          };
        else if (pathname === "/predictions/my") body = predictions;
        else if (pathname === "/football/daily-games")
          body = {
            competitions: [],
            timezone: "America/Sao_Paulo",
            meta: { cacheTtlSeconds: 300 },
          };
        else if (
          (pathname === "/predictions" && req.method() === "POST") ||
          (pathname.startsWith("/predictions/") && req.method() === "PATCH")
        ) {
          writes.push(req.postDataJSON());
          if (errorCode)
            return route.fulfill({
              status: errorCode === "PARTICIPATION_REQUIRED" ? 402 : 403,
              json: {
                code: errorCode,
                message:
                  "Palpites para este jogo estarão disponíveis em dezembro de 2026.",
              },
            });
          const selected =
            req.method() === "PATCH"
              ? fixtures[2]
              : fixtures.find(
                  (entry) => entry.id === req.postDataJSON().fixtureId,
                );
          if (new Date(selected.kickoff).getTime() <= serverNow.getTime()) {
            return route.fulfill({
              status: 409,
              json: {
                message:
                  "Não é possível registrar, alterar ou excluir palpites após o início da partida.",
              },
            });
          }
          if (
            new Date(selected.kickoff).getTime() >=
              new Date("2026-12-01T03:00:00Z").getTime() &&
            serverNow.getTime() < new Date("2026-12-01T03:00:00Z").getTime()
          ) {
            return route.fulfill({
              status: 403,
              json: {
                code: "FUTURE_PARTICIPATION_PERIOD",
                message:
                  "Palpites para este jogo estarão disponíveis em dezembro de 2026.",
              },
            });
          }
          body = { id: "created", ...req.postDataJSON() };
        } else if (
          pathname.startsWith("/participations/") ||
          pathname.startsWith("/payments")
        ) {
          paymentRequests++;
          body = pathname === "/payments/me" ? [] : null;
        } else {
          unexpected.push(`${req.method()} ${pathname}`);
          return route.fulfill({
            status: 500,
            json: { message: "Unexpected QA request" },
          });
        }
        return route.fulfill({ json: body });
      });

      async function verifyFutureCards() {
        for (const name of ["Futuro", "Existente"]) {
          const card = page.locator("article").filter({ hasText: name });
          await card
            .getByText(
              /Palpites para este jogo estarão disponíveis em dezembro/,
            )
            .waitFor({ timeout: 10000 })
            .catch(async (error) => {
              console.error(
                label,
                await page.locator("article").allTextContents(),
                errors,
              );
              throw error;
            });
          check(
            await card
              .getByRole("button", { name: "Em breve", exact: true })
              .isDisabled(),
            `${label}: future create/edit disabled`,
          );
          check(
            (await card
              .getByRole("button", {
                name: /Palpitar|Editar palpite|Pagar|Participar/i,
              })
              .count()) === 0,
            `${label}: no future action or payment CTA`,
          );
          check(
            (await card
              .getByText("Aberta para palpite", { exact: true })
              .count()) === 0,
            `${label}: no future availability claim`,
          );
        }
      }
      async function fillAndSubmit() {
        await page
          .getByRole("spinbutton", { name: "Placar de Atual", exact: true })
          .fill("2");
        await page
          .getByRole("spinbutton", {
            name: "Placar de Atual visitante",
            exact: true,
          })
          .fill("1");
        await page
          .getByRole("button", { name: "Salvar palpite", exact: true })
          .click();
      }
      await page.goto(`${baseURL}/matches`);
      await verifyFutureCards();
      await page
        .getByText("3 partidas encontradas · 1 abertas para palpite", {
          exact: true,
        })
        .waitFor();
      check(
        (await page.getByText("1 abertas", { exact: true }).count()) === 1,
        `${label}: future excluded from both counts`,
      );
      await page.screenshot({
        path: path.join(artifacts, `${label}-matches.png`),
        fullPage: true,
      });
      await page.getByRole("button", { name: "Palpitar", exact: true }).click();
      await fillAndSubmit();
      await page.getByRole("dialog").waitFor({ state: "hidden" });
      check(
        writes.length === 1 && writes[0].fixtureId === "current",
        `${label}: normal current-month submission`,
      );

      errorCode = "FUTURE_PARTICIPATION_PERIOD";
      await page.getByRole("button", { name: "Palpitar", exact: true }).click();
      await fillAndSubmit();
      const dialog = page.getByRole("dialog");
      await dialog.getByRole("status").waitFor();
      check(
        (await dialog.getByRole("spinbutton").count()) === 0,
        `${label}: server future error removes functional form`,
      );
      check(
        (await dialog
          .getByRole("button", { name: /Pagar|Participar/i })
          .count()) === 0,
        `${label}: no payment CTA on future error`,
      );
      // Wait beyond the existing participation redirect delay to prove it was not scheduled.
      await page.waitForTimeout(1400);
      check(
        new URL(page.url()).pathname === "/matches" && paymentRequests === 0,
        `${label}: future error does not redirect or request payment`,
      );
      await dialog.getByRole("button", { name: "Fechar", exact: true }).click();

      await page.goto(`${baseURL}/dashboard`);
      await verifyFutureCards();
      check(
        (await page
          .getByRole("button", { name: "Palpitar", exact: true })
          .count()) === 1,
        `${label}: dashboard current month still available`,
      );
      await page.screenshot({
        path: path.join(artifacts, `${label}-dashboard.png`),
        fullPage: true,
      });

      await page.goto(`${baseURL}/predictions`);
      await page
        .getByText(
          "Palpites para este jogo estarão disponíveis em dezembro de 2026.",
          { exact: true },
        )
        .waitFor();
      check(
        (await page
          .getByRole("button", { name: "Editar palpite", exact: true })
          .count()) === 0,
        `${label}: existing future prediction not editable`,
      );
      check(
        (await page.getByText("Histórico", { exact: true }).count()) > 0,
        `${label}: historical prediction remains readable`,
      );
      check(
        (await page.getByText("3 pts", { exact: true }).count()) === 1,
        `${label}: historical points preserved`,
      );
      await page.screenshot({
        path: path.join(artifacts, `${label}-predictions.png`),
        fullPage: true,
      });

      // The same future fixtures unlock on a normal reload once their month begins.
      await page.clock.setFixedTime(new Date("2026-12-01T03:00:00Z"));
      await page.reload();
      await page
        .getByRole("button", { name: "Editar palpite", exact: true })
        .waitFor();
      check(
        (await page
          .getByRole("button", { name: "Em breve", exact: true })
          .count()) === 0,
        `${label}: month rollover unlocks without polling`,
      );
      await page
        .getByRole("button", { name: "Editar palpite", exact: true })
        .click();
      check(
        await page
          .getByRole("button", { name: "Salvar alterações", exact: true })
          .isEnabled(),
        `${label}: current-month editing remains functional`,
      );
      const writesBeforeClockChange = writes.length;
      await page.clock.setFixedTime(new Date("2026-11-08T15:00:00Z"));
      await page
        .getByRole("button", { name: "Salvar alterações", exact: true })
        .click();
      await page.getByRole("dialog").getByRole("status").waitFor();
      check(
        writes.length === writesBeforeClockChange,
        `${label}: open modal cannot submit a future month after clock changes`,
      );

      // Browser clock ahead: stale UI allows editing; server remains authoritative.
      errorCode = null;
      await page.clock.setFixedTime(new Date("2026-12-01T03:00:00Z"));
      await page.reload();
      await page
        .getByRole("button", { name: "Editar palpite", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Salvar alterações", exact: true })
        .click();
      await page.getByRole("dialog").getByRole("status").waitFor();
      await page.waitForTimeout(1400);
      check(
        new URL(page.url()).pathname === "/predictions" &&
          paymentRequests === 0,
        `${label}: clock ahead cannot bypass server or trigger payment`,
      );
      check(
        (await page.getByRole("dialog").getByRole("spinbutton").count()) === 0,
        `${label}: future PATCH response blocks stale form`,
      );

      // A November form left open until December still loses to the kickoff rule.
      await page.clock.setFixedTime(new Date("2026-11-30T23:59:59-03:00"));
      fixtures[0].kickoff = "2026-12-01T02:59:59.999Z";
      await page.goto(`${baseURL}/matches`);
      await page.getByRole("button", { name: "Palpitar", exact: true }).click();
      await page
        .getByRole("spinbutton", { name: "Placar de Atual", exact: true })
        .fill("2");
      await page
        .getByRole("spinbutton", {
          name: "Placar de Atual visitante",
          exact: true,
        })
        .fill("1");
      serverNow = new Date("2026-12-01T03:00:00Z");
      await page.clock.setFixedTime(serverNow);
      await page
        .getByRole("button", { name: "Salvar palpite", exact: true })
        .click();
      await page
        .getByText(
          "Não é possível registrar, alterar ou excluir palpites após o início da partida.",
          { exact: true },
        )
        .waitFor();
      check(
        await page.getByRole("dialog").isVisible(),
        `${label}: open form across month rollover is rejected at kickoff`,
      );

      errorCode = "PARTICIPATION_REQUIRED";
      serverNow = new Date("2026-11-08T15:00:00Z");
      fixtures[0].kickoff = "2026-11-20T19:00:00Z";
      await page.clock.setFixedTime(serverNow);
      await page.goto(`${baseURL}/matches`);
      await page.getByRole("button", { name: "Palpitar", exact: true }).click();
      await fillAndSubmit();
      await page.waitForURL("**/participation");
      check(
        new URL(page.url()).pathname === "/participation",
        `${label}: missing current-month participation keeps existing redirect`,
      );
      check(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1,
        ),
        `${label}: no page overflow`,
      );
      check(
        errors.length === 0,
        `${label}: no runtime errors: ${errors.join("; ")}`,
      );
      check(
        unexpected.length === 0,
        `${label}: no unexpected API requests: ${unexpected.join("; ")}`,
      );
      await context.close();
      console.log(`${label}: passed`);
    }
    console.log(
      `Monthly prediction QA: ${checks} checks passed; screenshots: ${artifacts}`,
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
