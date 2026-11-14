import type { PrismaClient } from "../src/generated/prisma/client";
import { initialRubrics } from "../src/lib/guru/rubric-data";
import { demoEvents } from "../src/lib/guru/demo-events";
import { mockAssessmentRecords } from "../src/lib/assessments/mock-data";

export const DEVELOPMENT_SEED_ID = "bojong-development-fixtures-v1";

function wib(value?: string) {
  if (!value) return undefined;
  return new Date(/[zZ]|[+-]\d\d:\d\d$/.test(value) ? value : `${value}${value.includes("T") ? "" : "T00:00:00"}+07:00`);
}

/** Idempotent creation only: never reset, delete, or overwrite existing records. */
export async function seedDevelopmentData(database: PrismaClient) {
  return database.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(718002712)`;
    const marker = await tx.developmentSeed.findUnique({ where: { id: DEVELOPMENT_SEED_ID } });
    if (!marker && (await tx.user.count() || await tx.event.count() || await tx.rubric.count() || await tx.surveyReference.count() || await tx.externalAssessmentReference.count() || await tx.developmentSeed.count()))
      throw new Error("Seed refused: database contains data without this development fixture marker.");

    const users = [
      { id: "teacher-rina", name: "Rina Marlina, S.Kom.", email: "guru@example.com", username: "rina.guru", role: "TEACHER" as const },
      { id: "student-dimas", name: "Dimas Saputra", email: "siswa@example.com", username: "dimas", role: "STUDENT" as const },
      { id: "student-aisyah", name: "Aisyah Putri", email: "aisyah@example.com", username: "aisyah", role: "STUDENT" as const },
    ];
    for (const user of users) {
      const existing = await tx.user.findUnique({ where: { id: user.id } });
      if (existing && !existing.isDemo) throw new Error("Seed refused: a reserved demo ID belongs to a non-demo user.");
      await tx.user.upsert({ where: { id: user.id }, create: { ...user, isDemo: true }, update: {} });
    }
    await tx.teacherProfile.upsert({ where: { id: "rina" }, create: { id: "rina", userId: "teacher-rina" }, update: {} });
    for (const id of ["dimas", "aisyah"])
      await tx.studentProfile.upsert({ where: { id }, create: { id, userId: `student-${id}` }, update: {} });

    for (const rubric of initialRubrics) {
      await tx.rubric.upsert({ where: { id: rubric.id }, create: { id: rubric.id, ownerTeacherId: "rina", title: rubric.title }, update: {} });
      const versionId = `${rubric.id}:v1`;
      await tx.rubricVersion.upsert({ where: { id: versionId }, create: { id: versionId, rubricId: rubric.id, version: 1, title: rubric.title, description: rubric.description }, update: {} });
      for (const [index, criterion] of rubric.criteria.entries()) {
        await tx.rubricCriterion.upsert({ where: { rubricVersionId_id: { rubricVersionId: versionId, id: criterion.id } }, create: { rubricVersionId: versionId, id: criterion.id, position: index + 1, title: criterion.title, description: criterion.description, minScore: criterion.min, maxScore: criterion.max }, update: {} });
        for (const [offset, description] of (criterion.levels ?? []).entries()) {
          const key = { rubricVersionId: versionId, criterionId: criterion.id, score: criterion.min + offset };
          await tx.rubricCriterionLevel.upsert({ where: { rubricVersionId_criterionId_score: key }, create: { ...key, description }, update: {} });
        }
      }
    }

    for (const event of demoEvents) {
      const status = event.status === "ended" ? "ENDED" : event.status === "upcoming" ? "UPCOMING" : "ONGOING";
      await tx.event.upsert({ where: { id: event.id }, create: { id: event.id, ownerTeacherId: "rina", title: event.title, status, publishedAt: wib(event.startAt), rubricVersionId: `${event.rubricId}:v1`, startsAt: wib(event.startAt), endsAt: wib(event.endAt), caseStudyHtml: event.caseStudyHtml, directionsHtml: event.directionsHtml }, update: {} });
      for (const [index, milestone] of event.milestones.entries()) {
        const key = { eventId: event.id, id: milestone.id };
        await tx.milestone.upsert({ where: { eventId_id: key }, create: { ...key, position: index + 1, title: milestone.title, instructions: milestone.instructions, deadline: wib(milestone.deadline), acceptedFormats: milestone.formats?.split(", ") ?? [] }, update: {} });
      }
      for (const studentId of ["dimas", "aisyah"])
        await tx.enrollment.upsert({ where: { eventId_studentId: { eventId: event.id, studentId } }, create: { id: `${event.id}-${studentId}`, eventId: event.id, studentId }, update: {} });
    }

    const submissionId = "kantin:dimas:M1";
    await tx.submission.upsert({ where: { id: submissionId }, create: { id: submissionId, eventId: "kantin", studentId: "dimas", milestoneId: "M1" }, update: {} });
    for (const version of [1, 2]) {
      const id = `${submissionId}:v${version}`;
      await tx.submissionVersion.upsert({ where: { id }, create: { id, submissionId, eventId: "kantin", version, submittedAt: new Date(version === 1 ? "2025-03-10T09:00:00+07:00" : "2025-03-12T09:00:00+07:00"), note: version === 1 ? "Pengumpulan fiktif pertama." : "Revisi fiktif, menunggu penilaian baru." }, update: {} });
      await tx.submissionAttachment.upsert({ where: { versionId_id: { versionId: id, id: "demo-research-file" } }, create: { versionId: id, id: "demo-research-file", name: `Riset_Contoh_v${version}.pdf`, contentType: "application/pdf", sizeBytes: BigInt(1024) }, update: {} });
    }
    await tx.assessment.upsert({ where: { id: `${submissionId}:v1` }, create: { id: `${submissionId}:v1`, submissionVersionId: `${submissionId}:v1`, eventId: "kantin", rubricVersionId: "uiux:v1", assessedByTeacherId: "rina" }, update: {} });
    for (const criterion of initialRubrics[0].criteria)
      await tx.assessmentScore.upsert({ where: { assessmentId_criterionId: { assessmentId: `${submissionId}:v1`, criterionId: criterion.id } }, create: { assessmentId: `${submissionId}:v1`, rubricVersionId: "uiux:v1", criterionId: criterion.id, value: 4 }, update: {} });
    await tx.feedback.upsert({ where: { id: "demo-feedback-revision-v1" }, create: { id: "demo-feedback-revision-v1", submissionVersionId: `${submissionId}:v1`, teacherId: "rina", message: "Perjelas pertanyaan wawancara contoh.", revisionRequested: true, revisionDeadline: new Date("2025-03-13T23:59:00+07:00") }, update: {} });

    await tx.surveyReference.upsert({ where: { id: "demo-learning-survey" }, create: { id: "demo-learning-survey", provider: "demo", externalInstrumentId: "demo-learning-reflection", title: "Survei refleksi contoh", source: "DEMO" }, update: {} });
    const binding = { eventId: "kantin", milestoneId: "M1", surveyReferenceId: "demo-learning-survey" };
    await tx.milestoneSurveyReference.upsert({ where: { eventId_milestoneId_surveyReferenceId: binding }, create: binding, update: {} });
    for (const revision of [1, 2]) {
      await tx.surveyResponseReference.upsert({ where: { id: `${submissionId}:survey:v${revision}` }, create: { id: `${submissionId}:survey:v${revision}`, ...binding, studentId: "dimas", revision, completedAt: new Date(revision === 1 ? "2025-03-10T09:40:00+07:00" : "2025-03-12T10:00:00+07:00"), snapshot: { first: revision === 1 ? 4 : 3, second: 5, reflection: "Jawaban fiktif development." } }, update: {} });
    }
    await tx.surveyReview.upsert({ where: { responseId_reviewerTeacherId: { responseId: `${submissionId}:survey:v1`, reviewerTeacherId: "rina" } }, create: { id: "demo-survey-review-v1", responseId: `${submissionId}:survey:v1`, reviewerTeacherId: "rina", note: "Versi pertama ditinjau; versi berikutnya belum." }, update: {} });

    const types = { competency: "COMPETENCY", technostress: "TECHNOSTRESS", uiux: "UI_UX" } as const;
    const statuses = { not_started: "NOT_STARTED", in_progress: "IN_PROGRESS", awaiting_result: "AWAITING_RESULT", completed: "COMPLETED" } as const;
    for (const record of mockAssessmentRecords.filter((row) => ["dimas", "aisyah"].includes(row.studentId))) {
      await tx.externalAssessmentReference.upsert({ where: { id: record.id }, create: { id: record.id, type: types[record.type], title: record.title, studentId: record.studentId, eventId: record.eventId, provider: "demo", source: "DEMO", status: statuses[record.status], scoreValue: record.result?.score?.value, scoreMaximum: record.result?.score?.maximum, summary: record.result?.summary, feedback: record.feedback, completedAt: record.completedAt ? new Date(record.completedAt) : undefined }, update: {} });
    }
    await tx.developmentSeed.upsert({ where: { id: DEVELOPMENT_SEED_ID }, create: { id: DEVELOPMENT_SEED_ID }, update: {} });
    return { users: await tx.user.count(), events: await tx.event.count(), enrollments: await tx.enrollment.count(), submissions: await tx.submission.count(), externalAssessments: await tx.externalAssessmentReference.count() };
  }, { isolationLevel: "Serializable", timeout: 30000 });
}
