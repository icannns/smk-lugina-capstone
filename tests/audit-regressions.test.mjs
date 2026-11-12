import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire, Module } from "node:module";
import { readFileSync } from "node:fs";

// Test the actual TypeScript selectors/actions using the project's installed
// compiler. No application dependency or parallel mock implementation required.
const require = createRequire(import.meta.url);
const ts = require("typescript");
Module._extensions[".ts"] = (module, filename) => {
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
};
const learning = require("../src/lib/guru/learning-selectors.ts");
const {
  reportRows,
  reportExport,
  emptyReportFilters,
} = require("../src/lib/guru/report-selectors.ts");
const { managedEvents } = require("../src/lib/guru/event-data.ts");
const { initialRubrics } = require("../src/lib/guru/rubric-data.ts");
const { studentDirectory } = require("../src/lib/guru/student-integration.ts");
const {
  initialStudentUI,
  STUDENT_NAME_MAX_LENGTH,
} = require("../src/lib/siswa/student-types.ts");
const { parseStudentUI } = require("../src/lib/siswa/serialization.ts");
const {
  createPrototypePdf,
  pdfLines,
} = require("../src/lib/guru/prototype-pdf.ts");
const {
  parseStudentReviews,
} = require("../src/lib/guru/student-review-state.ts");
const rubric = initialRubrics.find((r) => r.id === "uiux");
const event = {
  ...managedEvents[0],
  id: "round2-event",
  milestones: [
    {
      ...managedEvents[0].milestones[0],
      id: "5820e400-e29b-41d4-a716-446655440000",
    },
  ],
};
const submission = {
  id: `${event.id}:round2-student:${event.milestones[0].id}`,
  eventId: event.id,
  studentId: "round2-student",
  milestoneId: event.milestones[0].id,
  surveyComplete: false,
  versions: [{ version: 1, submittedAt: "2026-11-09T09:00", file: "demo.pdf" }],
};
const fixture = () => ({
  assessments: {},
  feedback: {},
  students: [
    { id: "round2-student", name: "Siswa Fiktif", email: "round2@example.com" },
  ],
  enrollments: [
    {
      id: "round2-enrollment",
      eventId: event.id,
      studentId: "round2-student",
      method: "self",
    },
  ],
  submissions: { [submission.id]: structuredClone(submission) },
});
const filters = { ...emptyReportFilters, event: event.id };

test("B01: submitted work with missing survey stays working in UI, filters and exports", () => {
  const state = fixture(),
    row = reportRows(event, state, rubric, { ...filters, work: "working" });
  assert.equal(row.rows.length, 1);
  assert.equal(learning.workStatus(row.rows[0]), "working");
  assert.equal(reportExport(event, row)[3][2], "Dalam pengerjaan");
  for (const work of ["none", "complete"])
    assert.equal(
      reportRows(event, state, rubric, { ...filters, work }).rows.length,
      0,
    );
});
test("B02: event metrics distinguish submitted tasks and task+survey completion", () => {
  const state = fixture();
  assert.equal(learning.eventLearning(event, state, rubric).submitted, 1);
  assert.equal(learning.eventLearning(event, state, rubric).percent, 0);
  state.submissions[submission.id].surveyComplete = true;
  assert.equal(learning.eventLearning(event, state, rubric).percent, 100);
});
test("B03: zero, partial, full current grades and historical revision are distinct", () => {
  assert.equal(learning.assessmentStatus({ total: 2, reviewed: 0 }), "none");
  assert.equal(learning.assessmentStatus({ total: 2, reviewed: 1 }), "partial");
  assert.equal(
    learning.assessmentStatus({ total: 2, reviewed: 2 }),
    "complete",
  );
  assert.equal(learning.assessmentStatus({ total: 0, reviewed: 0 }), "none");
  const state = fixture(),
    scores = Object.fromEntries(rubric.criteria.map((c) => [c.id, 4]));
  state.submissions[submission.id].versions[0].scores = scores;
  state.submissions[submission.id].versions.push({
    version: 2,
    submittedAt: "2026-11-09T10:00",
    file: "revision.pdf",
  });
  assert.deepEqual(
    learning.assessmentForVersion(state.submissions[submission.id], 1, state),
    scores,
  );
  assert.equal(
    learning.assessmentFor(state.submissions[submission.id], state),
    undefined,
  );
  const data = reportRows(event, state, rubric, {
    ...filters,
    assessment: "none",
  });
  assert.equal(data.rows.length, 1);
  assert.equal(reportExport(event, data)[3].at(-3), "Belum dinilai");
});
test("B04: API cache rehydrates notes/reviews and isolates account switches without session fallback", async () => {
  const store = require("../src/lib/guru/event-draft-store.ts");
  const originalFetch = globalThis.fetch;
  const server = structuredClone(store.readEventStore());
  server.accountId = "teacher-rina";
  server.studentReviews.notes["wireframe-aisyah"] = "Catatan dari PostgreSQL";
  server.studentReviews.reviews["wireframe-aisyah"] = true;
  let available = true;
  globalThis.fetch = async () => available
    ? new Response(JSON.stringify(server), {status:200})
    : new Response(JSON.stringify({error:{message:"Database unavailable"}}), {status:503});
  let disconnect;
  try {
    disconnect = store.connectWorkspace("teacher-rina");
    await store.refreshWorkspace();
    assert.equal(store.readEventStore().studentReviews.notes["wireframe-aisyah"], "Catatan dari PostgreSQL");
    assert.equal(store.readEventStore().studentReviews.reviews["wireframe-aisyah"], true);
    available = false;
    assert.equal(await store.saveStudentNote("wireframe-aisyah", "Jangan tampilkan sukses"), false);
    assert.match(store.readEventStore().storageError, /unavailable/);
    assert.equal(store.readEventStore().studentReviews.notes["wireframe-aisyah"], "Catatan dari PostgreSQL");
    disconnect(); disconnect = store.connectWorkspace("student-dimas");
    assert.equal(Object.keys(store.readEventStore().studentReviews.notes).length, 0);
    available = true;
    await assert.rejects(store.refreshWorkspace(), /Identitas sesi/);
    assert.equal(Object.keys(store.readEventStore().studentReviews.notes).length, 0);
    assert.equal(store.readEventStore().learning.source, "api");
    assert.deepEqual(parseStudentReviews(undefined).notes, {});
  } finally { disconnect?.(); globalThis.fetch = originalFetch; }
});

test("B05: actual response timestamp and new metadata override legacy task metadata", () => {
  const state = { assessments: {}, feedback: {} },
    id = "kantin:dimas:M2",
    original = learning.allSubmissions(state).find((s) => s.id === id);
  state.submissions = {
    [id]: {
      ...original,
      surveyComplete: true,
      instrument: "Instrumen baru",
      completion: "Selesai baru",
      integration: "Demo baru",
      reflection: "Refleksi baru",
    },
  };
  const ui = {
    ...initialStudentUI,
    surveyResponses: {
      [id]: {
        id: "SURVEY-DEMO-R2",
        first: 4,
        second: 5,
        reflection: "Jawaban saat ini",
        submittedAt: "2026-11-09T13:44",
        version: 1,
      },
    },
  };
  const row = studentDirectory(managedEvents, state, ui).enrollments.find(
    (e) => e.id === "kantin-dimas",
  ).milestones[1];
  assert.match(row.submittedAt, /9 Nov 2026/);
  assert.match(row.submittedAt, /13[.:]44/);
  assert.equal(row.instrument, "Instrumen baru");
  assert.equal(row.reflection, "Jawaban saat ini");
  assert.equal(row.integration, "Demo baru");
});
test("B06: PDF wraps long words, escapes text and paginates >=40 report rows within A4 bounds", () => {
  const lines = Array.from(
    { length: 40 },
    (_, i) =>
      `Peserta ${String(i + 1).padStart(2, "0")} - ${"NamaFiktif".repeat(18)} | 1/1 | 80`,
  );
  const pdf = createPrototypePdf(
    "Laporan (demo)",
    lines,
    "Data fiktif, bukan laporan resmi.",
  );
  assert((pdf.match(/\/Type \/Page\b/g) ?? []).length > 1);
  assert(pdf.includes("Peserta 40"));
  assert(pdf.includes("Laporan \\(demo\\)"));
  for (const line of pdfLines("x".repeat(400))) assert(line.length <= 82);
  for (const match of pdf.matchAll(/1 0 0 1 50 (\d+) Tm/g))
    assert(Number(match[1]) >= 46 && Number(match[1]) <= 790);
  const state = fixture();
  state.students = [];
  state.enrollments = [];
  for (let i = 0; i < 40; i++) {
    state.students.push({
      id: `demo-${i}`,
      name: `Demo ${i}`,
      email: `demo${i}@example.com`,
    });
    state.enrollments.push({
      id: `enroll-${i}`,
      eventId: event.id,
      studentId: `demo-${i}`,
      method: "self",
    });
  }
  assert.equal(
    reportRows(event, state, rubric, {
      ...filters,
      assessment: "none",
      work: "none",
    }).rows.length,
    40,
  );
});
test("B07: every valid profile name up to the UI limit round-trips without truncation", () => {
  for (const length of [100, 110, STUDENT_NAME_MAX_LENGTH]) {
    const profile = {
      name: "N".repeat(length),
      email: "demo@example.com",
      phone: "",
    };
    assert.equal(
      parseStudentUI({ profiles: { dimas: profile } }).profiles.dimas.name,
      profile.name,
    );
  }
});
test("B08: UUIDs remain internal while report headers use milestone sequence", () => {
  assert.equal(learning.milestoneLabel(event, event.milestones[0].id), "M1");
  const data = reportRows(event, fixture(), rubric, filters),
    headings = reportExport(event, data)[2].join(" ");
  assert(headings.includes("M1"));
  assert(!headings.includes(event.milestones[0].id));
});
test("B09: new survey responses invalidate a prior review including same-minute submissions", () => {
  const id = "kantin:aisyah:M1",
    ui = {
      ...initialStudentUI,
      surveyResponses: {
        [id]: {
          id: "NEW-RESPONSE",
          first: 3,
          second: 4,
          reflection: "Demo",
          submittedAt: "2026-11-09T13:44",
          version: 1,
        },
      },
    };
  const reviews = {
    notes: {},
    reviews: { "kantin-aisyah": true },
    reviewedResponses: { "kantin-aisyah": ["PREVIOUS-RESPONSE"] },
  };
  const directory = () =>
    studentDirectory(
      managedEvents,
      { assessments: {}, feedback: {} },
      ui,
      reviews,
    );
  assert.equal(
    directory().enrollments.find((e) => e.id === "kantin-aisyah").reviewed,
    false,
  );
  reviews.reviewedResponses["kantin-aisyah"].push("NEW-RESPONSE");
  assert.equal(
    directory().enrollments.find((e) => e.id === "kantin-aisyah").reviewed,
    true,
  );
});

test("API source never merges fixtures and compound display keys cannot collide", () => {
  const { submissionKey, enrollmentKey } = require("../src/lib/domain/keys.ts");
  assert.notEqual(submissionKey("a:b", "c", "M1"), submissionKey("a", "b:c", "M1"));
  assert.notEqual(enrollmentKey("a:b", "c"), enrollmentKey("a", "b:c"));
  const api = {source:"api", students:[], enrollments:[], submissions:{}, assessments:{}, feedback:{}};
  assert.deepEqual(learning.allStudents(api), []);
  assert.deepEqual(learning.allEnrollments(api), []);
  assert.deepEqual(learning.allSubmissions(api), []);
  assert.deepEqual(learning.feedbackFor("kantin:dimas:M1", api), []);
});

test("Optional surveys are not reported as missing responses and never fabricate completion", () => {
  const state = fixture();
  state.source = "api";
  state.submissions[submission.id].surveyRequired = false;
  assert.equal(reportRows(event, state, rubric, {...filters, survey:"missing"}).rows.length, 0);
  assert.equal(reportRows(event, state, rubric, {...filters, survey:"complete"}).rows.length, 0);
  const all = reportRows(event, state, rubric, filters);
  assert.equal(all.rows[0].completed, 1);
  assert(reportExport(event, all)[3][3].includes("Tidak diwajibkan"));
  assert.equal(state.submissions[submission.id].surveyComplete, false);
});
