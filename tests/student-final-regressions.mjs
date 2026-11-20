import "dotenv/config";
import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { requireDevelopmentDatabase } from "../prisma/development-safety.ts";

const require = createRequire(import.meta.url);
const { chromium, expect } = require(process.env.PLAYWRIGHT_MODULE ?? "@playwright/test");
const { Pool } = require("pg");
const target = requireDevelopmentDatabase(process.env);
assert(target.databaseName.startsWith("bojong_united_test"));
const base = process.env.AUDIT_BASE_URL ?? "http://localhost:3000";
assert(["127.0.0.1", "localhost"].includes(new URL(base).hostname));
const teacherPassword = process.env.TEST_TEACHER_PASSWORD;
const dimasPassword = process.env.TEST_DIMAS_PASSWORD;
const aisyahPassword = process.env.TEST_AISYAH_PASSWORD;
assert(teacherPassword && dimasPassword && aisyahPassword);
const baseline = process.env.STUDENT_QA_BASELINE === "1";
const output = process.env.AUDIT_OUTPUT_DIR ?? path.join(os.tmpdir(), "lugina-student-final-regressions");
mkdirSync(output, { recursive: true });

const database = new Pool({ connectionString: target.connectionString, max: 2 });
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL ?? "msedge", headless: true });
const sample = randomBytes(5).toString("hex");
const eventId = `qa-siswa-${sample}`;
const title = `Portofolio Literasi ${sample}`;
const email = `qa-siswa-${sample}@example.com`;
const newPassword = `Aa1!${randomBytes(24).toString("base64url")}`;
const newName = `Siswa Fiktif ${sample}`;
const statuses = [];
const lifecycle = {};
const checks = [];
const runtimeErrors = [];
const browserErrors = [];
const main = page => page.locator("main:visible").last();
const button = (scope, name) => scope.getByRole("button", { name, exact: true });
const link = (scope, name) => scope.getByRole("link", { name, exact: true });

function pass(id) {
  checks.push(id);
  console.log("PASS", id);
}

async function context() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  const page = await ctx.newPage();
  page.on("pageerror", error => runtimeErrors.push(error.message));
  page.on("console", msg => {
    if (msg.type() === "error" && !msg.text().startsWith("Failed to load resource:")) browserErrors.push(msg.text());
  });
  return { ctx, page };
}

async function api(ctx, method, route, data, expectedStatus = 200) {
  const response = await ctx.request.fetch(base + route, {
    method,
    headers: { Origin: base },
    ...(data !== undefined && { data }),
  });
  assert.equal(response.status(), expectedStatus, `${method} ${route}`);
  return response.json();
}

async function login(page, identifier, password, role) {
  await page.goto(base + "/login");
  await page.locator("#login-email").fill(identifier);
  await page.locator("#login-password").fill(password);
  await button(page, "Masuk").click();
  await page.waitForURL(`**/${role}/dashboard`);
  await expect(main(page).getByRole("heading", { level: 1 })).toBeVisible();
}

async function logout(page) {
  await page.locator('summary[aria-label^="Menu akun"]').click();
  await page.getByRole("button", { name: "Keluar", exact: true }).click();
  await page.waitForURL("**/login");
}

function eventForm(id, eventTitle, startAt = "2025-01-01T08:00", endAt = "2099-12-31T23:59") {
  return {
    id,
    title: eventTitle,
    mode: "Penyelesaian",
    status: "draft",
    updated: "2026-11-20",
    period: "Belum diatur",
    caseStudyHtml: "<p>Rancang portal literasi fiktif.</p>",
    startAt,
    endAt,
    rubricId: "uiux",
    milestones: [1, 2, 3].map(number => ({
      id: `M${number}`, title: `Tahap ${number}`, instructions: "Catat pengerjaan.",
      formats: "Teks, PDF, Gambar, DOCX", deadline: endAt,
    })),
    certificateConfig: {
      mode: "details", threshold: "75", name: "Dokumen belajar", organizer: "Sekolah",
      issuedAt: "2026-11-20", signer: "Guru", signerRole: "Pengampu", description: "Dokumen contoh",
      positions: { student: { x: 50, y: 45 }, event: { x: 50, y: 58 }, date: { x: 17, y: 78 }, score: { x: 83, y: 78 } },
    },
  };
}

async function stageEvent(ctx, event, { publish = true, requireSurvey = false } = {}) {
  await api(ctx, "POST", "/api/events", { event }, 201);
  const route = "/api/events/" + event.id;
  if (requireSurvey) {
    const stored = (await api(ctx, "GET", route)).event;
    await api(ctx, "PUT", route + "/milestones/M1/survey-reference", {
      surveyReferenceId: "demo-learning-survey", expectedRevision: stored.revision,
    });
  }
  if (publish) await api(ctx, "POST", route + "/publish", { event: (await api(ctx, "GET", route)).event });
}

async function checkLifecycle(teacher, visitor, enrolled) {
  const archived = eventForm(`${eventId}-archive`, `Arsip Literasi ${sample}`);
  await stageEvent(teacher.ctx, archived);
  const route = `/api/events/${archived.id}`;
  await api(enrolled.ctx, "POST", route + "/enrollments", {});
  const event = (await api(teacher.ctx, "GET", route)).event;
  const endAt = "2025-02-01T23:59";
  await api(teacher.ctx, "PUT", route, {
    event: { ...event, endAt, milestones: event.milestones.map(m => ({ ...m, deadline: endAt })) },
  });
  const signup = await api(visitor.ctx, "POST", route + "/enrollments", {}, 409);
  assert.equal(signup.error.code, "ENROLLMENT_CLOSED");
  for (const [actor, key] of [[visitor, "visitor"], [enrolled, "participant"]]) {
    await actor.page.goto(base + `/siswa/events?event=${archived.id}`);
    await expect(main(actor.page).getByRole("heading", { name: archived.title })).toBeVisible();
    lifecycle[key] = await main(actor.page).locator("header span").first().innerText();
  }
  await expect(button(main(visitor.page), "Enroll Event")).toBeDisabled();
  await enrolled.page.goto(base + "/siswa/events");
  await main(enrolled.page).getByRole("textbox", { name: "Cari judul event" }).fill(archived.title);
  lifecycle.participantCard = await main(enrolled.page).getByRole("heading", { name: archived.title }).locator("..").locator("span").first().innerText();
  if (!baseline) {
    assert.equal(lifecycle.visitor, "Berakhir");
    assert.equal(lifecycle.participant, "Sudah Terdaftar · Berakhir");
    assert.equal(lifecycle.participantCard, "Sudah Diikuti · Berakhir");
    await enrolled.page.goto(base + "/siswa/dashboard");
    await expect(dashboardCard(enrolled.page, archived.title)).toBeVisible();
    await button(main(enrolled.page), "Aktif").click();
    await expect(dashboardCard(enrolled.page, archived.title)).toHaveCount(0);
    pass("EVENT-LIFECYCLE");
  }
}

async function checkRegistrationAndDiscovery(teacher) {
  const fresh = await context();
  await fresh.page.goto(base + "/register");
  for (const [field, value] of Object.entries({ name: newName, email, password: newPassword, confirm: newPassword })) {
    await fresh.page.locator(`#register-${field}`).fill(value);
  }
  await button(fresh.page, "Daftar Sekarang").click();
  await fresh.page.waitForURL("**/siswa/dashboard");
  const registered = (await api(fresh.ctx, "GET", "/api/me")).user;
  assert.equal(registered.role, "STUDENT");
  const { rows: accounts } = await database.query(`SELECT u.id, u.role,
      (u."passwordHash" LIKE '$argon2id$%') AS hashed, s.id AS "studentId"
      FROM "User" u JOIN "StudentProfile" s ON s."userId" = u.id WHERE u.email = $1`, [email]);
  assert.deepEqual(accounts, [{ id: registered.id, role: "STUDENT", hashed: true, studentId: registered.student.id }]);
  await logout(fresh.page);
  await api(fresh.ctx, "GET", "/api/workspace", undefined, 401);
  await fresh.page.goto(base + "/siswa/profile");
  await fresh.page.waitForURL("**/login");
  await login(fresh.page, email, newPassword, "siswa");
  await fresh.page.goto(base + "/guru/dashboard");
  await fresh.page.waitForURL("**/siswa/dashboard");
  await api(fresh.ctx, "GET", "/api/reports", undefined, 403);
  pass("PUBLIC-REGISTRATION-AND-RBAC");

  await fresh.page.goto(base + "/siswa/profile");
  const profileName = fresh.page.locator("#student-profile-name");
  await profileName.fill("X");
  await button(fresh.page, "Simpan Perubahan").click();
  await expect(profileName).toBeFocused();
  const changedName = `Pelajar Literasi ${sample}`;
  const contact = `kontak-literasi-${sample}@example.com`;
  await profileName.fill(changedName);
  await fresh.page.locator("#student-profile-email").fill(contact);
  await button(fresh.page, "Simpan Perubahan").click();
  await expect(main(fresh.page)).toContainText("Perubahan profil berhasil disimpan.");
  await fresh.page.reload();
  await expect(profileName).toHaveValue(changedName);
  const profile = (await database.query(`SELECT u.name, u.email, s."contactEmail"
    FROM "User" u JOIN "StudentProfile" s ON s."userId" = u.id WHERE u.id = $1`, [registered.id])).rows[0];
  assert.deepEqual(profile, { name: changedName, email, contactEmail: contact });
  pass("UAT-36");

  const future = eventForm(`${eventId}-next`, `Literasi Mendatang ${sample}`, "2098-01-01T08:00");
  await stageEvent(teacher.ctx, future);
  const draft = eventForm(`${eventId}-draft`, `Draf Literasi ${sample}`);
  await stageEvent(teacher.ctx, draft, { publish: false });
  await api(fresh.ctx, "POST", `/api/events/${draft.id}/enrollments`, {}, 403);
  const catalog = (await api(fresh.ctx, "GET", "/api/events")).events;
  assert(catalog.some(item => item.id === eventId));
  assert(!catalog.some(item => item.id === draft.id));
  await fresh.page.goto(base + "/siswa/events");
  const catalogView = main(fresh.page);
  await expect(button(catalogView, `Semua Event (${catalog.length})`)).toBeVisible();
  assert(catalog.length > 6);
  await button(catalogView, "Halaman event berikutnya").click();
  await expect(button(catalogView, "Halaman event 2")).toHaveAttribute("aria-current", "page");
  await expect(catalogView).toContainText(`Menampilkan 7–${Math.min(12, catalog.length)} dari ${catalog.length} event`);
  await button(catalogView, "Halaman event sebelumnya").click();
  const statusFilter = catalogView.getByLabel("Status event");
  const search = catalogView.getByRole("textbox", { name: "Cari judul event" });
  for (const status of ["ongoing", "upcoming", "ended", "all"]) {
    await statusFilter.selectOption(status);
    const total = status === "all" ? catalog.length : catalog.filter(item => item.status === status).length;
    await expect(catalogView.locator("h2")).toHaveCount(Math.min(6, total));
  }
  await search.fill(draft.title);
  await expect(catalogView).toContainText("Tidak ada event sesuai pencarian atau filter.");
  await search.fill(title);
  await expect(catalogView.locator("h2")).toHaveCount(1);
  pass("UAT-46");
  await link(catalogView, "Lihat Detail & Enroll").click();
  const detail = main(fresh.page);
  await expect(detail.getByText("Terbuka · Berlangsung", { exact: true })).toHaveClass(/bg-blue-50/);
  pass("UAT-43");
  await button(detail, "Enroll Event").click();
  const dialog = fresh.page.getByRole("dialog", { name: "Ikuti Event Pembelajaran Ini?" });
  await expect(dialog).toBeVisible();
  await button(dialog, "Batal").click();
  await expect(dialog).not.toBeVisible();
  await button(detail, "Enroll Event").click();
  await button(dialog, "Ya, Enroll Event").click();
  await expect(detail).toContainText("Pendaftaran berhasil!");
  pass("UAT-44");
  await expect(detail.getByText("Sudah Terdaftar · Aktif", { exact: true })).toHaveClass(/bg-green-50/);
  await expect(link(detail, "Buka Ruang Kerja Event")).toHaveAttribute("href", `/siswa/workspace?event=${eventId}&milestone=M1`);
  pass("UAT-42");
  const enrollPath = `/api/events/${eventId}/enrollments`;
  assert.equal((await api(fresh.ctx, "POST", enrollPath, {})).created, false);
  await api(fresh.ctx, "POST", enrollPath, { studentId: "dimas" }, 400);
  const enrollments = () => database.query('SELECT id FROM "Enrollment" WHERE "eventId" = $1 AND "studentId" = $2', [eventId, registered.student.id]);
  const enrollment = (await enrollments()).rows;
  assert.equal(enrollment.length, 1);

  await fresh.page.goto(base + "/siswa/events");
  await button(main(fresh.page), `Belum Diikuti (${catalog.length - 1})`).click();
  await main(fresh.page).getByRole("textbox", { name: "Cari judul event" }).fill(title);
  await expect(main(fresh.page).getByRole("heading", { name: title })).toHaveCount(0);
  pass("UAT-45");
  await link(main(fresh.page), "Event Saya (1)").click();
  await expect(dashboardCard(fresh.page)).toContainText("0 dari 3 milestone");
  await expect(main(fresh.page).getByRole("region", { name: "Ringkasan event Siswa" })).toContainText("0 selesai");
  pass("UAT-47");
  await fresh.page.reload();
  await expect(dashboardCard(fresh.page)).toBeVisible();
  await logout(fresh.page);
  await login(fresh.page, email, newPassword, "siswa");
  await expect(dashboardCard(fresh.page)).toBeVisible();

  await teacher.page.goto(base + `/guru/events?event=${eventId}`);
  await expect(main(teacher.page)).toContainText("2 siswa (Enroll Mandiri)");
  await button(main(teacher.page), "Monitoring").click();
  await expect(main(teacher.page).getByRole("row").filter({ hasText: changedName })).toBeVisible();
  await teacher.page.reload();
  await expect(main(teacher.page).getByRole("row").filter({ hasText: changedName })).toBeVisible();
  await logout(teacher.page);
  await login(teacher.page, "rina.guru", teacherPassword, "guru");
  await teacher.page.goto(base + `/guru/monitoring?event=${eventId}`);
  await expect(main(teacher.page).getByRole("row").filter({ hasText: changedName })).toBeVisible();
  assert((await api(teacher.ctx, "GET", enrollPath)).enrollments.some(item => item.id === enrollment[0].id));
  assert.deepEqual((await enrollments()).rows, enrollment);
  pass("CROSS-ACCOUNT-ENROLLMENT-PERSISTENCE");
  return { ...fresh, studentId: registered.student.id };
}

async function checkPrivateFileAfterRelogin(enrolled, other) {
  const route = `/siswa/workspace?event=${eventId}&milestone=M1`;
  const fixtures = [
    ["pdf", "application/pdf"],
    ["jpg", "image/jpeg"],
    ["docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ].map(([extension, mimeType]) => ({
    name: `qa-relogin.${extension}`,
    mimeType,
    buffer: readFileSync(new URL(`fixtures/submission-files/sample.${extension}`, import.meta.url)),
  }));
  await enrolled.page.goto(base + route);
  await enrolled.page.locator("#student-files").setInputFiles(fixtures);
  await expect(main(enrolled.page)).toContainText("qa-relogin.docx berhasil disimpan");
  await button(main(enrolled.page), "Simpan Draf").click();
  await expect(main(enrolled.page)).toContainText("Draf tersimpan di server.");
  await enrolled.page.reload();
  await expect(main(enrolled.page)).toContainText("qa-relogin.pdf");
  const uploads = (await database.query(`SELECT id, "originalName", checksum, "sizeBytes", "storageBackend", status
    FROM "SubmissionUpload" WHERE "eventId" = $1 AND "studentId" = $2 AND "milestoneId" = 'M1'`, [eventId, enrolled.studentId])).rows;
  assert.equal(uploads.length, fixtures.length);
  for (const fixture of fixtures) {
    const metadata = uploads.find(upload => upload.originalName === fixture.name);
    assert(metadata);
    assert.equal(metadata.checksum, createHash("sha256").update(fixture.buffer).digest("hex"));
    assert.equal(Number(metadata.sizeBytes), fixture.buffer.length);
    assert.equal(metadata.status, "READY");
    assert.equal(metadata.storageBackend, "local");
  }
  const download = `/api/attachments/${uploads[0].id}/download`;
  await api(other.ctx, "GET", download, undefined, 403);
  await logout(enrolled.page);
  await api(enrolled.ctx, "GET", download, undefined, 401);
  await login(enrolled.page, email, newPassword, "siswa");
  await enrolled.page.goto(base + route);
  for (const fixture of fixtures) {
    await expect(main(enrolled.page)).toContainText(fixture.name);
    const saved = uploads.find(upload => upload.originalName === fixture.name);
    const response = await enrolled.ctx.request.get(base + `/api/attachments/${saved.id}/download`);
    assert.equal(response.status(), 200);
    assert.deepEqual(await response.body(), fixture.buffer);
  }
  pass("PRIVATE-FILE-PERSISTENCE-AFTER-RELOGIN");
}

function dashboardCard(page, eventTitle = title) {
  return main(page).getByRole("heading", { name: eventTitle, exact: true, level: 3 })
    .locator("..").and(page.locator("section"));
}

async function checkPortfolio(student) {
  await student.page.goto(base + "/siswa/portfolio");
  const card = main(student.page).getByRole("heading", { name: title, exact: true }).locator("..");
  await expect(card).toContainText("3 dari 3 milestone terkumpul");
  await link(card, "Lihat Karya").click();
  await expect(main(student.page).getByRole("heading", { name: title, exact: true })).toBeVisible();
  pass("UAT-49");
  await student.page.goto(base + `/siswa/portfolio?event=${eventId}&view=project`);
  for (const i of [1, 2, 3]) {
    const milestone = main(student.page).getByRole("heading", { name: `Tahap ${i}`, exact: true })
      .locator("xpath=ancestor::section[1]");
    await expect(milestone).toContainText("Nilai: 80");
    await expect(milestone).toContainText("Sudah dinilai");
  }
  await main(student.page).getByRole("button", { name: "Lihat Pengumpulan", exact: true }).first().click();
  const history = student.page.getByRole("dialog", { name: "Riwayat Pengumpulan" });
  await expect(history).toContainText("Versi 1");
  await expect(history).toContainText("Versi 2");
  await button(history, "Tutup").last().click();
  pass("UAT-50");
}

async function checkResponsive(student, enrolled) {
  const views = [
    [student, "/siswa/dashboard", /^Selamat (pagi|siang|sore|malam), Dimas$/],
    [student, "/siswa/events", "Jelajah Event"],
    [student, `/siswa/events?event=${eventId}`, title],
    [student, `/siswa/workspace?event=${eventId}&milestone=M1`, title],
    [enrolled, `/siswa/workspace?event=${eventId}&milestone=M1`, title],
    [student, "/siswa/portfolio", "Portofolio Pribadi"],
    [student, `/siswa/portfolio?event=${eventId}&view=project`, title],
    [student, "/siswa/profile", "Profil"],
  ];
  for (const width of [320, 375, 768, 1024, 1440]) {
    await Promise.all([student, enrolled].map(({ page }) => page.setViewportSize({ width, height: 900 })));
    for (const [actor, route, heading] of views) {
      await actor.page.goto(base + route);
      await expect(main(actor.page).getByRole("heading", { name: heading, exact: true, level: 1 })).toBeVisible();
      if (actor === enrolled) await expect(button(main(actor.page), "Pilih File")).toBeVisible();
      await actor.page.evaluate(() => document.fonts.ready);
      await assertNoOverflow(actor.page, route, width);
    }
    await student.page.goto(base + "/siswa/dashboard");
    await button(student.page, "Lihat hasil Asesmen UI/UX").click();
    await student.page.locator('[data-assessment-type="uiux"]').getByRole("button", { name: /^Lihat detail / }).first().click();
    await expect(student.page.getByRole("dialog")).toBeVisible();
    await assertNoOverflow(student.page, "modal asesmen UI/UX", width);
    await button(student.page, "Tutup detail").click();
    pass(`RESPONSIVE-${width}`);
  }
}

async function assertNoOverflow(page, view, width) {
  const actual = await page.evaluate(() => document.documentElement.scrollWidth);
  assert(actual <= width + 1, `${view} at ${width}px uses ${actual}px`);
}

async function observeStage(teacher, student, stage, completed, state, { revision = false } = {}) {
  const [progress, report] = await Promise.all([
    api(student.ctx, "GET", "/api/progress"),
    api(teacher.ctx, "GET", `/api/reports?event=${eventId}&milestone=M1`),
  ]);
  const own = progress.events.find(event => event.eventId === eventId);
  assert(own);
  const reportProgress = report.reports[0].rows.find(row => row.student.id === "dimas").eventProgress;
  assert.equal(reportProgress.completed, completed);
  assert.equal(reportProgress.total, 3);
  assert.equal(reportProgress.status, state);
  assert.equal(own.rows[0].completed, completed);
  assert.equal(own.rows[0].hasOpenRevision, revision);
  assert.equal(own.finished, state === "complete" ? 1 : 0);
  assert.equal(own.rows[0].score, reportProgress.score);

  await student.page.goto(base + "/siswa/dashboard");
  const card = dashboardCard(student.page);
  await expect(card).toBeVisible();
  await expect(card).toContainText(`${completed} dari 3 milestone`);
  const badge = await card.locator("span").first().innerText();
  await student.page.goto(base + `/siswa/portfolio?event=${eventId}&view=project`);
  await expect(main(student.page).getByRole("heading", { name: title, exact: true })).toBeVisible();
  const portfolioBadges = await main(student.page).locator("header span").allTextContents();
  await teacher.page.goto(base + "/guru/dashboard");
  await main(teacher.page).getByPlaceholder("Cari event").fill(title);
  await expect(teacher.page.getByRole("article", { name: title })).toContainText(`${own.finished} dari 1 siswa selesai`);
  await teacher.page.goto(base + `/guru/monitoring?event=${eventId}`);
  const monitoringRow = teacher.page.getByRole("row").filter({ hasText: "Dimas Saputra" });
  await expect(monitoringRow).toBeVisible();
  if (revision) await expect(monitoringRow).toContainText("Revisi diminta");
  const label = { working: "Dalam pengerjaan", awaitingAssessment: "Menunggu penilaian", complete: "Selesai" }[state];
  await expect(monitoringRow).toContainText(label);
  statuses.push({ stage, completed, state, score: reportProgress.score, dashboard: badge, portfolio: portfolioBadges, revision });
  if (!baseline) {
    assert.equal(badge, label);
    assert(portfolioBadges.includes(label));
    await student.page.goto(base + `/siswa/workspace?event=${eventId}&milestone=M1`);
    await expect(main(student.page).locator("header")).toContainText(label);
  }
  if (stage === 3 || stage === 5) {
    await student.page.goto(base + "/siswa/dashboard");
    await button(main(student.page), "Selesai").click();
    if (!baseline) await expect(dashboardCard(student.page)).toHaveCount(0);
    else statuses.at(-1).shownUnderCompletedFilter = await dashboardCard(student.page).count() > 0;
    await button(main(student.page), "Aktif").click();
    if (!baseline) await expect(dashboardCard(student.page)).toBeVisible();
  }
  if (stage === 4 || stage === 6) {
    await student.page.goto(base + "/siswa/dashboard");
    await button(main(student.page), "Selesai").click();
    await expect(dashboardCard(student.page)).toBeVisible();
  }
}

try {
  const teacher = await context(), dimas = await context(), aisyah = await context();
  await Promise.all([
    login(teacher.page, "rina.guru", teacherPassword, "guru"),
    login(dimas.page, "dimas", dimasPassword, "siswa"),
    login(aisyah.page, "aisyah", aisyahPassword, "siswa"),
  ]);
  await checkLifecycle(teacher, dimas, aisyah);
  const lesson = eventForm(eventId, title);
  await stageEvent(teacher.ctx, lesson, { requireSurvey: true });
  await api(dimas.ctx, "POST", `/api/events/${eventId}/enrollments`, {});
  const row = (await api(teacher.ctx, "GET", "/api/workspace")).rubrics.uiux;
  const work = (text, expectedVersion = 0) => ({ work: { files: [], text, link: "" }, expectedVersion, requestId: randomUUID() });
  const submissions = index => `/api/events/${eventId}/milestones/M${index}/submissions`;
  const grades = (id, version, value) => api(teacher.ctx, "PUT", `/api/submissions/${id}/assessment`, {
    version, expectedRevision: 0, requestId: randomUUID(),
    scores: Object.fromEntries(row.criteria.map(criterion => [criterion.id, value])),
  });

  await dimas.page.goto(base + `/siswa/workspace?event=${eventId}&milestone=M2`);
  await expect(main(dimas.page)).toContainText("Milestone masih terkunci");
  const blockedTask = await api(dimas.ctx, "POST", submissions(2), work("Belum bisa terkirim"), 409);
  assert.equal(blockedTask.error.code, "MILESTONE_LOCKED");
  await dimas.page.goto(base + `/siswa/workspace?event=${eventId}&milestone=M1`);
  await button(main(dimas.page), "Kumpulkan Milestone 1").click();
  await expect(main(dimas.page).getByRole("alert")).toContainText(/Tambahkan|Isi|lampiran/i);
  assert.equal((await api(dimas.ctx, "GET", submissions(1))).submissions.length, 0);
  pass("UAT-39");
  const first = await api(dimas.ctx, "POST", submissions(1), work("Naskah literasi tahap pertama"), 201);
  const blockedSurvey = await api(dimas.ctx, "POST", submissions(2), work("Survei belum selesai"), 409);
  assert.equal(blockedSurvey.error.code, "MILESTONE_LOCKED");
  await dimas.page.goto(base + `/siswa/workspace?event=${eventId}&milestone=M2`);
  await expect(main(dimas.page)).toContainText("Milestone masih terkunci");
  await api(dimas.ctx, "POST", `/api/events/${eventId}/milestones/M1/survey`, { first: 4, second: 5, reflection: "Refleksi fiktif" }, 201);
  await dimas.page.goto(base + `/siswa/workspace?event=${eventId}&milestone=M2`);
  await expect(main(dimas.page).locator("#student-work-text")).toBeVisible();
  pass("SEQUENTIAL");
  await observeStage(teacher, dimas, 1, 1, "working");
  pass("UAT-37");
  const second = await api(dimas.ctx, "POST", submissions(2), work("Naskah literasi tahap kedua"), 201);
  await observeStage(teacher, dimas, 2, 2, "working");
  const third = await api(dimas.ctx, "POST", submissions(3), work("Naskah literasi tahap ketiga"), 201);
  await grades(first.submissionId, 1, 5);
  await observeStage(teacher, dimas, 3, 3, "awaitingAssessment");
  await grades(second.submissionId, 1, 4);
  await grades(third.submissionId, 1, 4);
  await observeStage(teacher, dimas, 4, 3, "complete");
  const teacherOverview = await api(teacher.ctx, "GET", "/api/progress");
  assert.equal(teacherOverview.events.find(item => item.eventId === eventId).finished, 1);
  await api(teacher.ctx, "POST", `/api/submissions/${first.submissionId}/feedback`, {
    id: randomUUID(), version: 1, message: "Rapikan rujukan literasi khusus Dimas.", revision: true,
  }, 201);
  await observeStage(teacher, dimas, 5, 3, "awaitingAssessment", { revision: true });
  await dimas.page.goto(base + "/siswa/dashboard");
  await expect(link(main(dimas.page), "Unggah Revisi").first()).toBeVisible();
  await dimas.page.goto(base + `/siswa/workspace?event=${eventId}&milestone=M1`);
  await expect(main(dimas.page)).toContainText("Rapikan rujukan literasi khusus Dimas.");
  const revised = await api(dimas.ctx, "POST", submissions(1), work("Versi kedua dengan rujukan", 1), 201);
  assert.equal(revised.version, 2);
  await grades(first.submissionId, 2, 4);
  await observeStage(teacher, dimas, 6, 3, "complete");
  if (!baseline) {
    pass("UAT-40");
    pass("UAT-41");
  }
  const record = (await api(dimas.ctx, "GET", `/api/submissions/${first.submissionId}`));
  assert.equal(record.submission.versions.length, 2);
  assert.deepEqual(record.assessments.map(item => item.version).sort(), [1, 2]);
  assert(record.feedback.some(item => item.version === 1 && item.revision));
  await api(aisyah.ctx, "GET", `/api/submissions/${first.submissionId}`, undefined, 403);
  await api(aisyah.ctx, "POST", submissions(1), work("Tidak punya enrollment"), 403);
  await api(aisyah.ctx, "PUT", `/api/submissions/${first.submissionId}/assessment`, { version: 2, expectedRevision: 0, scores: {}, requestId: randomUUID() }, 403);
  assert((await api(aisyah.ctx, "GET", submissions(1))).submissions.length === 0);
  pass("REVISION-AND-REASSESSMENT");
  if (!baseline) {
    await checkPortfolio(dimas);
    const fresh = await checkRegistrationAndDiscovery(teacher);
    await api(fresh.ctx, "GET", `/api/submissions/${first.submissionId}`, undefined, 403);
    await checkPrivateFileAfterRelogin(fresh, aisyah);
    await checkResponsive(dimas, fresh);
  }
  if (baseline) {
    await dimas.page.goto(base + "/siswa/dashboard");
    await dimas.page.screenshot({ path: path.join(output, "baseline-dashboard.png"), fullPage: true });
  }
} finally {
  writeFileSync(path.join(output, "results.json"), JSON.stringify({ baseline, checks, statuses, lifecycle, runtimeErrors, browserErrors }, null, 2));
  await browser.close();
  await database.end();
}
assert.deepEqual(runtimeErrors, []);
assert.deepEqual(browserErrors, []);
