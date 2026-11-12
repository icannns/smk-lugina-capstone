import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire, Module } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Exercise actual TS/TSX modules with the existing compiler and React renderer.
const require = createRequire(import.meta.url);
const ts = require("typescript");
for (const extension of [".ts", ".tsx"])
  Module._extensions[extension] = (module, filename) => module._compile(
    ts.transpileModule(readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText, filename,
  );
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  return resolve.call(this, request.startsWith("@/")
    ? fileURLToPath(new URL(`../src/${request.slice(2)}`, import.meta.url)) : request, ...args);
};
const { scopedAssessments, assessmentHasResult, assessmentResultText, assessmentSummary, assessmentHighlight, filterAssessments, initialAssessmentFilters } = require("../src/lib/assessments/selectors.ts");
const { mockAssessmentRecords: records } = require("../src/lib/assessments/mock-data.ts");
const { mockAssessmentRepository } = require("../src/lib/assessments/repository.ts");
const { eventEnrollments } = require("../src/lib/guru/event-data.ts");
const { students } = require("../src/lib/guru/student-data.ts");
const { AssessmentLoadState, assessmentDate } = require("../src/components/assessments/assessment-ui.tsx");
const { AssessmentSection } = require("../src/components/assessments/assessment-section.tsx");
const { createElement } = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const names = new Map(students.map((s) => [s.id, s.name]));

test("student scope is exact, excludes Technostress, and fails closed for missing identity", () => {
  for (const id of ["dimas", "aisyah", "new-student"]) {
    const mine = scopedAssessments(records, { role: "student", studentId: id });
    assert(mine.every((r) => r.studentId === id && r.type !== "technostress"));
    assert.equal(mine.length, id === "new-student" ? 0 : id === "dimas" ? 4 : 2);
  }
  for (const scope of [null, { role: "student", studentId: "" }, { role: "student" }, { role: "unknown" }])
    assert.deepEqual(scopedAssessments(records, scope), []);
  assert.equal(scopedAssessments(records, { role: "teacher" }).length, records.length);
});

test("fictional identities/events are shared IDs with event-based enrollment", () => {
  assert.equal(new Set(records.map((r) => r.id)).size, records.length);
  for (const r of records) {
    assert(names.has(r.studentId));
    if (r.eventId) assert(eventEnrollments.some((e) => e.studentId === r.studentId && e.eventId === r.eventId));
    assert.equal(r.source, "mock");
  }
});

test("zero scores, missing results and non-clinical text remain distinct", () => {
  const zero = records.find((r) => r.studentId === "fajar");
  assert.equal(assessmentResultText(zero), "0 / 100");
  assert(assessmentHasResult(zero));
  const pending = records.find((r) => r.status === "awaiting_result");
  assert.equal(assessmentResultText(pending), "Hasil belum diterbitkan.");
  assert(!assessmentHasResult({ ...pending, result: zero.result }));
  const tech = records.find((r) => r.type === "technostress" && r.result);
  assert.equal(tech.result.score, undefined);
  assert.equal(assessmentResultText(tech), tech.result.summary);
  const invalid = { ...zero, result: { score: { value: Number.NaN, maximum: 100 } } };
  assert.equal(assessmentResultText(invalid), "Hasil belum tersedia.");
  assert(!assessmentHasResult(invalid));
});

test("summary and combined search/event/status filters use the same scoped records", () => {
  const mine = scopedAssessments(records, { role: "student", studentId: "dimas" });
  assert.deepEqual(assessmentSummary(mine), { total: 4, available: 2, unavailable: 2 });
  const filtered = filterAssessments(records, { search: " DIMAS ", eventId: "kantin", status: "completed" }, names);
  assert.equal(filtered.length, 2);
  assert(filtered.every((r) => r.studentId === "dimas" && r.eventId === "kantin"));
  assert.equal(filterAssessments(records, { ...initialAssessmentFilters, eventId: "none" }, names).length, 1);
  assert.deepEqual(filterAssessments(mine, { ...initialAssessmentFilters, search: "Aisyah" }, names), []);
});

test("repository is read-only, scoped per request, and rejects aborted loads", async () => {
  const before = JSON.stringify(records);
  const [dimas, aisyah] = await Promise.all(["dimas", "aisyah"].map((studentId) =>
    mockAssessmentRepository.list({ role: "student", studentId }, new AbortController().signal)));
  assert(dimas.every((r) => r.studentId === "dimas"));
  assert(aisyah.every((r) => r.studentId === "aisyah"));
  const controller = new AbortController(); controller.abort();
  await assert.rejects(mockAssessmentRepository.list({ role: "teacher" }, controller.signal), { name: "AbortError" });
  const switching = new AbortController();
  const abandoned = mockAssessmentRepository.list({ role: "student", studentId: "dimas" }, switching.signal);
  switching.abort();
  await assert.rejects(abandoned, { name: "AbortError" });
  assert.equal(JSON.stringify(records), before);
});

test("compact student card uses the most recent dated result, including pending results", () => {
  const mine = records.filter((r) => r.studentId === "dimas" && r.type === "uiux");
  const before = JSON.stringify(mine);
  const latest = assessmentHighlight(mine);
  assert.equal(latest.status, "awaiting_result");
  assert.equal(latest.id, "demo-uiux-dimas-kantin");
  assert.equal(JSON.stringify(mine), before);
  assert.equal(assessmentHighlight([]), undefined);
  const undated = mine.map((r) => ({ ...r, completedAt: undefined }));
  assert.equal(assessmentHighlight(undated), undated[0]);
});

test("loading, recoverable error, empty UI and WIB timestamps render without fabricated success", () => {
  const loading = renderToStaticMarkup(createElement(AssessmentLoadState, { state: { status: "loading" }, onRetry() {} }));
  assert.match(loading, /role="status"/); assert.match(loading, /aria-busy="true"/);
  const error = renderToStaticMarkup(createElement(AssessmentLoadState, { state: { status: "error" }, onRetry() {} }));
  assert.match(error, /role="alert"/); assert.match(error, /Coba lagi/);
  const empty = renderToStaticMarkup(createElement(AssessmentSection, { type: "uiux", records: [], teacher: false, names, eventNames: new Map() }));
  assert.match(empty, /Belum ada asesmen ui\/ux/); assert.doesNotMatch(empty, /Lihat detail/);
  assert.match(assessmentDate("2025-03-24T02:00:00Z"), /09[.:]00.*WIB/);
  assert.equal(assessmentDate("bad timestamp"), "Belum tercatat");
});
