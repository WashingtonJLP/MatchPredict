/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS entry point for the external QA runtime. */
/* Uses the existing external QA runtime. No Playwright dependency in this repo.
 * Start frontend on 127.0.0.1:3101; all API/image traffic below is intercepted.
 */
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const runtime =
  process.env.MATCHPREDICT_QA_RUNTIME ||
  path.join(process.env.LOCALAPPDATA, "MatchPredict-Browser-QA");
const { chromium } = require(path.join(runtime, "node_modules/playwright"));
const artifacts = path.join(runtime, "artifacts");
const baseURL = process.env.MATCHPREDICT_QA_URL || "http://127.0.0.1:3101";
// Existing public image is a visible, non-personal mock avatar fixture.
const png = fs.readFileSync(path.join(__dirname, "../public/MatchPredict.png"));
const userId = "11111111-1111-4111-8111-111111111111";
const photo = "https://avatars.example.test/photo.png";
const longName = "Washington Junio de Albuquerque e Silva";
const catalog = {
  competitions: [
    {
      id: "league",
      name: "Premier League",
      logo: "",
      seasons: [
        {
          id: "season",
          year: 2026,
          name: "2026/2027",
          isActive: true,
          defaultRound: 7,
          rounds: [
            {
              number: 7,
              fixtureCount: 10,
              startsAt: "2026-10-01",
              endsAt: "2026-10-10",
            },
          ],
        },
      ],
    },
  ],
  defaults: { competitionId: "league", seasonId: "season", round: 7 },
};
function participants(avatarUrl) {
  return [
    {
      userId,
      name: longName,
      avatarUrl,
      position: 1,
      naturalPoints: 23,
      predictionsCount: 10,
      evaluatedPredictions: 10,
      exactScores: 7,
      correctWinnersOnly: 2,
      wrongPredictions: 1,
      accuracy: 90,
    },
    {
      userId: "other",
      name: "Mariana Oliveira",
      avatarUrl: "https://avatars.example.test/broken.png",
      position: 2,
      naturalPoints: 15,
      predictionsCount: 10,
      evaluatedPredictions: 10,
      exactScores: 4,
      correctWinnersOnly: 3,
      wrongPredictions: 3,
      accuracy: 70,
    },
  ];
}

(async () => {
  fs.mkdirSync(artifacts, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    channel: "chromium",
  });
  let assertions = 0;
  try {
    for (const [label, width, height] of [
      ["desktop", 1440, 900],
      ["tablet", 768, 1024],
      ["mobile", 390, 844],
    ]) {
      const context = await browser.newContext({ viewport: { width, height } });
      await context.addCookies([
        {
          name: "matchpredict_token",
          value: "fake-avatar-qa-token",
          url: baseURL,
        },
      ]);
      await context.addInitScript(() =>
        localStorage.setItem("matchpredict_token", "fake-avatar-qa-token"),
      );
      let avatarUrl = null;
      let uploadFails = false;
      let uploads = 0;
      let deletes = 0;
      const user = () => ({
        id: userId,
        name: longName,
        email: "qa@example.test",
        role: "USER",
        avatarUrl,
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.route("**/*", async (route) => {
        const req = route.request();
        const url = new URL(req.url());
        if (url.hostname === "avatars.example.test") {
          return url.pathname.includes("broken")
            ? route.fulfill({ status: 404, body: "" })
            : route.fulfill({ contentType: "image/png", body: png });
        }
        if (!url.pathname.startsWith("/api/v1/")) {
          // This QA must never access external services or production.
          if (url.origin !== baseURL) return route.abort();
          return route.continue();
        }
        const json = (data) => route.fulfill({ json: data });
        const endpoint = url.pathname.slice("/api/v1".length);
        if (endpoint === "/users/me/avatar") {
          assert.equal(
            req.headers().authorization,
            "Bearer fake-avatar-qa-token",
          );
          await new Promise((resolve) => setTimeout(resolve, 350));
          if (req.method() === "PUT") {
            uploads++;
            assert.match(
              req.headers()["content-type"],
              /^multipart\/form-data; boundary=/,
            );
            if (uploadFails)
              return route.fulfill({
                status: 503,
                json: { message: "Storage de teste indisponível." },
              });
            avatarUrl = photo + "?version=" + uploads;
          } else {
            deletes++;
            avatarUrl = null;
          }
          return json({ avatarUrl });
        }
        if (endpoint === "/users/me") return json(user());
        if (endpoint === "/users/me/statistics")
          return json({
            totalPredictions: 10,
            totalPoints: 23,
            averagePoints: 2.3,
            accuracy: 90,
            correctWinners: 9,
            exactScores: 7,
            wrongPredictions: 1,
            bestRound: null,
            worstRound: null,
            currentPosition: 1,
          });
        if (endpoint === "/standings")
          return json(
            participants(avatarUrl).map((p) => ({
              ...p,
              totalPoints: p.naturalPoints,
              scorePoints: p.naturalPoints,
              correctWinners: p.exactScores + p.correctWinnersOnly,
            })),
          );
        if (endpoint === "/rounds/catalog") return json(catalog);
        if (endpoint.startsWith("/rounds/"))
          return json({
            status: "COMPLETED",
            competition: { id: "league", name: "Premier League", logo: "" },
            season: { id: "season", year: 2026, name: "2026/2027" },
            round: 7,
            totalFixtures: 10,
            publicFixtures: 10,
            completedFixtures: 10,
            cancelledFixtures: 0,
            dataIncomplete: false,
            highlights: { best: null, lowestScore: null },
            myPerformance: {
              ...participants(avatarUrl)[0],
              pendingPredictions: 0,
            },
            ranking: participants(avatarUrl),
          });
        if (endpoint.startsWith("/football/fixtures"))
          return json({
            data: [],
            meta: { page: 1, total: 0, totalPages: 0, limit: 6 },
          });
        throw new Error("Unhandled fake API: " + endpoint);
      });
      const check = (condition, message) => {
        assert.ok(condition, `${label}: ${message}`);
        assertions++;
      };
      const waitFor = async (predicate) => {
        for (let i = 0; i < 100; i++) {
          if (await predicate()) return;
          await page.waitForTimeout(100);
        }
        throw new Error("Timed out waiting for UI");
      };
      const noOverflow = async () =>
        check(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          "no horizontal overflow",
        );
      const screenshot = async (name) => {
        await page.screenshot({
          path: path.join(artifacts, `avatar-${name}-${label}.png`),
          fullPage: true,
        });
      };
      await page.goto(baseURL + "/profile");
      await page
        .getByRole("button", { name: "Alterar foto", exact: true })
        .waitFor();
      const editor = page
        .locator("[aria-busy]")
        .filter({ has: page.getByLabel("Selecionar foto de perfil") });
      const fileInput = page.getByLabel("Selecionar foto de perfil");
      check(
        (await editor
          .getByRole("img", { name: `Foto de ${longName}` })
          .textContent()) === "WJ",
        "initials without photo",
      );
      check(
        (await page
          .getByRole("button", { name: "Remover foto", exact: true })
          .count()) === 0,
        "no removal without photo",
      );
      check(
        (
          await page
            .getByRole("button", { name: "Alterar foto", exact: true })
            .boundingBox()
        ).height >= 44,
        "touch target",
      );
      await noOverflow();
      await screenshot("profile-empty");
      const nameInput = page.getByRole("textbox", {
        name: "Nome",
        exact: true,
      });
      await nameInput.fill(longName + " teste");
      const select = () =>
        fileInput.setInputFiles({
          name: "avatar.png",
          mimeType: "image/png",
          buffer: png,
        });
      await select();
      await page
        .getByRole("button", { name: "Enviando...", exact: true })
        .waitFor();
      check(
        await page
          .getByRole("button", { name: "Enviando...", exact: true })
          .isDisabled(),
        "upload disabled while pending",
      );
      check(
        await editor
          .locator("img")
          .getAttribute("src")
          .then((src) => src.startsWith("blob:")),
        "local preview",
      );
      await waitFor(async () =>
        (await editor.textContent()).includes("Foto atualizada com sucesso."),
      );
      check(
        (await editor.locator("img").getAttribute("src")) === avatarUrl,
        "successful upload updates profile",
      );
      check(
        (await page.locator("header img").getAttribute("src")) === avatarUrl,
        "successful upload updates header",
      );
      check(
        (await fileInput.inputValue()) === "",
        "input resets for same file",
      );
      check(
        (await nameInput.inputValue()) === longName + " teste",
        "avatar update preserves unsaved profile name",
      );
      await noOverflow();
      await screenshot("profile");
      const validUrl = avatarUrl;
      uploadFails = true;
      await select();
      await editor.getByRole("alert").waitFor();
      check(
        (await editor.getByRole("alert").textContent()) ===
          "Storage de teste indisponível.",
        "controlled error",
      );
      check(
        (await editor.locator("img").getAttribute("src")) === validUrl,
        "upload failure preserves photo",
      );
      uploadFails = false;
      await select();
      await waitFor(async () =>
        (await editor.textContent()).includes("Foto atualizada com sucesso."),
      );
      check(uploads === 3, "same file can be reselected after error");
      await fileInput.setInputFiles({
        name: "bad.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("test"),
      });
      await editor.getByRole("alert").waitFor();
      check(uploads === 3, "invalid file rejected locally");
      await page
        .getByRole("button", { name: "Remover foto", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Removendo...", exact: true })
        .waitFor();
      check(
        await page
          .getByRole("button", { name: "Removendo...", exact: true })
          .isDisabled(),
        "removal loading",
      );
      await waitFor(async () =>
        (await editor.textContent()).includes("Foto removida com sucesso."),
      );
      check(
        deletes === 1 && (await editor.locator("img").count()) === 0,
        "removal returns initials",
      );
      // Existing avatar and broken-image fallback after reload.
      avatarUrl = "https://avatars.example.test/broken.png";
      await page.reload();
      await page
        .getByRole("button", { name: "Remover foto", exact: true })
        .waitFor();
      await waitFor(async () => (await editor.locator("img").count()) === 0);
      check(
        (await editor.getByRole("img").textContent()) === "WJ",
        "broken image fallback",
      );
      await screenshot("profile-fallback");
      avatarUrl = photo;
      await page.goto(baseURL + "/rounds");
      await page
        .getByRole("heading", { name: "Classificação da rodada", exact: true })
        .waitFor();
      const ranking = page.locator(
        'section[aria-labelledby="round-ranking-title"]',
      );
      await ranking.scrollIntoViewIfNeeded();
      await noOverflow();
      check(
        (await ranking
          .getByText(longName, { exact: true })
          .filter({ visible: true })
          .count()) === 1,
        "long name visible in rounds",
      );
      if (width < 768) {
        const row = ranking.locator("ol > li").first();
        check((await row.boundingBox()).height < 125, "compact mobile ranking");
        check(
          (await row.locator("[role=img]").boundingBox()).width === 24,
          "small round avatar",
        );
      }
      await screenshot("rounds");
      await page.goto(baseURL + "/dashboard#ranking");
      await page
        .getByText("Classificação geral", { exact: true })
        .first()
        .waitFor();
      const generalRanking = page.locator("#ranking");
      await generalRanking.getByText(longName, { exact: true }).filter({ visible: true }).first().waitFor();
      await waitFor(async () => generalRanking.locator('img').evaluateAll(images => images.length > 0 && images.every(img => img.complete && img.naturalWidth > 0)));
      check(await generalRanking.locator('img').count() > 0, 'general ranking shows loaded avatars');
      await noOverflow();
      await screenshot("ranking");
      check(
        errors.length === 0,
        "no browser runtime errors: " + errors.join("; "),
      );
      console.log(`${label} ${width}x${height}: passed`);
      await context.close();
    }
    console.log(
      `Avatar browser QA: ${assertions} assertions passed. Screenshots: ${artifacts}`,
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
