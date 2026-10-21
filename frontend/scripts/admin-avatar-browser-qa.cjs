/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS external Playwright runtime. */
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const runtime =
  process.env.MATCHPREDICT_QA_RUNTIME ||
  path.join(process.env.LOCALAPPDATA, "MatchPredict-Browser-QA");
const { chromium } = require(path.join(runtime, "node_modules/playwright"));
const baseURL = process.env.MATCHPREDICT_QA_URL || "http://127.0.0.1:3101";
const artifacts = path.join(runtime, "artifacts");
const png = fs.readFileSync(path.join(__dirname, "../public/MatchPredict.png"));
const userId = "22222222-2222-4222-8222-222222222222";
const adminId = "11111111-1111-4111-8111-111111111111";
const name = "Washington Junio de Albuquerque e Silva";
const photo = "https://avatars.example.test/moderation.png";

(async () => {
  fs.mkdirSync(artifacts, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    channel: "chromium",
  });
  let checks = 0;
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
          value: "fake-admin-moderation-qa",
          url: baseURL,
        },
      ]);
      await context.addInitScript(() =>
        localStorage.setItem("matchpredict_token", "fake-admin-moderation-qa"),
      );
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      let avatarUrl = photo;
      let failRemoval = false;
      let requests = 0;
      let audit = [];
      const detail = () => ({
        id: userId,
        name,
        email: "user@example.test",
        role: "USER",
        avatarUrl,
        disabledAt: null,
        createdAt: "2026-10-01T12:00:00Z",
        updatedAt: "2026-10-21T12:00:00Z",
        _count: {
          predictions: 3,
          standings: 1,
          participations: 0,
          payments: 0,
          adminAuditLogs: 0,
        },
        participations: [],
        payments: [],
        standings: [],
      });
      await page.route("**/*", async (route) => {
        const req = route.request();
        const url = new URL(req.url());
        if (url.hostname === "avatars.example.test")
          return route.fulfill({ contentType: "image/png", body: png });
        if (!url.pathname.startsWith("/api/v1/")) {
          if (url.origin !== baseURL) return route.abort();
          return route.continue();
        }
        const endpoint = url.pathname.slice("/api/v1".length);
        if (endpoint === "/users/me")
          return route.fulfill({
            json: {
              id: adminId,
              name: "Administrador de teste",
              email: "admin@example.test",
              role: "ADMIN",
              avatarUrl: null,
            },
          });
        if (endpoint === `/admin/users/${userId}` && req.method() === "GET")
          return route.fulfill({ json: detail() });
        if (endpoint === `/admin/users/${userId}/avatar`) {
          assert.equal(req.method(), "DELETE");
          assert.equal(
            req.headers().authorization,
            "Bearer fake-admin-moderation-qa",
          );
          assert.ok(!req.postData());
          requests++;
          await new Promise((resolve) => setTimeout(resolve, 450));
          if (failRemoval)
            return route.fulfill({
              status: 503,
              json: { message: "Falha de teste ao registrar auditoria." },
            });
          avatarUrl = null;
          audit = [
            {
              id: "fake-audit",
              action: "USER_AVATAR_REMOVED",
              targetType: "USER",
              targetId: userId,
              metadata: { hadAvatar: true },
              createdAt: "2026-10-21T12:00:00Z",
              adminUser: {
                id: adminId,
                name: "Administrador de teste",
                email: "admin@example.test",
              },
            },
          ];
          return route.fulfill({ json: { avatarUrl: null } });
        }
        if (endpoint === "/admin/audit-logs")
          return route.fulfill({
            json: {
              data: audit,
              meta: { page: 1, limit: 20, total: audit.length, totalPages: 1 },
            },
          });
        throw new Error(
          "Unexpected API in isolated admin QA: " +
            req.method() +
            " " +
            endpoint,
        );
      });
      const check = (condition, message) => {
        assert.ok(condition, `${label}: ${message}`);
        checks++;
      };
      const noOverflow = async () =>
        check(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          "no horizontal overflow",
        );
      const shot = async (state) =>
        page.screenshot({
          path: path.join(artifacts, `admin-avatar-${state}-${label}.png`),
          fullPage: true,
        });
      await page.goto(`${baseURL}/admin/users/${userId}`);
      const remove = page.getByRole("button", {
        name: "Remover foto de perfil",
        exact: true,
      });
      await remove.waitFor();
      const avatar = page.getByRole("img", {
        name: `Foto de ${name}`,
        exact: true,
      });
      await avatar.locator("img").waitFor();
      await page.waitForFunction(() =>
        [...document.images].some(
          (img) =>
            img.src.includes("moderation.png") &&
            img.complete &&
            img.naturalWidth > 0,
        ),
      );
      check(
        (await avatar.locator("img").getAttribute("src")) === photo,
        "admin sees current avatar",
      );
      check(
        (await page.locator("input[type=file]").count()) === 0,
        "no upload control",
      );
      check(
        (await page
          .getByRole("button", {
            name: /alterar foto|enviar foto|substituir foto/i,
          })
          .count()) === 0,
        "no replacement action",
      );
      check(
        (await remove.boundingBox()).height >= 44,
        "touch-friendly removal",
      );
      await noOverflow();
      await shot("detail");
      await remove.click();
      const dialog = page.getByRole("dialog", {
        name: "Remover foto de perfil?",
      });
      await dialog.waitFor();
      check(
        (await dialog.textContent()).includes(name),
        "confirmation identifies target",
      );
      check(
        await dialog
          .getByRole("button", { name: "Cancelar", exact: true })
          .evaluate((button) => button === document.activeElement),
        "initial focus on cancellation",
      );
      await noOverflow();
      await shot("confirmation");
      await dialog
        .getByRole("button", { name: "Cancelar", exact: true })
        .click();
      check(
        requests === 0 && avatarUrl === photo,
        "cancel does not request removal",
      );
      await remove.click();
      failRemoval = true;
      await dialog
        .getByRole("button", { name: "Remover foto", exact: true })
        .click();
      await dialog
        .getByRole("button", { name: "Removendo…", exact: true })
        .waitFor();
      check(
        await dialog
          .getByRole("button", { name: "Removendo…", exact: true })
          .isDisabled(),
        "loading prevents duplicate confirmation",
      );
      check(
        await dialog
          .getByRole("button", { name: "Cancelar", exact: true })
          .isDisabled(),
        "pending cancellation blocked",
      );
      // Duplicate submission is also blocked synchronously by the shared single-flight gate.
      await dialog
        .locator("form")
        .evaluate((form) =>
          form.dispatchEvent(
            new Event("submit", { bubbles: true, cancelable: true }),
          ),
        );
      await dialog.getByRole("alert").waitFor();
      check(requests === 1, "concurrent submission issues one request");
      check(
        (await avatar.locator("img").getAttribute("src")) === photo,
        "failed operation preserves photo",
      );
      check(
        (await dialog.getByRole("alert").textContent()).includes(
          "Falha de teste",
        ),
        "error feedback",
      );
      failRemoval = false;
      await dialog
        .getByRole("button", { name: "Remover foto", exact: true })
        .click();
      await dialog.waitFor({ state: "hidden" });
      await remove.waitFor({ state: "hidden" });
      check(
        (await avatar.textContent()) === "WJ",
        "successful removal shows initials",
      );
      check(requests === 2, "retry works without duplicate requests");
      await page
        .getByText("Foto de perfil removida e auditoria registrada.", {
          exact: true,
        })
        .first()
        .waitFor();
      await noOverflow();
      await shot("fallback");
      await page.reload();
      await avatar.waitFor();
      check(
        (await avatar.textContent()) === "WJ" && (await remove.count()) === 0,
        "user without photo has fallback and no removal action",
      );
      await page.goto(baseURL + "/admin/audit");
      await page
        .getByText("Foto de perfil removida", { exact: true })
        .filter({ visible: true })
        .first()
        .waitFor();
      check(
        (await page
          .getByText("Foto de perfil removida", { exact: true })
          .filter({ visible: true })
          .count()) > 0,
        "audit screen labels event",
      );
      await noOverflow();
      check(
        errors.length === 0,
        "no browser runtime errors: " + errors.join("; "),
      );
      console.log(`${label} ${width}x${height}: passed`);
      await context.close();
    }
    console.log(
      `Admin avatar QA: ${checks} checks passed; 9 screenshots in ${artifacts}`,
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
