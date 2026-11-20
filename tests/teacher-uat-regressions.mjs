import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { requireDevelopmentDatabase } from "../prisma/development-safety.ts";

const database = requireDevelopmentDatabase(process.env);
assert(database.databaseName.startsWith("bojong_united_test"));
const base = process.env.AUDIT_BASE_URL ?? "http://localhost:3000";
assert(["127.0.0.1", "localhost"].includes(new URL(base).hostname));
const baseline = process.argv.includes("--baseline");
const output = process.env.AUDIT_OUTPUT_DIR ?? path.join(os.tmpdir(), "lugina-teacher-uat-regressions");
mkdirSync(output, { recursive: true });
const require = createRequire(import.meta.url);
const { chromium, expect } = require(process.env.PLAYWRIGHT_MODULE ?? "@playwright/test");
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL ?? "msedge", headless: true });
const passwords = [process.env.TEST_TEACHER_PASSWORD, process.env.TEST_DIMAS_PASSWORD, process.env.TEST_AISYAH_PASSWORD];
const eventId = "teacher-uat-" + randomUUID();
const title = "Desain Portal Ekstrakurikuler";
const checks = {};
const errors = [];
const reportPath = "/guru/reports?event=" + eventId;
const workPath = "/guru/work?event=" + eventId + "&student=";
const monitoringPath = "/guru/monitoring?event=" + eventId;
const button = (page, name) => page.getByRole("button", { name, exact: true });
async function api(context, method, route, data, status = 200) {
  const response = await context.request.fetch(base + route, {
    method, headers: { Origin: base }, ...(data ? { data } : {}),
  });
  assert.equal(response.status(), status, method + " " + route);
  return response.json();
}
async function login(identifier, password, role, inspectIcons = false) {
  assert(password);
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const page = await context.newPage();
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(base + "/login");
  await page.locator("#login-email").fill(identifier);
  await page.locator("#login-password").fill(password);
  if (inspectIcons) {
    const toggle = button(page, "Tampilkan kata sandi");
    checks.loginHasEyeAsset = await toggle.locator("img, svg").count() > 0;
    if (!baseline) {
      await expect(toggle.locator("img")).toBeVisible();
      await expect.poll(() => toggle.locator("img").evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
      await expect(page.locator("svg[data-auth-input-icon]")).toHaveCount(2);
    }
    await toggle.press("Enter");
    await expect(page.locator("#login-password")).toHaveAttribute("type", "text");
    await button(page, "Sembunyikan kata sandi").press("Space");
    await expect(page.locator("#login-password")).toHaveAttribute("type", "password");
    await page.locator("#login-password").fill("");
    await page.screenshot({ path: path.join(output, "login-icons.png") });
    await page.locator("#login-password").fill(password);
  }
  await button(page, "Masuk").click();
  await page.waitForURL("**/" + role + "/dashboard");
  const greeting = role === "guru" ? /^Selamat (pagi|siang|sore|malam), Rina$/ : identifier === "dimas" ? /^Selamat (pagi|siang|sore|malam), Dimas$/ : /^Selamat (pagi|siang|sore|malam), Aisyah$/;
  await expect(page.getByRole("heading", { name: greeting, exact: true })).toBeVisible();
  return { context, page };
}
const milestone = (number) => ({ id: "M" + number, title: "Tahap " + number, instructions: "Dokumentasikan langkah kerja.", formats: "Teks, PDF", deadline: "2099-12-30T23:59", surveyActive: false });
const event = {
  id: eventId, title, status: "draft", mode: "Penyelesaian", updated: "2026-11-19", period: "Belum diatur",
  startAt: "2026-01-01T08:00", endAt: "2099-12-31T23:59", caseStudyHtml: "<p>Rancang portal sekolah.</p>", rubricId: "uiux",
  milestones: [1, 2, 3].map(milestone),
  wizard: { step: "information", selectedMilestoneId: "M1", modeChosen: true },
  certificateConfig: { mode: "details", threshold: "75", name: "Dokumen belajar", organizer: "Sekolah", issuedAt: "2026-11-19", signer: "Guru", signerRole: "Pengampu", description: "", positions: { student: { x: 50, y: 45 }, event: { x: 50, y: 58 }, date: { x: 17, y: 78 }, score: { x: 83, y: 78 } } },
};

try {
  const teacher = await login("rina.guru", passwords[0], "guru", true);
  const dimas = await login("dimas", passwords[1], "siswa");
  const aisyah = await login("aisyah", passwords[2], "siswa");
  const { page: tp, context: tc } = teacher;
  const saveShot = name => tp.screenshot({ path: path.join(output, name + ".png") });
  const draft = await api(tc, "POST", "/api/events", { event }, 201);
  await tp.goto(base + "/guru/events/create?draft=" + eventId);
  await expect(tp.locator("#event-title")).toHaveValue(title);
  const modeControl = tp.getByRole("radio", { name: /Mode Penyelesaian/ });
  if (baseline) {
    await expect(modeControl).toBeChecked();
  } else {
    await expect(modeControl).toHaveCount(0);
    await expect(tp.getByText("Mode Penyelesaian", { exact: true })).toHaveCount(0);
    await tp.locator("#event-title").fill(title + " Sekolah");
    await tp.screenshot({ path: path.join(output, "information-no-mode-control.png"), fullPage: true });
  }
  const draftNotice = tp.getByRole("status").filter({ hasText: "Draf tersimpan di PostgreSQL." });
  await button(tp, "Simpan Draf").click();
  await expect(draftNotice).toBeVisible();
  checks.draftNoticeFixed = await draftNotice.evaluate(el => getComputedStyle(el).position === "fixed");
  if (!baseline) {
    await expect(draftNotice).toBeInViewport();
    await button(draftNotice, "Tutup notifikasi").click();
    await tp.reload();
    await expect(tp.locator("#event-title")).toHaveValue(title + " Sekolah");
    const updatedDraft = (await api(tc, "GET", "/api/events/" + eventId)).event;
    assert.equal(updatedDraft.mode, "Penyelesaian");
    assert.equal(updatedDraft.wizard.modeChosen, true);
    checks.legacyDraftEditableWithoutMode = true;
    await tp.locator("#event-title").fill(title);
    await button(tp, "Simpan Draf").click();
    await expect(draftNotice).toBeInViewport();
    await tp.route("**/api/events/" + eventId, async route => {
      if (route.request().method() !== "PUT") return route.continue();
      return route.fulfill({ status: 503, json: { error: { message: "Penyimpanan QA tidak tersedia." } } });
    });
    await button(tp, "Simpan Draf").click();
    await expect(tp.getByRole("alert").filter({ hasText: "Penyimpanan draf belum bisa dikonfirmasi." })).toBeInViewport();
    await expect(draftNotice).toHaveCount(0);
    await tp.unroute("**/api/events/" + eventId);
  }
  await tp.goto(base + "/guru/events/create?draft=" + eventId + "&step=certificate");
  const description = tp.locator("#cert-description");
  await expect(description).toBeVisible();
  checks.certificateClientLimit = await description.getAttribute("maxlength");
  if (!baseline) {
    await expect(description).toHaveAttribute("maxlength", "5000");
    await description.fill("a".repeat(5000));
    await expect(tp.getByText("5.000 / 5.000 karakter.", { exact: false })).toBeVisible();
    await expect(tp.getByText("Pengampu", { exact: true }).last()).toBeInViewport();
    const draftForLimit = (await api(tc, "GET", "/api/events/" + eventId)).event;
    await api(tc, "PUT", "/api/events/" + eventId, {
      event: { ...draftForLimit, certificateConfig: { ...draftForLimit.certificateConfig, description: "a".repeat(5001) } },
    }, 400);
  }
  const stored = (await api(tc, "GET", "/api/events/" + draft.id)).event;
  await api(tc, "POST", "/api/events/" + eventId + "/publish", { event: stored });
  if (!baseline) {
    await tp.goto(base + "/guru/events?event=" + eventId);
    await expect(tp.getByRole("heading", { name: title, exact: true })).toBeVisible();
    await button(tp, "Ubah deadline Tahap 1").click();
    const deadlineDialog = tp.getByRole("dialog");
    const newDeadline = "2099-12-29T23:59";
    await deadlineDialog.getByLabel("Deadline (WIB)").fill(newDeadline);
    await button(deadlineDialog, "Simpan deadline").click();
    await expect(deadlineDialog).toHaveCount(0);
    const publishedEvent = (await api(tc, "GET", "/api/events/" + eventId)).event;
    assert.equal(publishedEvent.milestones[0].deadline, newDeadline);
    assert.equal(publishedEvent.mode, "Penyelesaian");
    checks.legacyPublishedEventEditable = true;
  }
  for (const { context } of [dimas, aisyah]) await api(context, "POST", "/api/events/" + eventId + "/enrollments", {});
  const ws = await api(tc, "GET", "/api/workspace");
  const score = value => Object.fromEntries(ws.rubrics.uiux.criteria.map(criterion => [criterion.id, value]));
  async function submit(context, m, expectedVersion = 0) {
    return api(context, "POST", "/api/events/" + eventId + "/milestones/M" + m + "/submissions", {
      work: { files: [], text: "Catatan kerja fiktif tahap " + m, link: "" }, expectedVersion, requestId: randomUUID(),
    }, 201);
  }
  async function assess(submission, value, version = 1) {
    return api(tc, "PUT", "/api/submissions/" + submission + "/assessment", {
      version, expectedRevision: 0, scores: score(value), requestId: randomUUID(),
    });
  }
  const d1 = (await submit(dimas.context, 1)).submissionId;
  const a1 = (await submit(aisyah.context, 1)).submissionId;
  await tp.goto(base + monitoringPath + "&student=dimas&milestone=M1");
  for (const criterion of ws.rubrics.uiux.criteria) await button(tp, criterion.title + " skor 1").click();
  if (!baseline) {
    const gradePath = "**/api/submissions/" + d1 + "/assessment";
    await tp.route(gradePath, route => route.fulfill({ status: 503, json: { error: { message: "Penilaian QA tidak tersedia." } } }));
    await button(tp, "Simpan Penilaian").click();
    await expect(tp.getByRole("alert").filter({ hasText: "Penyimpanan penilaian belum bisa dikonfirmasi." })).toBeInViewport();
    await expect(tp.getByRole("status").filter({ hasText: "Penilaian tersimpan di server." })).toHaveCount(0);
    await tp.unroute(gradePath);
  }
  await button(tp, "Simpan Penilaian").click();
  const gradeNotice = tp.getByRole("status").filter({ hasText: "Penilaian tersimpan di server." });
  await expect(gradeNotice).toBeVisible();
  checks.gradeNoticeFixed = await gradeNotice.evaluate(el => getComputedStyle(el).position === "fixed");
  if (!baseline) await expect(gradeNotice).toBeInViewport();
  await tp.getByRole("textbox", { name: "Pesan feedback" }).fill("Perbaiki navigasi portal.");
  await button(tp, "Minta Revisi").click();
  const details = tp.locator("main");
  await expect(details.getByText("Revisi diminta", { exact: true }).first()).toBeVisible();
  await tp.reload();
  await expect(details.getByText("Revisi diminta", { exact: true }).first()).toBeVisible();
  const statusBar = details.locator("p").filter({ hasText: /^Deadline / }).first().locator("..");
  checks.revisionStatusHeader = await statusBar.innerText();
  await saveShot("revision-status");
  const revised = await api(tc, "GET", "/api/submissions/" + d1);
  assert.equal(revised.assessments[0].version, 1);
  assert(revised.feedback.some(item => item.revision && item.message === "Perbaiki navigasi portal."));
  await api(aisyah.context, "GET", "/api/submissions/" + d1, undefined, 403);
  await dimas.page.goto(base + "/siswa/workspace?event=" + eventId + "&milestone=M1");
  await expect(dimas.page.locator("main")).toContainText("Perbaiki navigasi portal.");
  await tp.goto(base + monitoringPath);
  const dimasRow = tp.getByRole("row").filter({ hasText: "Dimas Saputra" });
  await expect(dimasRow).toBeVisible();
  checks.monitoringRevisionRow = await dimasRow.innerText();
  await tp.goto(base + workPath + "aisyah");
  await expect(tp.getByRole("heading", { name: "Tahap 1" })).toBeVisible();
  checks.initialAppearsAsRevision = await tp.getByText(/Riwayat revisi/i).count() > 0;
  await saveShot("student-work-initial");
  await assess(a1, 5);
  await tp.goto(base + reportPath + "&milestone=M1");
  const aisyahRow = tp.getByRole("row").filter({ hasText: "Aisyah Putri" });
  await expect(aisyahRow).toBeVisible();
  checks.oneOfThreeFiltered = await aisyahRow.innerText();
  const a2 = (await submit(aisyah.context, 2)).submissionId;
  await tp.goto(base + reportPath);
  await expect(aisyahRow).toContainText("2 dari 3");
  checks.twoOfThree = await aisyahRow.innerText();
  const a3 = (await submit(aisyah.context, 3)).submissionId;
  await tp.reload();
  await expect(aisyahRow).toContainText("3 dari 3");
  checks.threeSubmittedOneGraded = await aisyahRow.innerText();
  await saveShot("progress-partial");
  await assess(a2, 4);
  await assess(a3, 4);
  await tp.reload();
  await expect(aisyahRow).toContainText("Selesai");
  await expect(aisyahRow).toContainText("87");
  checks.threeAssessed = await aisyahRow.innerText();
  await tp.getByLabel("Siswa", { exact: true }).selectOption("aisyah");
  await button(tp, "Tampilkan").click();
  await expect(dimasRow).toHaveCount(0);
  await tp.getByLabel("Siswa", { exact: true }).selectOption("all");
  await button(tp, "Tampilkan").click();
  await expect(dimasRow).toBeVisible();
  checks.allStudents = await tp.locator("tbody tr").count();
  assert.equal(checks.allStudents, 2);
  for (const [label, suffix] of [["Unduh Excel", ".xlsx"], ["Unduh PDF", ".pdf"]]) {
    const download = tp.waitForEvent("download");
    await button(tp, label).click();
    const file = await download;
    assert(file.suggestedFilename().endsWith(suffix));
    await file.saveAs(path.join(output, "report" + suffix));
  }
  await tp.goto(base + reportPath + "&work=complete&assessment=none&milestone=M1");
  await expect(tp.getByRole("heading", { name: title, exact: true })).toBeVisible();
  checks.combinedFilterRows = await tp.locator("tbody tr").count();
  if (!baseline) {
    await expect(tp.getByText("Tidak ada peserta yang sesuai filter laporan.")).toBeVisible();
    await button(tp, "Hapus filter lain").click();
    await expect(tp.locator("tbody tr")).toHaveCount(2);
    assert.equal(new URL(tp.url()).searchParams.get("event"), eventId);
  }
  await submit(dimas.context, 1, 1);
  await tp.goto(base + workPath + "dimas");
  await expect(tp.getByRole("heading", { name: "Tahap 1" })).toBeVisible();
  if (!baseline) {
    await tp.getByText("Riwayat pengumpulan (1 revisi)").click();
    await expect(tp.getByText(/Pengumpulan awal/)).toBeVisible();
    await expect(tp.getByText(/Revisi versi 2/)).toBeVisible();

    const assessmentPage = (student, milestone) => base + monitoringPath + "&student=" + student + "&milestone=" + milestone;
    const nextMilestone = tp.getByRole("link", { name: "Milestone berikutnya", exact: true });
    const nextStudent = tp.getByRole("link", { name: "Siswa berikutnya", exact: true });
    const milestoneHeading = (number) => tp.locator("main header").getByText(new RegExp("Milestone " + number + ": Tahap " + number));
    async function verifySelection(student, milestone, name) {
      await expect(tp).toHaveURL(assessmentPage(student, "M" + milestone));
      await expect(tp.getByRole("heading", { name, exact: true })).toBeVisible();
      await expect(milestoneHeading(milestone)).toBeVisible();
    }

    for (const [submissionId, message] of [[a1, "Feedback khusus tahap pertama"], [a2, "Feedback khusus tahap kedua"]]) {
      await api(tc, "POST", "/api/submissions/" + submissionId + "/feedback", {
        id: randomUUID(), version: 1, message, revision: false,
      }, 201);
    }
    await tp.goto(assessmentPage("aisyah", "M1"));
    await verifySelection("aisyah", 1, "Aisyah Putri");
    await expect(details).toContainText("Catatan kerja fiktif tahap 1");
    await expect(details).toContainText("Feedback khusus tahap pertama");
    await expect(details.getByText("100 / 100", { exact: true })).toBeVisible();
    await nextMilestone.click();
    await verifySelection("aisyah", 2, "Aisyah Putri");
    await expect(details).toContainText("Catatan kerja fiktif tahap 2");
    await expect(details).toContainText("Feedback khusus tahap kedua");
    await expect(details).not.toContainText("Feedback khusus tahap pertama");
    await expect(details.getByText("80 / 100", { exact: true })).toBeVisible();
    await nextMilestone.click();
    await verifySelection("aisyah", 3, "Aisyah Putri");
    await expect(nextMilestone).toHaveCount(0);
    await expect(details.getByText("Milestone terakhir", { exact: true })).toBeVisible();
    await expect(nextStudent).toBeVisible();

    await tp.goBack();
    await verifySelection("aisyah", 2, "Aisyah Putri");
    await tp.goForward();
    await verifySelection("aisyah", 3, "Aisyah Putri");
    await tp.reload();
    await verifySelection("aisyah", 3, "Aisyah Putri");
    await expect(details).toContainText("Catatan kerja fiktif tahap 3");
    await expect(details).not.toContainText("Feedback khusus tahap kedua");

    await tp.goto(assessmentPage("dimas", "M1"));
    await verifySelection("dimas", 1, "Dimas Saputra");
    await nextStudent.click();
    await verifySelection("aisyah", 1, "Aisyah Putri");
    await tp.goto(assessmentPage("dimas", "M1"));
    for (const width of [320, 375, 768, 1024, 1440]) {
      await tp.setViewportSize({ width, height: 900 });
      await expect(nextStudent).toBeVisible();
      await expect(nextMilestone).toBeVisible();
      assert(await tp.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Assessment overflows viewport " + width);
    }
    await tp.setViewportSize({ width: 320, height: 900 });
    await nextMilestone.click();
    await verifySelection("dimas", 2, "Dimas Saputra");
    await expect(details).not.toContainText("Feedback khusus tahap kedua");
    await expect(details.getByText("Belum dikumpulkan", { exact: true }).first()).toBeVisible();
    await saveShot("monitoring-navigation-320");
    await tp.setViewportSize({ width: 1440, height: 900 });
    await saveShot("monitoring-navigation-1440");
    checks.nextStudentAndMilestoneNavigation = true;

    assert(checks.loginHasEyeAsset && checks.gradeNoticeFixed && checks.draftNoticeFixed);
    assert(!checks.revisionStatusHeader.includes("Belum dinilai"));
    assert(checks.monitoringRevisionRow.includes("Revisi diminta") && !checks.monitoringRevisionRow.includes("Belum dinilai"));
    assert(!checks.initialAppearsAsRevision);
    assert(checks.oneOfThreeFiltered.includes("1 dari 3") && checks.oneOfThreeFiltered.includes("Dalam pengerjaan"));
    assert(checks.twoOfThree.includes("Dalam pengerjaan"));
    assert(checks.threeSubmittedOneGraded.includes("Menunggu penilaian"));
    for (const width of [320, 768, 1440]) {
      await tp.setViewportSize({ width, height: 900 });
      await tp.goto(base + reportPath);
      await expect(aisyahRow).toBeVisible();
      assert(await tp.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Report overflows viewport " + width);
    }
  }
} catch (error) {
  checks.failure = String(error).split("\n")[0];
  throw error;
} finally {
  writeFileSync(path.join(output, "results.json"), JSON.stringify({ baseline, checks, errors }, null, 2));
  await browser.close();
}
assert.deepEqual(errors, []);
console.log("Teacher UAT " + (baseline ? "baseline measurements completed" : "regressions passed"));
