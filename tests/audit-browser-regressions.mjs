import assert from "node:assert/strict";
import { createRequire, Module } from "node:module";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import os from "node:os";

const require = createRequire(import.meta.url);
const { chromium, expect } = require(
  process.env.PLAYWRIGHT_MODULE || "@playwright/test",
);
const ts = require("typescript");
Module._extensions[".ts"] = (module, filename) =>
  module._compile(
    ts.transpileModule(readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText,
    filename,
  );
const { readEventStore } = require("../src/lib/guru/event-draft-store.ts");
const { managedEvents } = require("../src/lib/guru/event-data.ts");
const state = { ...structuredClone(readEventStore()), version: 1 };
const eventId = "round2-regression-event",
  milestoneId = "5820e400-e29b-41d4-a716-446655440000";
const event = {
  ...managedEvents[0],
  id: eventId,
  title: "Event Regresi Fiktif Round 2",
  startAt: "2026-11-01T08:00",
  endAt: "2027-01-31T23:59",
  milestones: [{ ...managedEvents[0].milestones[0], id: milestoneId }],
};
state.published[eventId] = event;
state.learning.enrollments = Array.from({ length: 40 }, (_, i) => ({
  id: `${eventId}-${i ? "fictional-" + i : "dimas"}`,
  eventId,
  studentId: i ? `fictional-${i}` : "dimas",
  method: "self",
}));
state.learning.students = state.learning.enrollments.slice(1).map((e, i) => ({
  id: e.studentId,
  name: `Peserta Fiktif ${String(i + 1).padStart(2, "0")} ${"NamaPanjang".repeat(i === 38 ? 15 : 0)}`.trim(),
  email: `fictional${i}@example.com`,
}));
const submissionId = `${eventId}:dimas:${milestoneId}`;
state.learning.submissions = {
  [submissionId]: {
    id: submissionId,
    eventId,
    studentId: "dimas",
    milestoneId,
    surveyComplete: false,
    versions: [
      {
        version: 1,
        submittedAt: "2026-11-08T09:00",
        file: "old-demo.pdf",
        scores: Object.fromEntries(
          state.rubrics.uiux.criteria.map((c) => [c.id, 4]),
        ),
      },
      { version: 2, submittedAt: "2026-11-09T09:00", file: "new-demo.pdf" },
    ],
  },
};

const output =
  process.env.AUDIT_OUTPUT_DIR ||
  path.join(os.tmpdir(), "lugina-final-audit-round-2", "regressions");
mkdirSync(output, { recursive: true });
const base = process.env.AUDIT_BASE_URL || "http://localhost:3000",
  errors = [],
  failed = [],
  checks = [];
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL || "msedge",
  headless: true,
});
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1024 },
    acceptDownloads: true,
  });
  await context.addInitScript((fixture) => {
    if (!sessionStorage.getItem("round2-fixture")) {
      sessionStorage.setItem(
        "lugina.teacher.event-drafts.v1",
        JSON.stringify(fixture),
      );
      sessionStorage.setItem("round2-fixture", "yes");
    }
  }, state);
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("response", (r) => {
    if (r.status() >= 400) failed.push([r.url(), r.status()]);
  });
  const main = () => page.locator("main:visible").last(),
    button = (name, root = main()) =>
      root.getByRole("button", { name, exact: true });
  const go = async (url) => {
    await page.goto(base + url);
    await main().waitFor();
  };
  const shot = async (name) => {
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: path.join(output, `${name}.png`),
      fullPage: true,
    });
  };
  const ok = (id, detail) => {
    checks.push({ id, detail, status: "PASS" });
    console.log("PASS", id, detail);
  };
  async function login(role) {
    await go("/login");
    await page
      .locator("#login-email")
      .fill(role === "teacher" ? "rina.guru" : "dimas");
    await page
      .locator("#login-password")
      .fill(role === "teacher" ? process.env.TEST_TEACHER_PASSWORD : process.env.TEST_DIMAS_PASSWORD);
    await button("Masuk").click();
    await page.waitForURL(
      role === "teacher" ? "**/guru/dashboard" : "**/siswa/dashboard",
    );
  }
  async function surveyCount() {
    await go("/guru/dashboard");
    return Number(
      await main()
        .locator('section[aria-labelledby="survey-title"] span')
        .first()
        .innerText(),
    );
  }
  await login("teacher");
  await go(`/guru/reports?event=${eventId}&work=working`);
  await expect(main().locator("tbody tr")).toHaveCount(1);
  await expect(
    main().locator("tbody").getByText("Dalam pengerjaan", { exact: true }),
  ).toBeVisible();
  await expect(
    main().locator("tbody").getByText("Belum dinilai", { exact: true }),
  ).toBeVisible();
  await expect(main().locator("thead")).toContainText("M1 (tugas");
  assert(!(await main().innerText()).includes(milestoneId));
  await shot("report-working-zero-grade-readable-label");
  ok(
    "B01/B03/B08",
    "Submitted + survey-incomplete learner stays in working filter; zero latest grades; UUID hidden.",
  );
  await go(`/guru/work?event=${eventId}`);
  const row = main().locator("tbody tr").filter({ hasText: "Dimas Saputra" });
  await expect(row.getByText("Belum dinilai", { exact: true })).toHaveCount(2);
  await page
    .getByLabel("Status penilaian", { exact: true })
    .selectOption("none");
  await expect(main().locator("tbody tr")).toHaveCount(20);
  await page
    .getByLabel("Status penilaian", { exact: true })
    .selectOption("partial");
  await expect(main().locator("tbody tr")).toHaveCount(0);
  await go(`/guru/monitoring?event=${eventId}`);
  assert(!(await main().innerText()).includes(milestoneId));
  ok(
    "B03/B08-WORK",
    "Karya distinguishes zero from partial; Monitoring labels use M1.",
  );

  await go("/guru/students?event=wireframe&student=aisyah");
  await page
    .getByRole("textbox", {
      name: "Catatan Guru untuk Aisyah Putri",
      exact: true,
    })
    .fill("Catatan regresi fiktif Round 2.");
  await button("Simpan Catatan").click();
  await button("Tandai Sudah Ditinjau").click();
  await go("/guru/dashboard");
  await go("/guru/students?event=wireframe&student=aisyah");
  await expect(
    page.getByRole("textbox", {
      name: "Catatan Guru untuk Aisyah Putri",
      exact: true,
    }),
  ).toHaveValue("Catatan regresi fiktif Round 2.");
  await expect(button("Tandai Sudah Ditinjau")).toBeDisabled();
  await page.reload();
  await expect(
    page.getByRole("textbox", {
      name: "Catatan Guru untuk Aisyah Putri",
      exact: true,
    }),
  ).toHaveValue("Catatan regresi fiktif Round 2.");
  await expect(button("Tandai Sudah Ditinjau")).toBeDisabled();
  ok(
    "B04",
    "Note and review survive navigation and full refresh in existing session store.",
  );

  const beforeCount = await surveyCount();
  await login("student");
  await go("/siswa/survey?event=kantin&milestone=M2&mode=form");
  await page.locator("#survey-first-4").check();
  await page.locator("#survey-second-5").check();
  await page
    .locator("#survey-reflection")
    .fill("Refleksi fiktif Round 2 terbaru.");
  await button("Kirim Jawaban Survei").click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Ya, Kirim Jawaban", exact: true })
    .click();
  await expect(
    main().getByRole("heading", {
      name: "Hasil Pengiriman Survei",
      exact: true,
    }),
  ).toBeVisible();
  const stored = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("lugina.teacher.event-drafts.v1")),
  );
  const response = stored.studentUI.surveyResponses["kantin:dimas:M2"];
  await login("teacher");
  assert.equal(await surveyCount(), beforeCount + 1);
  await go("/guru/events?event=kantin");
  await expect(main()).toContainText("35 dari 80 tugas & survei selesai");
  await expect(main()).toContainText("39 dari 80 tugas telah dikumpulkan");
  await expect(main().getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "44",
  );
  await shot("event-progress-current");
  await go("/guru/students?event=kantin&student=dimas");
  const surveyCard = main()
    .locator("section")
    .filter({
      has: page.getByRole("heading", {
        name: "M2 · User Flow & Wireframe",
        exact: true,
      }),
    })
    .last();
  const expectedDate = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(response.submittedAt + "+07:00"));
  await expect(surveyCard).toContainText(expectedDate);
  await expect(surveyCard).toContainText(
    response.submittedAt.slice(11).replace(":", "."),
  );
  await expect(surveyCard).toContainText(
    "Survei Adopsi Teknologi dan Technostress (Versi 1.0)",
  );
  await expect(surveyCard).toContainText(
    "Ringkasan terhubung ke tampilan Guru dalam sesi demo.",
  );
  await expect(surveyCard).toContainText("Refleksi fiktif Round 2 terbaru.");
  await shot("actual-survey-metadata");
  await button("Tandai Sudah Ditinjau").click();
  assert.equal(await surveyCount(), beforeCount - 1);
  await page.reload();
  assert.equal(await surveyCount(), beforeCount - 1);
  ok(
    "B02/B05/B09",
    "New survey increments review total, current metadata/time displayed, review decrements total, progress is 35/80=44% with 39 tasks.",
  );

  await go(`/guru/reports?event=${eventId}&assessment=none`);
  await expect(main()).toContainText("40");
  await expect(main().locator("tbody tr")).toHaveCount(20);
  const downloadPdf = page.waitForEvent("download");
  await button("Unduh PDF").click();
  await (await downloadPdf).saveAs(path.join(output, "report-40-students.pdf"));
  const pdf = readFileSync(path.join(output, "report-40-students.pdf"), "utf8");
  assert((pdf.match(/\/Type \/Page\b/g) ?? []).length > 1);
  assert(pdf.includes("Peserta Fiktif 39"));
  for (const match of pdf.matchAll(/1 0 0 1 50 (\d+) Tm/g))
    assert(Number(match[1]) >= 46);
  const downloadXlsx = page.waitForEvent("download");
  await button("Unduh Excel").click();
  await (
    await downloadXlsx
  ).saveAs(path.join(output, "report-40-students.xlsx"));
  ok(
    "B06-40",
    "Actual 40-enrollment PDF paginates, retains last long-name row; XLSX generated for independent structural check.",
  );

  await go("/guru/rubrics?mode=create");
  await page.locator("#rubric-name").fill("Rubrik Aksesibilitas Round 2");
  await button("Simpan Rubrik").click();
  const fields = main().locator('textarea[aria-invalid="true"]');
  await expect(fields).toHaveCount(5);
  assert.equal(
    await page.evaluate(() =>
      document.activeElement?.getAttribute("aria-label"),
    ),
    "Kriteria 2 skor 1",
  );
  for (const field of await fields.all()) {
    const id = await field.getAttribute("aria-describedby");
    assert(id);
    await expect(page.locator(`[id="${id}"]`)).toBeVisible();
  }
  await page
    .getByRole("textbox", { name: "Nama kriteria 2", exact: true })
    .fill("");
  await button("Simpan Rubrik").click();
  assert.equal(
    await page.evaluate(() =>
      document.activeElement?.getAttribute("aria-label"),
    ),
    "Nama kriteria 2",
  );
  await shot("rubric-field-errors-focus");
  ok(
    "B10",
    "Five score errors associated with invalid fields; first invalid field receives focus, including criterion name.",
  );

  await login("student");
  await go("/siswa/profile");
  for (const length of [110, 120]) {
    const name = "N".repeat(length);
    await page.locator("#student-profile-name").fill(name);
    await button("Simpan Perubahan").click();
    await go("/siswa/dashboard");
    await go("/siswa/profile");
    await expect(page.locator("#student-profile-name")).toHaveValue(name);
    await page.reload();
    await expect(page.locator("#student-profile-name")).toHaveValue(name);
  }
  ok(
    "B07",
    "110 and 120 character accepted names retain every character after navigation and refresh.",
  );
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 1024 });
    for (const route of [
      "/siswa/dashboard",
      "/siswa/profile",
      "/siswa/portfolio?event=kantin",
    ]) {
      await go(route);
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `Long-name overflow: ${route} at ${width}`,
      );
    }
  }
  ok(
    "B07-RESPONSIVE",
    "A persisted 120-character unbroken name wraps on Dashboard/Portfolio at 320, 768 and 1440 px.",
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(failed, []);
  writeFileSync(
    path.join(output, "results.json"),
    JSON.stringify(
      {
        checks,
        errors,
        failed,
        surveyBefore: beforeCount,
        response,
        pdfPages: (pdf.match(/\/Type \/Page\b/g) ?? []).length,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify({ passed: checks.length, output }));
} finally {
  await browser.close();
}
