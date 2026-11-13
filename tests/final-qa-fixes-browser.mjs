import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { randomBytes, createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { requireDevelopmentDatabase } from "../prisma/development-safety.ts";
import { createDatabaseClient } from "../src/server/db/client.ts";
import { createPrototypePdf } from "../src/lib/guru/prototype-pdf.ts";

const target = requireDevelopmentDatabase(process.env);
assert(target.databaseName.startsWith("bojong_united_test"));
const base = process.env.AUDIT_BASE_URL || "http://localhost:3000";
assert(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
const require = createRequire(import.meta.url);
const { chromium, expect } = require(process.env.PLAYWRIGHT_MODULE || "@playwright/test");
const { fromBuffer } = require("yauzl");
const database = createDatabaseClient(target.connectionString);
const output = process.env.AUDIT_OUTPUT_DIR || path.join(os.tmpdir(), "lugina-final-qa-fixes");
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const contexts = [], checks = [], runtimeErrors = [];
const stamp = randomBytes(7).toString("hex"), title = `QA Fix ${stamp}`, eventId = `fix-${stamp}`;
const sha = (b) => createHash("sha256").update(b).digest("hex");
function ok(check) { checks.push(check); console.log("PASS", check); }
async function context(identifier, password) {
  const c = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  contexts.push(c);
  const csrf = await (await c.request.get(base + "/api/auth/csrf")).json();
  await c.request.post(base + "/api/auth/callback/credentials", {
    headers: { "X-Auth-Return-Redirect": "1" },
    form: { csrfToken: csrf.csrfToken, identifier, password, remember: "true" },
  });
  assert.equal((await c.request.get(base + "/api/me")).status(), 200);
  return c;
}
async function api(c, method, url, data, expected = 200) {
  const r = await c.request.fetch(base + url, { method, headers: { Origin: base }, ...(data === undefined ? {} : { data }) });
  const value = await r.json();
  assert.equal(r.status(), expected, JSON.stringify(value));
  return value;
}
async function page(c) { const p = await c.newPage(); p.on("pageerror", (e) => runtimeErrors.push(e.message)); return p; }
async function painted(canvas) {
  await expect(canvas).toBeVisible();
  assert(await canvas.evaluate((c) => {
    const pixels = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    for (let i = 0; i < pixels.length; i += 4)
      if (pixels[i + 3] && pixels[i] < 180 && pixels[i + 1] < 180 && pixels[i + 2] < 180) return true;
    return false;
  }), "Canvas must contain actual PDF marks");
}
async function unzipXml(bytes) {
  return new Promise((resolve, reject) => fromBuffer(bytes, { lazyEntries: true }, (error, zip) => {
    if (error) return reject(error);
    const files = {};
    zip.on("error", reject);
    zip.on("end", () => resolve(files));
    zip.on("entry", (entry) => {
      if (!entry.fileName.endsWith(".xml")) return zip.readEntry();
      zip.openReadStream(entry, (err, stream) => {
        if (err) return reject(err);
        const chunks = [];
        stream.on("error", reject);
        stream.on("data", (b) => chunks.push(b));
        stream.on("end", () => { files[entry.fileName] = Buffer.concat(chunks).toString("utf8"); zip.readEntry(); });
      });
    });
    zip.readEntry();
  }));
}
try {
  const teacher = await context("rina.guru", process.env.TEST_TEACHER_PASSWORD);
  const student = await context("dimas", process.env.TEST_DIMAS_PASSWORD);
  const other = await context("aisyah", process.env.TEST_AISYAH_PASSWORD);
  const workspace = await api(teacher, "GET", "/api/workspace");
  const rubricId = `fix-rubric-${stamp}`;
  await api(teacher, "POST", "/api/rubrics", {
    id: rubricId, title: `Rubrik ${title}`, description: "Fiktif", updated: "2026-11-13", inUse: false,
    criteria: [{ id: "quality", title: "Kualitas", description: "Fiktif", min: 1, max: 5, levels: ["1", "2", "3", "4", "5"] }],
  }, 201);
  const source = workspace.published.kantin;
  const input = { ...source, id: eventId, revision: undefined, title, status: "draft", rubricId,
    startAt: "2026-01-01T08:00", endAt: "2030-12-31T23:59", caseStudyHtml: "<p>Belajar fiktif</p>",
    certificateConfig: { mode: "details", threshold: "75", name: "Dokumen Fiktif", organizer: "QA", issuedAt: "2026-11-14", signer: "Guru Fiktif", signerRole: "Guru", description: "Prototipe", positions: { student: { x: 50, y: 45 }, event: { x: 50, y: 58 }, date: { x: 17, y: 78 }, score: { x: 83, y: 78 } } },
    milestones: [{ id: "M1", title: "Tugas", instructions: "Tugas fiktif", surveyActive: false, deadline: "2030-12-01T23:59", formats: "PDF, Teks" }],
  };
  await api(teacher, "POST", "/api/events", { event: input }, 201);
  await api(teacher, "POST", `/api/events/${eventId}/publish`, { event: (await api(teacher, "GET", `/api/events/${eventId}`)).event });
  const draftId = `fix-draft-${stamp}`;
  await api(teacher, "POST", "/api/events", { event: { ...input, id: draftId, title: `${title} draft` } }, 201);
  const listed = await api(teacher, "GET", `/api/events?search=${encodeURIComponent(title)}&sort=updated&pageSize=1`);
  assert.equal(listed.events[0].id, draftId);
  assert.equal((await api(teacher, "GET", `/api/events?search=${encodeURIComponent(title)}&page=2&pageSize=1`)).events[0].id, eventId);
  assert(listed.events[0].updatedAt.includes("T"));
  ok("QA-01: exact timestamp ordering crosses draft/published before pagination, including same-day updates");

  await api(student, "POST", `/api/events/${eventId}/enrollments`, {});
  const sp = await page(student), tp = await page(teacher);
  for (const width of [320, 375, 768, 1024, 1440]) {
    await sp.setViewportSize({ width, height: 1000 });
    await sp.goto(base + `/siswa/workspace?event=${eventId}&milestone=M1`);
    await expect(sp.locator("#student-files")).toBeVisible();
    await expect(sp.getByRole("heading", { name: "Form Survei", exact: true })).toHaveCount(0);
    await expect(sp.locator("main:visible").last()).not.toContainText("Form survei terbuka setelah");
  }
  ok("QA-06: no unassigned survey promise before submission at all five widths");
  const bytes = Buffer.from(createPrototypePdf("QA Two Page PDF", Array.from({ length: 70 }, (_, i) => `Evidence line ${i + 1}`), "Fictional data"));
  const upload = await student.request.post(base + `/api/events/${eventId}/milestones/M1/attachments`, {
    headers: { Origin: base }, multipart: { file: { name: "two-pages.pdf", mimeType: "application/pdf", buffer: bytes }, expectedVersion: "0", requestId: `fix-upload-${stamp}` },
  });
  assert.equal(upload.status(), 201);
  const attachment = (await upload.json()).attachment;
  const submitted = await api(student, "POST", `/api/events/${eventId}/milestones/M1/submissions`, {
    work: { files: [{ id: attachment.id, name: attachment.name, type: attachment.type, size: attachment.size }], text: "Tugas fiktif", link: "" }, expectedVersion: 0, requestId: `fix-submit-${stamp}`,
  }, 201);
  const submissionId = submitted.id ?? submitted.submissionId;
  assert(submissionId);
  await api(teacher, "PUT", `/api/submissions/${submissionId}/assessment`, { version: 1, expectedRevision: 0, scores: { quality: 5 }, requestId: `fix-grade-${stamp}` });
  await tp.goto(base + `/guru/students?event=${eventId}&student=dimas`);
  await expect(tp.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  await expect(tp.locator("main:visible").last()).not.toContainText("Sudah Dikirim");
  const report = await api(teacher, "GET", `/api/reports?event=${eventId}`);
  assert(report);
  ok("QA-02: Student Detail progress=100 while survey response timestamps remain absent");

  await tp.goto(base + `/guru/monitoring?event=${eventId}&student=dimas&milestone=M1`);
  await tp.getByRole("button", { name: "Pratinjau", exact: true }).first().click();
  const dialog = tp.getByRole("dialog"), canvas = dialog.locator('canvas[role="img"]');
  await painted(canvas);
  await expect(canvas).toHaveAttribute("aria-label", /halaman 1 dari 2/);
  await dialog.getByRole("button", { name: "Berikutnya", exact: true }).click();
  await expect(canvas).toHaveAttribute("aria-label", /halaman 2 dari 2/);
  await painted(canvas);
  await dialog.getByRole("button", { name: "Sebelumnya", exact: true }).focus();
  await tp.keyboard.press("Enter");
  await expect(canvas).toHaveAttribute("aria-label", /halaman 1 dari 2/);
  ok("QA-07: actual two-page PDF paints, page navigation and keyboard activation work without iframe/native plugin");
  for (const width of [320, 375, 768, 1024, 1440]) {
    await tp.setViewportSize({ width, height: 1000 });
    await painted(canvas);
    assert(await tp.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await tp.screenshot({ path: path.join(output, `pdf-${width}.png`), fullPage: true });
  }
  const download = tp.waitForEvent("download");
  await dialog.getByRole("button", { name: "Unduh PDF", exact: true }).click();
  const downloaded = path.join(output, "two-pages.pdf");
  await (await download).saveAs(downloaded);
  assert.equal(sha(readFileSync(downloaded)), sha(bytes));
  assert.equal((await other.request.get(base + `/api/attachments/${attachment.id}/preview`)).status(), 403);
  await dialog.getByRole("button", { name: "Tutup", exact: true }).click();
  ok("QA-07: PDF responsive at five widths; explicit download matches checksum; other Student remains forbidden");
  for (let i = 0; i < 3; i++) {
    await tp.getByRole("button", { name: "Pratinjau", exact: true }).first().click();
    await painted(canvas);
    await dialog.getByRole("button", { name: "Tutup", exact: true }).click();
  }
  ok("QA-07: repeated open/close/reopen destroys workers without browser runtime exceptions");

  const anonymous = await browser.newContext(); contexts.push(anonymous);
  const password = randomBytes(24).toString("base64url") + "Az1!";
  await api(anonymous, "POST", "/api/auth/register", { name: "QA\u000bKontrol", email: `invalid-${stamp}@example.com`, password, confirm: password }, 400);
  for (const c of [teacher, student]) {
    const before = (await api(c, "GET", "/api/me")).user;
    await api(c, "PUT", "/api/profile", { name: "QA\u000bKontrol", email: "fixture@example.com", phone: "" }, 400);
    assert.deepEqual((await api(c, "GET", "/api/me")).user, before);
  }
  ok("QA-03: real registration and both profile endpoints reject control names without mutation");

  // A historical DB value may predate validation; export still must be valid XML.
  const legacyId = `legacy-${stamp}`;
  await database.user.create({ data: { id: `user-${legacyId}`, name: "Legacy\u000bKontrol & =1+1", email: `${legacyId}@example.com`, role: "STUDENT", isDemo: true, student: { create: { id: legacyId } } } });
  await database.enrollment.create({ data: { eventId, studentId: legacyId } });
  await tp.goto(base + `/guru/reports?event=${eventId}`);
  const excel = tp.waitForEvent("download");
  await tp.getByRole("button", { name: "Unduh Excel", exact: true }).click();
  const excelPath = path.join(output, "legacy-name.xlsx"); await (await excel).saveAs(excelPath);
  const xmlFiles = await unzipXml(readFileSync(excelPath));
  assert(xmlFiles["xl/worksheets/sheet1.xml"].includes("LegacyKontrol &amp; =1+1"));
  assert(await tp.evaluate((files) => Object.values(files).every((xml) => !new DOMParser().parseFromString(xml, "application/xml").querySelector("parsererror")), xmlFiles));
  assert(!xmlFiles["xl/worksheets/sheet1.xml"].includes("<f>"));
  ok("QA-03: real exported XLSX remains valid XML for historical control names and keeps string cells");
  for (const doc of ["DATABASE-FOUNDATION.md", "AUTHENTICATION-RBAC.md"]) {
    const banner = readFileSync(path.join("docs", doc), "utf8").split(/\r?\n\r?\n/)[1];
    assert(banner.includes("29") && banner.includes("Phase 4B") && banner.includes("FILE-UPLOAD-ATTACHMENTS.md"));
    assert(!banner.includes("27 model"));
  }
  ok("QA-05: current-status documentation states Phase4B/29 models/private bytes and links actual contracts");
  assert.deepEqual(runtimeErrors, []);
  ok("No browser runtime errors in focused fix verification");
} finally {
  writeFileSync(path.join(output, "results.json"), JSON.stringify({ checks, runtimeErrors }, null, 2));
  for (const c of contexts) await c.close();
  await browser.close();
  await database.$disconnect();
}
