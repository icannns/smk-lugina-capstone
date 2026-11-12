import "server-only";
import { z } from "zod";
import { AuthorizationError } from "../auth/authorization";
import type { Principal } from "../auth/principal";
import { asJson, cleanHtml, date, eventInput, fail, ownedEvent, rubricInput, transaction, type Transaction } from "./common";

async function assignCriteria(tx: Transaction, eventId: string, rubricVersionId: string | null) {
  await tx.milestoneCriterion.deleteMany({ where: { eventId } });
  if (!rubricVersionId) return;
  const criteria = await tx.rubricCriterion.findMany({ where: { rubricVersionId } });
  const milestones = await tx.milestone.findMany({ where: { eventId } });
  if (criteria.length && milestones.length) await tx.milestoneCriterion.createMany({ data: milestones.flatMap((m) => criteria.map((c) => ({ eventId, milestoneId: m.id, rubricVersionId, criterionId: c.id }))) });
}
export async function writeEvent(user: Principal, input: unknown, action: "create" | "update" | "publish") {
  const event = eventInput.parse(input);
  if (new Set(event.milestones.map((m) => m.id)).size !== event.milestones.length) fail("ID milestone harus unik dalam event.");
  if (event.startAt && event.endAt && event.endAt < event.startAt) fail("Deadline tidak boleh sebelum tanggal mulai.");
  return transaction(async (tx) => {
    let existing = await tx.event.findUnique({ where: { id: event.id } });
    if (existing) {
      await tx.$queryRaw`SELECT id FROM "Event" WHERE id=${event.id} FOR UPDATE`;
      existing = await ownedEvent(tx, event.id, user.teacher!.id);
      if (action === "create") return { id: existing.id, revision: existing.revision, created: false };
      if (action === "publish" && existing.status !== "DRAFT") return { id: existing.id, revision: existing.revision, published: true };
      if (event.revision !== existing.revision) fail("Draf berubah di sesi lain. Muat ulang sebelum menyimpan.", 409, "STALE_REVISION");
    } else if (action !== "create") throw new AuthorizationError(403, "FORBIDDEN");
    let rubricVersionId: string | null = null;
    if (event.rubricId) {
      const rubric = await tx.rubric.findFirst({ where: { id: event.rubricId, ownerTeacherId: user.teacher!.id }, include: { versions: { orderBy: { version: "desc" }, take: 1 } } });
      if (!rubric?.versions[0]) throw new AuthorizationError(403, "FORBIDDEN");
      rubricVersionId = rubric.versions[0].id;
    }
    if (existing && existing.status !== "DRAFT" && existing.rubricVersionId !== rubricVersionId) fail("Rubrik event terbit adalah snapshot dan tidak dapat diganti.", 409, "SNAPSHOT_LOCKED");
    if (action === "publish") {
      const plain = cleanHtml(event.caseStudyHtml).replace(/<[^>]+>/g, "").trim();
      if (!event.title.trim() || !plain || !event.startAt || !event.endAt || !rubricVersionId || !event.milestones.length ||
          event.milestones.some((m) => !m.title.trim() || !m.deadline || !m.formats?.trim())) fail("Lengkapi informasi, milestone, dan rubrik sebelum terbit.");
      const c = event.certificateConfig;
      if (!c || !c.threshold.trim() || !Number.isFinite(Number(c.threshold)) || Number(c.threshold) < 0 || Number(c.threshold) > 100 ||
          (c.mode === "template" ? !c.template : ![c.name, c.organizer, c.issuedAt, c.signer, c.signerRole].every((value) => value.trim()))) fail("Konfigurasi dokumen penyelesaian belum lengkap.");
    }
    if (existing && existing.rubricVersionId !== rubricVersionId) await tx.milestoneCriterion.deleteMany({ where: { eventId: event.id } });
    const data = { title: event.title.trim(), caseStudyHtml: cleanHtml(event.caseStudyHtml), directionsHtml: cleanHtml(event.directionsHtml), startsAt: date(event.startAt), endsAt: date(event.endAt),
      rubricVersionId, attachments: asJson(event.attachments ?? []), wizardState: event.wizard ? asJson(event.wizard) : undefined,
      certificateConfig: event.certificateConfig ? asJson(event.certificateConfig) : undefined,
    };
    if (!existing) existing = await tx.event.create({ data: { ...data, id: event.id, ownerTeacherId: user.teacher!.id, status: "DRAFT" } });
    else existing = await tx.event.update({ where: { id: event.id }, data: { ...data, revision: { increment: 1 } } });
    const oldMilestones = await tx.milestone.findMany({ where: { eventId: event.id } });
    const removed = oldMilestones.filter((m) => !event.milestones.some((next) => next.id === m.id)).map((m) => m.id);
    if (removed.length) {
      if (await tx.submission.count({ where: { eventId: event.id, milestoneId: { in: removed } } }) ||
          await tx.submissionDraft.count({ where: { eventId: event.id, milestoneId: { in: removed } } }) ||
          await tx.surveyResponseReference.count({ where: { eventId: event.id, milestoneId: { in: removed } } })) fail("Milestone berisi pekerjaan atau respons dan tidak dapat dihapus.", 409, "HISTORY_EXISTS");
      await tx.milestoneCriterion.deleteMany({ where: { eventId: event.id, milestoneId: { in: removed } } });
      await tx.milestoneSurveyReference.deleteMany({ where: { eventId: event.id, milestoneId: { in: removed } } });
      await tx.milestone.deleteMany({ where: { eventId: event.id, id: { in: removed } } });
    }
    await tx.milestone.updateMany({ where: { eventId: event.id }, data: { position: { increment: 1000000 } } });
    for (const [index, m] of event.milestones.entries()) {
      const data = { title: m.title.trim(), instructions: cleanHtml(m.instructions), deadline: date(m.deadline), acceptedFormats: m.formats?.split(",").map((f) => f.trim()).filter(Boolean) ?? [], position: index + 1, attachments: asJson(m.attachments ?? []) };
      await tx.milestone.upsert({ where: { eventId_id: { eventId: event.id, id: m.id } }, create: { eventId: event.id, id: m.id, ...data }, update: data });
      // Existing references own survey availability; client booleans cannot create instruments.
      if (m.surveyActive === true && !await tx.milestoneSurveyReference.count({ where: { eventId: event.id, milestoneId: m.id, enabled: true } }))
        fail("Tautkan referensi instrumen yang tersedia sebelum mewajibkan survei.", 409, "SURVEY_REFERENCE_REQUIRED");
      if (m.surveyActive === false) {
        if (await tx.surveyResponseReference.count({ where: { eventId: event.id, milestoneId: m.id } })) fail("Survei yang sudah memiliki respons tidak dapat dilepas.", 409, "HISTORY_EXISTS");
        await tx.milestoneSurveyReference.updateMany({ where: { eventId: event.id, milestoneId: m.id }, data: { enabled: false } });
      }
    }
    await assignCriteria(tx, event.id, rubricVersionId);
    if (action === "publish") await tx.event.update({ where: { id: event.id }, data: { status: event.endAt! < new Date().toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" }).replace(" ", "T") ? "ENDED" : "UPCOMING", publishedAt: new Date() } });
    return { id: event.id, revision: existing.revision, published: action === "publish" };
  });
}
export async function deleteDraft(user: Principal, eventId: string, expectedRevision: number) {
  return transaction(async (tx) => {
    const event = await ownedEvent(tx, eventId, user.teacher!.id);
    if (event.status !== "DRAFT") fail("Hanya draf tanpa peserta/riwayat yang dapat dihapus.", 409, "HISTORY_EXISTS");
    if (event.revision !== expectedRevision) fail("Draf sudah berubah.", 409, "STALE_REVISION");
    if (await tx.enrollment.count({ where: { eventId } })) fail("Draf masih memiliki peserta.", 409, "HISTORY_EXISTS");
    await tx.milestoneCriterion.deleteMany({ where: { eventId } });
    await tx.milestoneSurveyReference.deleteMany({ where: { eventId } });
    await tx.milestone.deleteMany({ where: { eventId } }); await tx.event.delete({ where: { id: eventId } }); return { deleted: true };
  });
}
export async function writeRubric(user: Principal, raw: unknown, create: boolean) {
  const input = rubricInput.parse(raw);
  if (input.criteria.reduce((sum,c) => sum + c.max,0) <= 0) fail("Skor maksimum total harus lebih dari nol.");
  if (input.id.length > 150 || new Set(input.criteria.map((c) => c.id)).size !== input.criteria.length) fail("ID rubrik/kriteria tidak valid.");
  return transaction(async (tx) => {
    const old = await tx.rubric.findUnique({ where: { id: input.id }, include: { versions: { orderBy: { version: "desc" }, include: { events: true } } } });
    if (old && old.ownerTeacherId !== user.teacher!.id) throw new AuthorizationError(403, "FORBIDDEN");
    if (create && old) fail("ID rubrik telah digunakan.", 409, "CONFLICT");
    if (!create && !old) throw new AuthorizationError(403, "FORBIDDEN");
    if (old?.versions.some((v) => v.events.length)) fail("Rubrik terpakai adalah snapshot; buat salinan rubrik baru.", 409, "SNAPSHOT_LOCKED");
    const logical = await tx.rubric.upsert({ where: { id: input.id }, create: { id: input.id, ownerTeacherId: user.teacher!.id, title: input.title }, update: { title: input.title } });
    const versionId = old?.versions[0]?.id ?? `${input.id}:v1`;
    await tx.rubricVersion.upsert({ where: { id: versionId }, create: { id: versionId, rubricId: logical.id, version: 1, title: input.title, description: input.description }, update: { title: input.title, description: input.description } });
    await tx.rubricCriterionLevel.deleteMany({ where: { rubricVersionId: versionId } });
    await tx.rubricCriterion.deleteMany({ where: { rubricVersionId: versionId } });
    for (const [index, c] of input.criteria.entries()) {
      await tx.rubricCriterion.create({ data: { id: c.id, rubricVersionId: versionId, position: index + 1, title: c.title, description: c.description, minScore: c.min, maxScore: c.max } });
      for (const [offset, description] of (c.levels ?? []).entries()) {
        if (c.min + offset > c.max) fail("Jumlah level melebihi rentang skor.");
        await tx.rubricCriterionLevel.create({ data: { rubricVersionId: versionId, criterionId: c.id, score: c.min + offset, description } });
      }
    }
    return { id: input.id };
  });
}
export const eventBody = z.object({ event: eventInput }).strict();
