import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import os from "node:os";

const require = createRequire(import.meta.url);
const { chromium, expect } = require(process.env.PLAYWRIGHT_MODULE || "@playwright/test");
const base = process.env.AUDIT_BASE_URL || "http://localhost:3000";
const output = process.env.AUDIT_OUTPUT_DIR || path.join(os.tmpdir(), "lugina-assessment-dashboard-regressions");
mkdirSync(output, { recursive: true });
const result = { checks: [], images: [], errors: [], failed: [] };
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || "msedge", headless: true });
const types = ["competency", "technostress", "uiux"];
const labels = { competency: "Uji Kompetensi", technostress: "Technostress", uiux: "Asesmen UI/UX" };
try {
  for (const width of [1440, 768, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 } });
    const page = await context.newPage();
    const registrationPassword = process.env.TEST_DIMAS_PASSWORD;
    page.on("pageerror", (e) => result.errors.push(e.message));
    page.on("console", (m) => { if (m.type() === "error") result.errors.push(m.text()); });
    page.on("response", (r) => { if (r.status() >= 400) result.failed.push([r.url(), r.status()]); });
    const main = () => page.locator("main:visible");
    const results = () => main().locator("section[aria-label^='Hasil asesmen']");
    const summary = (type) => results().locator(`[data-assessment-summary='${type}']`);
    const section = (type) => results().locator(`[data-assessment-type='${type}']`);
    const ok = (check) => result.checks.push({ width, check });
    async function login(username) {
      await page.goto(`${base}/login`);
      await page.locator("#login-email").fill(username);
      await page.locator("#login-password").fill(username === "rina.guru" ? process.env.TEST_TEACHER_PASSWORD : username === "aisyah" ? process.env.TEST_AISYAH_PASSWORD : process.env.TEST_DIMAS_PASSWORD);
      await page.getByRole("button", { name: "Masuk", exact: true }).click();
      await page.waitForURL(username === "rina.guru" ? "**/guru/dashboard" : "**/siswa/dashboard");
      await summary("competency").waitFor();
    }
    async function open(type, keyboard = false) {
      const button = summary(type).getByRole("button", { name: `Lihat hasil ${labels[type]}`, exact: true });
      if (await button.getAttribute("aria-expanded") !== "true") {
        if (keyboard) { await button.focus(); await button.press("Enter"); }
        else await button.click();
      }
      await expect(button).toHaveAttribute("aria-expanded", "true");
      await expect(section(type)).toBeVisible();
      await expect(results().getByRole("region", { name: `Daftar hasil ${labels[type]}`, exact: true })).toBeFocused();
    }
    async function close(type) {
      await results().getByRole("button", { name: "Tutup hasil", exact: true }).click();
      const button = summary(type).getByRole("button", { name: `Lihat hasil ${labels[type]}`, exact: true });
      await expect(button).toHaveAttribute("aria-expanded", "false");
      await expect(button).toBeFocused();
      await expect(results().locator("[data-assessment-type]")).toHaveCount(0);
    }
    async function logout() {
      await page.locator("summary[aria-label^='Menu akun']:visible").click();
      await page.getByRole("button", { name: "Keluar", exact: true }).click();
      await page.waitForURL("**/login");
    }
    async function detail(type) {
      const trigger = section(type).getByRole("button", { name: /^Lihat detail/ }).first();
      await trigger.focus(); await trigger.press("Enter");
      const modal = page.getByRole("dialog", { name: /Uji Kompetensi|Asesmen/ });
      await expect(modal).toBeVisible();
      await expect(modal.getByText("DATA ASESMEN CONTOH", { exact: true })).toBeVisible();
      const close = modal.getByRole("button", { name: "Tutup detail", exact: true });
      await expect(close).toBeFocused(); await page.keyboard.press("Tab"); await expect(close).toBeFocused();
      await page.keyboard.press("Shift+Tab"); await expect(close).toBeFocused();
      await page.keyboard.press("Escape"); await expect(modal).not.toBeVisible(); await expect(trigger).toBeFocused();
    }
    async function responsiveShot(role) {
      await results().scrollIntoViewIfNeeded();
      await page.evaluate(() => document.fonts.ready);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${role} page overflow ${width}`);
      await page.screenshot({ path: path.join(output, `${role}-${width}.png`), fullPage: true });
      await results().screenshot({ path: path.join(output, `${role}-summary-${width}.png`) });
      if (width === 1440 || width === 320) {
        for (const type of role === "guru" ? types : ["competency", "uiux"]) {
          await open(type);
          await section(type).screenshot({ path: path.join(output, `${role}-${type}-${width}.png`) });
          await close(type);
        }
      }
      await expect.poll(() => page.locator("img").evaluateAll((items) => items.filter((i) => i.checkVisibility()).every((i) => i.complete && i.naturalWidth > 0)), { timeout: 10000 }).toBe(true);
      const images = await page.locator("img").evaluateAll((items) => items.filter((i) => i.checkVisibility()).map((i) => ({ src: i.getAttribute("src"), loaded: i.complete && i.naturalWidth > 0, width: i.getBoundingClientRect().width, height: i.getBoundingClientRect().height, declaredWidth: i.getAttribute("width"), declaredHeight: i.getAttribute("height") })));
      assert(images.every((i) => i.loaded && i.width > 0 && i.height > 0), JSON.stringify(images.filter((i) => !i.loaded || i.width <= 0 || i.height <= 0)));
      result.images.push({ role, width, images });
    }
    await login("rina.guru");
    await expect(main().getByRole("heading", { name: "Event Anda", exact: true })).toBeVisible();
    await expect(main().getByRole("heading", { name: "Perlu Diperiksa", exact: true })).toBeVisible();
    const before = await page.evaluate(() => sessionStorage.getItem("lugina.teacher.event-drafts.v1"));
    assert.equal(await results().locator("[data-assessment-summary]").count(), 3);
    assert.equal(await results().locator("[data-assessment-type]").count(), 0);
    const teacherStats = await main().getByRole("region", { name: "Ringkasan event", exact: true }).boundingBox();
    const teacherSummary = await results().boundingBox();
    const draft = await main().getByRole("region", { name: "Draf event", exact: true }).boundingBox();
    assert(teacherStats.y + teacherStats.height <= teacherSummary.y);
    assert(teacherSummary.y + teacherSummary.height <= draft.y);
    ok("Teacher compact summary between statistics and draft; full lists initially closed");
    for (const type of types) {
      await open(type, type === "competency");
      const panel = section(type), label = labels[type];
      await panel.getByRole("searchbox", { name: `Cari siswa atau asesmen — ${label}` }).fill("dimas");
      await expect(panel).not.toContainText("Aisyah Putri");
      await panel.getByRole("combobox", { name: `Filter status — ${label}` }).selectOption("completed");
      await panel.getByRole("combobox", { name: `Filter event — ${label}` }).selectOption(type === "uiux" ? "wireframe" : "kantin");
      await detail(type);
      await panel.getByRole("searchbox", { name: `Cari siswa atau asesmen — ${label}` }).fill("tidak-ada-hasil");
      await expect(panel.getByText(/Tidak ada hasil yang sesuai filter/)).toBeVisible();
      await panel.getByRole("button", { name: `Hapus filter — ${label}` }).click();
      await close(type);
      ok(`Teacher ${type}: search + combined filters + keyboard detail/focus + empty/reset`);
    }
    await open("competency");
    const competency = section("competency");
    const next = competency.getByRole("button", { name: "Halaman berikutnya — Uji Kompetensi", exact: true });
    await next.click(); await expect(competency.getByText("6–6 dari 6 catatan", { exact: true })).toBeVisible();
    await expect(next).toBeDisabled();
    await competency.getByRole("button", { name: "Halaman sebelumnya — Uji Kompetensi", exact: true }).click();
    const counter = competency.locator('span[aria-label="Halaman 1 dari 2"]');
    const counterGeometry = await counter.evaluate((e) => ({ height: e.getBoundingClientRect().height, lineHeight: Number.parseFloat(getComputedStyle(e).lineHeight) }));
    assert(counterGeometry.height <= counterGeometry.lineHeight + 1, "Pagination counter must stay on one line");
    if (width === 320) await competency.getByRole("status").screenshot({ path: path.join(output, "guru-pagination-320.png") });
    assert.equal(await page.evaluate(() => sessionStorage.getItem("lugina.teacher.event-drafts.v1")), before, "Assessment viewing must not mutate milestone/event state");
    ok("Teacher paging and read-only existing store");
    await close("competency");
    await responsiveShot("guru");
    await logout(); await login("dimas");
    assert.equal(await results().locator("[data-assessment-summary]").count(), 2);
    assert.equal(await results().locator("[data-assessment-type]").count(), 0);
    const studentStats = await main().getByRole("region", { name: "Ringkasan event Siswa", exact: true }).boundingBox();
    const studentSummary = await results().boundingBox();
    const actions = await main().getByRole("heading", { name: "Perlu Tindakan", exact: true }).boundingBox();
    assert(studentStats.y + studentStats.height <= studentSummary.y);
    assert(studentSummary.y + studentSummary.height <= actions.y);
    ok("Student two compact cards between statistics and actions; history initially closed");
    await expect(results()).not.toContainText("Aisyah Putri");
    await expect(results()).not.toContainText("88 / 100");
    await expect(summary("competency").getByText("84 / 100", { exact: true })).toBeVisible();
    await expect(summary("uiux").getByText("Hasil belum diterbitkan.", { exact: true })).toBeVisible();
    await open("competency");
    await detail("competency");
    await close("competency");
    await open("uiux");
    await expect(section("uiux").getByText("79 / 100", { exact: true })).toBeVisible();
    await expect(section("uiux").getByText("Hasil belum diterbitkan.", { exact: true })).toBeVisible();
    await expect(results().locator("[data-assessment-type='technostress']")).toHaveCount(0);
    await detail("uiux");
    await close("uiux");
    await expect(main().getByRole("heading", { name: "Event Saya", exact: true })).toBeVisible();
    await responsiveShot("siswa");
    ok("Dimas: own scores/pending states only; old event dashboard and keyboard details preserved");
    await logout(); await login("aisyah");
    await expect(summary("uiux").getByText("88 / 100", { exact: true })).toBeVisible();
    await expect(results()).not.toContainText("84 / 100"); await expect(results()).not.toContainText("79 / 100");
    await page.goto(`${base}/siswa/dashboard?student=dimas`);
    await expect(summary("uiux").getByText("88 / 100", { exact: true })).toBeVisible();
    await expect(results()).not.toContainText("84 / 100");
    ok("Aisyah after account switch: no stale Dimas records; URL cannot override session identity");
    if (width === 1440) {
      await logout(); await page.goto(`${base}/register`);
      await page.locator("#register-name").fill("Siswa Asesmen Contoh");
      await page.locator("#register-email").fill(`asesmen.${Date.now()}@example.com`);
      await page.locator("#register-password").fill(registrationPassword);
      await page.locator("#register-confirm").fill(registrationPassword);
      await page.getByRole("button", { name: "Daftar Sekarang", exact: true }).click();
      await page.waitForURL("**/siswa/dashboard");
      await expect(summary("competency").getByText(/Belum ada uji kompetensi/)).toBeVisible();
      await expect(summary("uiux").getByText(/Belum ada asesmen ui\/ux/)).toBeVisible();
      await open("uiux");
      await expect(section("uiux").getByText(/Belum ada asesmen ui\/ux/)).toBeVisible();
      await expect(results().getByRole("button", { name: /^Lihat detail/ })).toHaveCount(0);
      ok("Newly registered student: real empty state; no fallback to another student");
    }
    await context.close();
  }
  assert.deepEqual(result.errors, []); assert.deepEqual(result.failed, []);
  writeFileSync(path.join(output, "results.json"), JSON.stringify(result, null, 2));
  console.log({ passed: result.checks.length, errors: result.errors, failed: result.failed, output });
} catch (error) {
  writeFileSync(path.join(output, "failure.json"), JSON.stringify({ error: String(error), ...result }, null, 2));
  throw error;
} finally { await browser.close(); }
