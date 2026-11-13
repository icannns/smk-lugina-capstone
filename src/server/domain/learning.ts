import "server-only";
import { canonicalFiles } from "../files/service";
import { assertEditable } from "../files/permissions";
import { z } from "zod";
import { isWibDateTime } from "../../lib/guru/event-wizard-validation";
import type { Principal } from "../auth/principal";
import { AuthorizationError } from "../auth/authorization";
import { asJson, date, enrolled, fail, id, ownedEvent, revision, surveyInput, transaction, workInput } from "./common";
import { workspace } from "./workspace";
import { enrollmentProgress } from "../../lib/guru/learning-selectors";
import { certificateConditions } from "../../lib/siswa/selectors";
export async function enroll(user: Principal, eventId: string) {
  return transaction(async (tx) => {
    const event = await tx.event.findFirst({ where: { id: eventId, status: { not: "DRAFT" } } });
    if (!event) throw new AuthorizationError(403, "FORBIDDEN");
    const existing = await tx.enrollment.findUnique({ where: { eventId_studentId: { eventId, studentId: user.student!.id } } });
    if (existing) return { enrollmentId: existing.id, created: false };
    if (event.endsAt && event.endsAt < new Date()) fail("Pendaftaran event telah berakhir.", 409, "ENROLLMENT_CLOSED");
    const row = await tx.enrollment.create({ data: { eventId, studentId: user.student!.id } });
    return { enrollmentId: row.id, created: true };
  });
}
export async function studentWork(user: Principal, eventId: string, milestoneId: string, raw: unknown, submit: boolean) {
  const input = z.object({ work: workInput, expectedVersion: revision.optional(), requestId: id.optional() }).strict().parse(raw);
  return transaction(async (tx) => {
    const enrollment = await enrolled(tx, eventId, user.student!.id);
    await tx.$queryRaw`SELECT id FROM "Enrollment" WHERE id=${enrollment.id} FOR UPDATE`;
    const milestone = await tx.milestone.findUnique({ where: { eventId_id: { eventId, id: milestoneId } } });
    if (!milestone) throw new AuthorizationError(403, "FORBIDDEN");
    const key = { eventId, studentId: user.student!.id, milestoneId };
    if (!submit) {
      await assertEditable(tx,key);
      input.work.files = await canonicalFiles(tx,key,input.work.files);
      await tx.submissionDraft.upsert({ where: { eventId_studentId_milestoneId: key }, create: { ...key, ...input.work, files: asJson(input.work.files) }, update: { ...input.work, files: asJson(input.work.files) } });
      return { saved: true };
    }
    if (!input.requestId || input.expectedVersion === undefined) fail("requestId dan expectedVersion wajib diisi.");
    if (!input.work.text.trim() && !input.work.link && !input.work.files.length) fail("Tambahkan teks, tautan, atau file yang sudah diunggah.");
    if (input.work.link && milestone.acceptedFormats.length && !milestone.acceptedFormats.includes("Hyperlink")) fail("Milestone tidak menerima tautan.");
    const old = await tx.submission.findUnique({ where: { eventId_studentId_milestoneId: key }, include: { versions: { orderBy: { version: "desc" }, take: 1, include: { feedback: true } } } });
    const duplicate = await tx.submissionVersion.findUnique({ where: { requestId: input.requestId } });
    if (duplicate) {
      if (duplicate.submissionId !== old?.id) fail("requestId telah digunakan.", 409, "CONFLICT");
      return { submissionId: old!.id, version: duplicate.version, replay: true };
    }
    await assertEditable(tx,key,input.expectedVersion);
    input.work.files = await canonicalFiles(tx,key,input.work.files);
    const submission = old ?? await tx.submission.create({ data: key });
    const version = (old?.versions[0]?.version ?? 0) + 1;
    const row = await tx.submissionVersion.create({ data: { id: `${submission.id}:v${version}`, submissionId: submission.id, eventId, version, requestId: input.requestId, submittedAt: new Date(), note: input.work.text, link: input.work.link,
      attachments: { create: input.work.files.map((f) => ({ id: f.id, uploadId: f.id, name: f.name, contentType: f.type, sizeBytes: BigInt(f.size) })) } } });
    await tx.submissionDraft.deleteMany({ where: key });
    return { submissionId: submission.id, version: row.version };
  });
}
export async function assess(user: Principal, submissionId: string, raw: unknown) {
  const input = z.object({ version: revision, expectedRevision: revision, scores: z.record(id, z.number().int()), requestId: id }).strict().parse(raw);
  return transaction(async (tx) => {
    const submission = await tx.submission.findUnique({ where: { id: submissionId }, include: { versions: { orderBy: { version: "desc" }, take: 1 } } });
    if (!submission) throw new AuthorizationError(403, "FORBIDDEN");
    const event = await ownedEvent(tx, submission.eventId, user.teacher!.id);
    await tx.$queryRaw`SELECT id FROM "Enrollment" WHERE "eventId"=${submission.eventId} AND "studentId"=${submission.studentId} FOR UPDATE`;
    const latest = await tx.submissionVersion.findFirst({ where: { submissionId }, orderBy: { version: "desc" } });
    if (!latest || latest.version !== input.version) fail("Versi terbaru berbeda. Periksa revisi terbaru.", 409, "STALE_VERSION");
    if (await tx.feedback.findFirst({ where: { submissionVersionId: latest.id, revisionRequested: true } })) fail("Tunggu pengumpulan revisi baru sebelum menilai kembali.", 409, "REVISION_PENDING");
    if (!event.rubricVersionId) fail("Event belum memiliki rubrik.", 409, "RUBRIC_REQUIRED");
    const bindings = await tx.milestoneCriterion.findMany({ where: { eventId: event.id, milestoneId: submission.milestoneId }, include: { criterion: true } });
    const criteria = bindings.length ? bindings.map((b) => b.criterion) : await tx.rubricCriterion.findMany({ where: { rubricVersionId: event.rubricVersionId } });
    if (!criteria.length || Object.keys(input.scores).length !== criteria.length || criteria.some((c) => !Number.isInteger(input.scores[c.id]) || input.scores[c.id] < c.minScore || input.scores[c.id] > c.maxScore)) fail("Semua skor harus sesuai kriteria dan rentang rubrik.");
    const old = await tx.assessment.findUnique({ where: { submissionVersionId: latest.id }, include: { scores: true } });
    if (old && criteria.every((c) => old.scores.find((score) => score.criterionId === c.id)?.value.toNumber() === input.scores[c.id])) return { id: old.id, revision: old.revision, replay: true };
    if ((old?.revision ?? 0) !== input.expectedRevision) fail("Penilaian sudah diubah sesi lain.", 409, "STALE_REVISION");
    const assessment = await tx.assessment.upsert({ where: { submissionVersionId: latest.id }, create: { id: `${submissionId}:v${input.version}`, revision: 1, submissionVersionId: latest.id, eventId: event.id, rubricVersionId: event.rubricVersionId, assessedByTeacherId: user.teacher!.id }, update: { revision: { increment: 1 }, assessedByTeacherId: user.teacher!.id } });
    for (const c of criteria) await tx.assessmentScore.upsert({ where: { assessmentId_criterionId: { assessmentId: assessment.id, criterionId: c.id } }, create: { assessmentId: assessment.id, criterionId: c.id, rubricVersionId: event.rubricVersionId, value: input.scores[c.id] }, update: { value: input.scores[c.id] } });
    return { id: assessment.id, revision: assessment.revision };
  });
}
export async function feedback(user: Principal, submissionId: string, raw: unknown) {
  const input = z.object({ id, message: z.string().trim().min(1).max(5000), revision: z.boolean(), deadline: z.string().max(19).refine((value) => !value || isWibDateTime(value)).optional(), version: revision }).strict().parse(raw);
  return transaction(async (tx) => {
    const submission = await tx.submission.findUnique({ where: { id: submissionId } });
    if (!submission) throw new AuthorizationError(403, "FORBIDDEN");
    await ownedEvent(tx, submission.eventId, user.teacher!.id);
    await tx.$queryRaw`SELECT id FROM "Enrollment" WHERE "eventId"=${submission.eventId} AND "studentId"=${submission.studentId} FOR UPDATE`;
    const latest = await tx.submissionVersion.findFirst({ where: { submissionId }, orderBy: { version: "desc" } });
    if (!latest || latest.version !== input.version) fail("Versi terbaru berbeda.", 409, "STALE_VERSION");
    const old = await tx.feedback.findUnique({ where: { id: input.id } });
    if (old) { if (old.submissionVersionId !== latest.id || old.teacherId !== user.teacher!.id) throw new AuthorizationError(403, "FORBIDDEN"); return { id: old.id, replay: true }; }
    const milestone = await tx.milestone.findUniqueOrThrow({ where: { eventId_id: { eventId: submission.eventId, id: submission.milestoneId } } });
    const deadline = input.revision && input.deadline ? date(input.deadline) : null;
    if (input.revision && milestone.deadline && milestone.deadline < new Date() && !deadline) fail("Batas revisi wajib diisi karena deadline telah lewat.");
    if (deadline && (!Number.isFinite(deadline.getTime()) || deadline <= new Date())) fail("Batas revisi harus setelah sekarang.");
    const row = await tx.feedback.create({ data: { id: input.id, submissionVersionId: latest.id, teacherId: user.teacher!.id, message: input.message, revisionRequested: input.revision, revisionDeadline: deadline } });
    return { id: row.id };
  });
}
export async function survey(user: Principal, eventId: string, milestoneId: string, raw: unknown, draft: boolean) {
  if (draft) {
    const input = z.object({ first: z.number().int().min(1).max(5).nullable(), second: z.number().int().min(1).max(5).nullable(), reflection: z.string().max(5000) }).strict().parse(raw);
    return transaction(async (tx) => { await enrolled(tx, eventId, user.student!.id);
      const bindings = await tx.milestoneSurveyReference.findMany({ where: { eventId, milestoneId, enabled: true }, include: { survey: true } });
      if (bindings.length !== 1 || bindings[0].survey.source !== "DEMO") fail("Provider/instrumen survei ini belum terintegrasi.", 501, "PROVIDER_UNAVAILABLE");
      const key = { eventId, studentId: user.student!.id, milestoneId };
      await tx.submissionDraft.upsert({ where: { eventId_studentId_milestoneId: key }, create: { ...key, files: [], surveyDraft: asJson(input) }, update: { surveyDraft: asJson(input) } }); return { saved: true }; });
  }
  const input = surveyInput.parse(raw);
  return transaction(async (tx) => {
    await enrolled(tx, eventId, user.student!.id);
    const submission = await tx.submission.findUnique({ where: { eventId_studentId_milestoneId: { eventId, studentId: user.student!.id, milestoneId } } });
    if (!submission) fail("Kumpulkan tugas sebelum mengisi survei.", 409);
    const bindings = await tx.milestoneSurveyReference.findMany({ where: { eventId, milestoneId, enabled: true }, include: { survey: true } });
    if (bindings.length !== 1 || bindings[0].survey.source !== "DEMO") fail("Provider/instrumen survei ini belum terintegrasi.", 501, "PROVIDER_UNAVAILABLE");
    const surveyReferenceId = bindings[0].surveyReferenceId;
    const old = await tx.surveyResponseReference.findFirst({ where: { eventId, milestoneId, studentId: user.student!.id, surveyReferenceId }, orderBy: { revision: "desc" } });
    if (old) {
      if (!old.snapshot || typeof old.snapshot !== "object" || Array.isArray(old.snapshot) || old.snapshot.first !== input.first || old.snapshot.second !== input.second || old.snapshot.reflection !== input.reflection) fail("Jawaban sudah dikirim dan dikunci.", 409, "RESPONSE_LOCKED");
      return { id: old.id, replay: true };
    }
    const response = await tx.surveyResponseReference.create({ data: { eventId, milestoneId, studentId: user.student!.id, surveyReferenceId, revision: 1, completedAt: new Date(), snapshot: asJson(input) } });
    return { id: response.id };
  });
}
export async function claimCertificate(user: Principal, eventId: string) {
  return transaction(async (tx) => {
    await enrolled(tx, eventId, user.student!.id);
    const state = await workspace(user, tx); const event = state.published[eventId];
    if (!event) throw new AuthorizationError(403, "FORBIDDEN");
    const row = enrollmentProgress(event, user.student!.id, state.learning, state.rubrics[event.rubricId ?? ""]);
    if (!certificateConditions(event, row, state.learning).eligible) fail("Lengkapi pekerjaan, survei wajib dan penilaian tanpa revisi terbuka.", 409, "COMPLETION_REQUIRED");
    const claim = await tx.prototypeCertificateClaim.upsert({ where: { eventId_studentId: { eventId, studentId: user.student!.id } }, create: { eventId, studentId: user.student!.id, studentName: user.name, score: row.score! }, update: {} });
    return { id: claim.id, prototype: true };
  });
}
