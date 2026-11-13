import { test } from "node:test";
import assert from "node:assert/strict";
import { compareEventUpdates, selectEvents } from "../src/lib/guru/event-selectors";
import { studentDirectory } from "../src/lib/guru/student-integration";
import { enrollmentProgress } from "../src/lib/guru/learning-selectors";
import { isDisplayName, escapeXmlText } from "../src/lib/text-validation";
import { registrationInput } from "../src/server/auth/validation";
import type { ManagedEvent, EventFilters } from "../src/lib/guru/event-types";
import type { AssessmentChanges, TeacherSubmission } from "../src/lib/guru/teacher-types";

const event: ManagedEvent = {
  id: "event-qa", title: "Event QA", status: "ongoing", mode: "Penyelesaian",
  updated: "2026-11-13", period: "QA",
  milestones: [{ id: "M1", title: "Riset", surveyActive: false }, { id: "M2", title: "Desain", surveyActive: false }],
};
const filters: EventFilters = { tab: "published", search: "", status: "all", sort: "updated", page: 1, pageSize: 2 };
test("updated ordering preserves same-day precision across draft/published and stable pagination", () => {
  const records: ManagedEvent[] = [
    { ...event, id: "a", updatedAt: "2026-11-13T01:00:00.000Z" },
    { ...event, id: "c", status: "draft", updatedAt: "2026-11-13T02:00:00.002Z" },
    { ...event, id: "b", updatedAt: "2026-11-13T02:00:00.002Z" },
  ];
  assert.deepEqual([...records].sort(compareEventUpdates).map((e) => e.id), ["b", "c", "a"]);
  assert.deepEqual(selectEvents(records, filters, []).records.map((e) => e.id), ["b", "a"]);
  assert.deepEqual(records.map((e) => e.id), ["a", "c", "b"]);
  assert(compareEventUpdates({ ...event, updated: "2026-11-12" }, event) > 0);
});

function learning(required: boolean, complete: boolean): AssessmentChanges {
  const submissions = Object.fromEntries(event.milestones.map((m) => [m.id, {
    id: m.id, eventId: event.id, milestoneId: m.id, studentId: "dimas",
    versions: [{ version: 1, submittedAt: "13 Nov 2026", file: "Tugas" }],
    surveyComplete: m.id === "M1" && complete, surveyRequired: m.id === "M1" && required,
  } satisfies TeacherSubmission]));
  return { source: "api", assessments: {}, feedback: {}, submissions,
    students: [{ id: "dimas", name: "Dimas", email: "dimas@example.com" }],
    enrollments: [{ id: "enrollment-qa", eventId: event.id, studentId: "dimas", method: "self" }] };
}
for (const [required, complete, expected] of [[false, false, 2], [true, false, 1], [true, true, 2]] as const) {
  test(`student detail shares learning completion, separately from survey dates (${required}/${complete})`, () => {
    const changes = learning(required, complete);
    const row = studentDirectory([event], changes).enrollments[0];
    assert.equal(row.completedMilestones, expected);
    assert.equal(row.completedMilestones, enrollmentProgress(event, "dimas", changes).completed);
    assert.equal(row.milestones.filter((m) => m.submittedAt).length, complete ? 1 : 0);
    assert.equal(enrollmentProgress(event, "dimas", changes).score, null, "completion never fabricates a grade");
  });
}

test("XML export handles legacy controls, lone surrogates and markup while preserving Unicode/whitespace", () => {
  assert.equal(escapeXmlText("QA\u000bKontrol\u0000\ud800\ufffe\uffff"), "QAKontrol");
  assert.equal(escapeXmlText("A&B<>\"'\t\n\r \u00e9 \ud83c\uddee\ud83c\udde9"), "A&amp;B&lt;&gt;&quot;&apos;\t\n\r \u00e9 \ud83c\uddee\ud83c\udde9");
  assert.equal(escapeXmlText("=1+1"), "=1+1", "spreadsheet still uses string cells, not formulas");
});

test("registration rejects control names before trim; display names retain international characters", () => {
  const input = { name: "Dimas Fiktif", email: "dimas@example.com", password: "TestingOnly123!", confirm: "TestingOnly123!" };
  for (const name of ["QA\u000bKontrol", "QA\tNama", "QA\nNama", "QA\u007fNama", "QA\u0085Nama", "QA\ud800Nama", "\nDimas"]) {
    assert.equal(isDisplayName(name), false);
    assert.equal(registrationInput({ ...input, name }), null);
  }
  for (const name of ["  Dimas Fiktif  ", "Siti Nur-'Aisyah", "Ren\u00e9e", "\u5b66\u751f", "Dimas \ud83c\uddee\ud83c\udde9"])
    assert.equal(registrationInput({ ...input, name })?.name, name.trim());
});
