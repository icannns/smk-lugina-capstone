import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium, expect } = require(
  process.env.PLAYWRIGHT_MODULE || "@playwright/test",
);
const base = process.env.AUDIT_BASE_URL || "http://localhost:3000";
const output =
  process.env.AUDIT_OUTPUT_DIR ||
  path.join(os.tmpdir(), "lugina-role-navigation-regressions");
mkdirSync(output, { recursive: true });

const routes = {
  teacher: [
    "/guru/dashboard",
    "/guru/students",
    "/guru/events",
    "/guru/events/create",
    "/guru/rubrics",
    "/guru/monitoring",
    "/guru/work",
    "/guru/reports",
    "/guru/profile",
  ],
  student: [
    "/siswa/dashboard",
    "/siswa/events",
    "/siswa/workspace?event=kantin&milestone=M2",
    "/siswa/survey?event=kantin&milestone=M2",
    "/siswa/portfolio",
    "/siswa/profile",
  ],
};
// Every protected page must be exercised: adding a route also requires adding
// its unauthenticated, own-role and wrong-role navigation scenarios here.
const app = fileURLToPath(new URL("../src/app/", import.meta.url));
for (const [role, prefix] of [["teacher", "guru"], ["student", "siswa"]]) {
  const discovered = readdirSync(path.join(app, prefix), { recursive: true })
    .map((name) => name.replaceAll(path.sep, "/"))
    .filter((name) => name.endsWith("/page.tsx"))
    .map((name) => `/${prefix}/${name.slice(0, -"/page.tsx".length)}`)
    .sort();
  assert.deepEqual(discovered, routes[role].map((url) => url.split("?")[0]).sort());
}
const result = { checks: [], pageErrors: [], consoleErrors: [], warnings: [], failed: [] };
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL || "msedge",
  headless: true,
});
const context = await browser.newContext({ viewport: { width: 1440, height: 1024 } });
const page = await context.newPage();
page.on("pageerror", (error) => result.pageErrors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") result.consoleErrors.push(message.text());
  if (message.type() === "warning") result.warnings.push(message.text());
});
page.on("response", (response) => {
  if (response.status() >= 400)
    result.failed.push({ url: response.url(), status: response.status() });
});

async function arrive(url, expected = url) {
  await page.goto(new URL(url, base).href);
  await page.waitForURL((current) => current.pathname === expected.split("?")[0]);
  await expect(page.locator("main:visible")).toBeVisible();
}
async function login(role) {
  await arrive("/login");
  await page.locator("#login-email").fill(role === "teacher" ? "rina.guru" : "dimas");
  await page
    .locator("#login-password")
    .fill(role === "teacher" ? process.env.TEST_TEACHER_PASSWORD : process.env.TEST_DIMAS_PASSWORD);
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await page.waitForURL("**/" + (role === "teacher" ? "guru" : "siswa") + "/dashboard");
  await expect(page.locator("main:visible h1")).toHaveText(
    role === "teacher" ? "Selamat pagi, Rina" : "Halo, Dimas",
  );
}

try {
  for (const url of [...routes.teacher, ...routes.student]) {
    await arrive(url, "/login");
    await expect(page.getByRole("heading", { name: "Masuk ke Akun", exact: true })).toBeVisible();
    result.checks.push({ check: "unauthenticated redirect", url });
  }

  for (const role of ["teacher", "student"]) {
    await login(role);
    for (const url of routes[role]) {
      await arrive(url);
      assert.equal(new URL(page.url()).pathname, url.split("?")[0]);
      result.checks.push({ check: "own-role route", role, url });
    }
    const other = role === "teacher" ? "student" : "teacher";
    const home = role === "teacher" ? "/guru/dashboard" : "/siswa/dashboard";
    for (const url of routes[other]) {
      await arrive(url, home);
      await expect(page.locator("main:visible h1")).toHaveText(
        role === "teacher" ? "Selamat pagi, Rina" : "Halo, Dimas",
      );
      result.checks.push({ check: "wrong-role redirect", role, url });
    }

    if (role === "teacher") {
      for (const [student, milestone, name] of [
        ["aisyah", "M1", "Aisyah Putri"],
        ["nabila", "M4", "Nabila Zahra"],
      ]) {
        const target = `/guru/monitoring?event=kantin&student=${student}&milestone=${milestone}`;
        for (const mode of ["direct", "client"]) {
          if (mode === "direct") await arrive(target);
          else {
            await arrive("/guru/dashboard");
            await page.locator("aside[aria-label='Sidebar Guru']")
              .getByRole("link", { name: "Monitoring Progres", exact: true }).click();
            const main = page.locator("main:visible");
            await main.locator(`a[href='${target}']`).click();
          }
          await expect(page).toHaveURL(new URL(target, base).href);
          await expect(page.locator("main:visible h1")).toHaveText(name);
          await expect(page.locator("main:visible").getByText(new RegExp(`Milestone ${milestone.slice(1)}:`))).toBeVisible();
          // Development's route validation completes asynchronously after rendering.
          await page.waitForTimeout(1000);
          result.checks.push({ check: "Monitoring exact context", student, milestone, mode });
        }
      }
    }

    const accountMenu = role === "teacher" ? "Menu akun Rina Marlina, S.Kom." : "Menu akun Dimas Saputra";
    await page.locator(`summary[aria-label='${accountMenu}']:visible`).click();
    await page.getByRole("button", { name: "Keluar", exact: true }).click();
    await page.waitForURL("**/login");
    await arrive(home, "/login");
    result.checks.push({ check: "logout invalidates access", role });
  }
  await page.waitForTimeout(1000);
  const navigationDiagnostics = [...result.consoleErrors, ...result.warnings]
    .filter((message) => /instant.navigation|unrendered.segment|dropped from rendering/i.test(message));
  assert.deepEqual(navigationDiagnostics, []);
  assert.deepEqual(result.pageErrors, []);
  assert.deepEqual(result.consoleErrors, []);
  assert.deepEqual(result.failed, []);
  writeFileSync(path.join(output, "results.json"), JSON.stringify(result, null, 2));
  console.log({ passed: result.checks.length, pageErrors: [], consoleErrors: [], failed: [], warnings: result.warnings.length });
} catch (error) {
  writeFileSync(path.join(output, "failure.json"), JSON.stringify({ error: String(error), ...result }, null, 2));
  throw error;
} finally {
  await browser.close();
}
