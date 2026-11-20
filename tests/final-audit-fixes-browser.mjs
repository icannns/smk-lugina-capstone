import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { requireDevelopmentDatabase } from "../prisma/development-safety.ts";

const target = requireDevelopmentDatabase(process.env);
assert(target.databaseName.startsWith("bojong_united_test"));
const base = process.env.AUDIT_BASE_URL ?? "http://localhost:3000";
assert(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
const require = createRequire(import.meta.url);
const { chromium, expect } = require(process.env.PLAYWRIGHT_MODULE ?? "@playwright/test");
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL ?? "msedge", headless: true });
const errors = [];
const widths = [320, 375, 768, 1024, 1440];

async function openContext() {
  const context = await browser.newContext({ timezoneId: "America/Los_Angeles" });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && /hydrat|server.rendered|did not match/i.test(message.text())) {
      errors.push(message.text());
    }
  });
  return { context, page };
}

async function verifyWidths(page, content) {
  for (const width of widths) {
    await page.setViewportSize({ width, height: 1024 });
    await expect(content).toBeVisible();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "overflow at " + width + "px");
  }
}

const wib = (time) => new Date("2026-11-21T" + time + "+07:00");

try {
  const { context, page } = await openContext();
  await page.goto(base + "/login");
  const notice = page.getByRole("complementary", { name: "Informasi autentikasi" });
  await expect(notice).toContainText("asesmen internal tersimpan di database");
  await expect(notice).toContainText("Sebagian hasil asesmen eksternal masih berupa data contoh.");
  await expect(notice).toContainText("Masuk dengan Google belum tersedia.");
  await expect(notice).not.toContainText(/masih mock|Data pembelajaran contoh/i);
  await verifyWidths(page, notice);
  await context.close();
  console.log("PASS Login accurately describes database-backed data, demo results and Google availability at five widths");

  for (const [role, login, password, name] of [
    ["guru", "rina.guru", process.env.TEST_TEACHER_PASSWORD, "Rina"],
    ["siswa", "dimas", process.env.TEST_DIMAS_PASSWORD, "Dimas"],
  ]) {
    assert(password);
    const { context, page } = await openContext();
    const dashboard = base + "/" + role + "/dashboard";
    await page.goto(base + "/login");
    await page.locator("#login-email").fill(login);
    await page.locator("#login-password").fill(password);
    await page.getByRole("button", { name: "Masuk", exact: true }).click();
    await page.waitForURL(dashboard);

    await page.clock.install({ time: wib("04:50:00") });
    await page.clock.pauseAt(wib("04:59:59"));
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Selamat malam, " + name, exact: true })).toBeVisible();
    const requests = [];
    page.on("request", (request) => { if (request.isNavigationRequest()) requests.push(request.url()); });
    await page.clock.runFor(1000);
    const greeting = page.getByRole("heading", { name: "Selamat pagi, " + name, exact: true });
    await expect(greeting).toBeVisible();
    assert.deepEqual(requests, []);
    assert.equal(page.url(), dashboard);
    if (role === "guru") await expect(page.getByText(/05[.:]00 WIB/)).toBeVisible();
    await verifyWidths(page, greeting);
    await context.close();
    console.log("PASS " + role + " clock crosses 05:00 WIB without navigation at five widths");
  }

  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
