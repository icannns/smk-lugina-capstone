import "dotenv/config";
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { createDatabaseClient } from "../src/server/db/client";
import { requireDevelopmentDatabase } from "../prisma/development-safety";
import { seedDevelopmentData } from "../prisma/seed-data";
import { demoEvents } from "../src/lib/guru/demo-events";

const target = requireDevelopmentDatabase(process.env);
if (!target.databaseName.startsWith("bojong_united_test"))
  throw new Error("Integrity tests require a dedicated bojong_united_test database, never the development workspace database.");
const database = createDatabaseClient(target.connectionString);
const rollback = new Error("rollback isolated test writes");
function isIntegrityViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const failure = error as { code?: string; cause?: unknown; meta?: unknown };
  // Prisma maps unique/FK/check errors; adapter errors may retain SQLSTATE.
  if (["P2002", "P2003", "P2004", "23502", "23503", "23505", "23514"].includes(failure.code ?? "")) return true;
  return [failure.cause, failure.meta].some((nested) => {
    if (!nested || typeof nested !== "object") return false;
    return isIntegrityViolation(nested) || Object.values(nested).some(isIntegrityViolation);
  });
}
before(async () => { await seedDevelopmentData(database); });
after(async () => { await database.$disconnect(); });

test("app connections preserve timestamp instants when PostgreSQL timezone options use WIB", async () => {
  const url = new URL(target.connectionString);
  url.searchParams.set("options", "-c timezone=Asia/Bangkok -c application_name=bojong_timezone_test");
  const client = createDatabaseClient(url.toString());
  try {
    const [row] = await client.$queryRaw<{ timezone: string; application: string; expiresAt: Date }[]>`
      SELECT current_setting('TimeZone') AS timezone, current_setting('application_name') AS application,
             '2026-11-19 19:00:00+07:00'::timestamptz AS "expiresAt"
    `;
    assert.equal(row.timezone, "UTC");
    assert.equal(row.application, "bojong_timezone_test");
    assert.equal(row.expiresAt.toISOString(), "2026-11-19T12:00:00.000Z");
  } finally { await client.$disconnect(); }
});

test("seed is idempotent and preserves existing demo identities and credential metadata", async () => {
  const initial = await database.user.findMany({ orderBy: { id: "asc" } });
  const a = await seedDevelopmentData(database), b = await seedDevelopmentData(database);
  assert.deepEqual(a, b);
  assert.deepEqual(await database.user.findMany({ orderBy: { id: "asc" } }), initial);
  assert(initial.every((u) => u.isDemo && u.email?.endsWith("@example.com")));
  const columns = await database.$queryRaw<{ column_name: string }[]>`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='User'`;
  assert(columns.some((c) => c.column_name === "passwordHash"));
  assert(!columns.some((c) => /token|salt/i.test(c.column_name)));
});

test("milestones are event-scoped; submission versions, grades and reviews retain history", async () => {
  const milestoneEvents = await database.milestone.findMany({ where: { id: "M1" }, select: { eventId: true } });
  assert.deepEqual(milestoneEvents.map((row) => row.eventId).sort(), demoEvents.map((event) => event.id).sort());
  const versions = await database.submissionVersion.findMany({ where: { submissionId: "kantin:dimas:M1" }, include: { assessment: { include: { scores: true } } }, orderBy: { version: "asc" } });
  assert.equal(versions.length, 2);
  assert.equal(versions[0].assessment?.scores.length, 4);
  assert.equal(versions[1].assessment, null);
  const responses = await database.surveyResponseReference.findMany({ where: { studentId: "dimas" }, include: { reviews: true }, orderBy: { revision: "asc" } });
  assert.equal(responses[0].reviews.length, 1);
  assert.equal(responses[1].reviews.length, 0);
  assert.notEqual(responses[0].completedAt?.toISOString(), versions[0].submittedAt.toISOString());
});

test("duplicate enrollment and cross-event milestone/submission associations are rejected", async () => {
  await assert.rejects(database.enrollment.create({ data: { eventId: "kantin", studentId: "dimas" } }), isIntegrityViolation);
  await assert.rejects(database.submission.create({ data: { eventId: "wireframe", studentId: "dimas", milestoneId: "M4" } }), isIntegrityViolation);
  await assert.rejects(database.submissionVersion.create({ data: { submissionId: "kantin:dimas:M1", eventId: "wireframe", version: 3, submittedAt: new Date() } }), isIntegrityViolation);
});

test("a real student cannot submit to an event without enrollment", async () => {
  await assert.rejects(database.$transaction(async (tx) => {
    await tx.event.create({ data: { id: "qa-unenrolled-event", ownerTeacherId: "rina", title: "Fixture transaction" } });
    await tx.milestone.create({ data: { eventId: "qa-unenrolled-event", id: "M1", title: "Fixture", position: 1 } });
    await tx.submission.create({ data: { eventId: "qa-unenrolled-event", studentId: "aisyah", milestoneId: "M1" } });
    throw rollback;
  }), isIntegrityViolation);
  assert.equal(await database.event.count({ where: { id: "qa-unenrolled-event" } }), 0);
});

test("profiles must match actual roles and existing history cannot be cascade-deleted", async () => {
  await assert.rejects(database.teacherProfile.create({ data: { id: "qa-role-mismatch", userId: "student-dimas" } }), isIntegrityViolation);
  await assert.rejects(database.studentProfile.create({ data: { id: "qa-role-mismatch", userId: "teacher-rina" } }), isIntegrityViolation);
  await assert.rejects(database.user.delete({ where: { id: "student-dimas" } }), isIntegrityViolation);
});

test("assessment context/rubric must match the exact submission version and event", async () => {
  await assert.rejects(database.assessment.create({ data: { submissionVersionId: "kantin:dimas:M1:v2", eventId: "wireframe", rubricVersionId: "wireframe:v1", assessedByTeacherId: "rina" } }), isIntegrityViolation);
  await assert.rejects(database.assessment.create({ data: { submissionVersionId: "kantin:dimas:M1:v2", eventId: "kantin", rubricVersionId: "wireframe:v1", assessedByTeacherId: "rina" } }), isIntegrityViolation);
  await assert.rejects(database.assessmentScore.create({ data: { assessmentId: "kantin:dimas:M1:v1", rubricVersionId: "wireframe:v1", criterionId: "wireframe-1", value: 3 } }), isIntegrityViolation);
});

test("score ranges and immutable rubric snapshots are enforced in PostgreSQL", async () => {
  await assert.rejects(database.assessmentScore.update({ where: { assessmentId_criterionId: { assessmentId: "kantin:dimas:M1:v1", criterionId: "uiux-1" } }, data: { value: 6 } }), isIntegrityViolation);
  await assert.rejects(database.rubricCriterion.update({ where: { rubricVersionId_id: { rubricVersionId: "uiux:v1", id: "uiux-1" } }, data: { maxScore: 99 } }), isIntegrityViolation);
  await assert.rejects(database.rubricVersion.update({ where: { id: "uiux:v1" }, data: { title: "Changed historical rubric" } }), isIntegrityViolation);
  await assert.rejects(database.rubricCriterion.create({ data: { rubricVersionId: "uiux:v1", id: "new-criterion", position: 5, title: "Invalid mutation", description: "", minScore: 0, maxScore: 5 } }), isIntegrityViolation);
  const score = await database.assessmentScore.findUniqueOrThrow({ where: { assessmentId_criterionId: { assessmentId: "kantin:dimas:M1:v1", criterionId: "uiux-1" } } });
  assert.equal(score.value.toNumber(), 4);
});

test("non-default criterion ranges, valid zero results and nullable event references work", async () => {
  await assert.rejects(database.$transaction(async (tx) => {
    await tx.rubricCriterion.create({ data: { rubricVersionId: "database:v1", id: "qa-zero-scale", position: 3, title: "Scale 0–10", description: "Fixture", minScore: 0, maxScore: 10 } });
    await tx.rubricCriterionLevel.create({ data: { rubricVersionId: "database:v1", criterionId: "qa-zero-scale", score: 0, description: "Zero is valid" } });
    await tx.externalAssessmentReference.create({ data: { id: "qa-zero-external", type: "UI_UX", title: "Fixture", studentId: "dimas", provider: "demo", source: "DEMO", status: "COMPLETED", scoreValue: 0, scoreMaximum: 10 } });
    const result = await tx.externalAssessmentReference.findUniqueOrThrow({ where: { id: "qa-zero-external" } });
    assert.equal(result.scoreValue?.toNumber(), 0);
    assert.equal(result.eventId, null);
    throw rollback;
  }), (error) => error === rollback);
});

test("invalid dates, ordinals, attachment sizes, and incomplete numeric pairs are rejected", async () => {
  await assert.rejects(database.event.create({ data: { ownerTeacherId: "rina", title: "Fixture", startsAt: new Date("2025-04-02"), endsAt: new Date("2025-04-01") } }), isIntegrityViolation);
  await assert.rejects(database.milestone.create({ data: { eventId: "kantin", id: "invalid-position", position: 0, title: "Fixture" } }), isIntegrityViolation);
  await assert.rejects(database.submissionAttachment.create({ data: { versionId: "kantin:dimas:M1:v2", id: "negative-size", name: "Fixture", contentType: "text/plain", sizeBytes: BigInt(-1) } }), isIntegrityViolation);
  await assert.rejects(database.externalAssessmentReference.create({ data: { type: "TECHNOSTRESS", title: "Fixture", studentId: "dimas", provider: "demo", source: "DEMO", scoreValue: 1 } }), isIntegrityViolation);
});

test("external results remain separate from milestone grades and survey review versions", async () => {
  const external = await database.externalAssessmentReference.findMany({ where: { studentId: "dimas" } });
  assert(external.some((r) => r.type === "COMPETENCY"));
  assert(external.some((r) => r.type === "TECHNOSTRESS" && r.scoreValue === null));
  assert(external.some((r) => r.type === "UI_UX" && r.status === "AWAITING_RESULT"));
  assert.equal(await database.assessment.count(), 1);
  assert.equal(await database.assessmentScore.count(), 4);
  assert(external.every((r) => r.source === "DEMO" && r.provider === "demo"));
});
