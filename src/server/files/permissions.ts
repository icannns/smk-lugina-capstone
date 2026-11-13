import "server-only";
import type { Principal } from "../auth/principal";
import type { Transaction } from "../domain/common";
import { enrolled, fail } from "../domain/common";
import { AuthorizationError } from "../auth/authorization";
export type LearningTuple = {
  eventId: string;
  studentId: string;
  milestoneId: string;
};
export async function lockEnrollment(tx: Transaction, key: LearningTuple) {
  const enrollment = await enrolled(tx, key.eventId, key.studentId);
  await tx.$queryRaw`SELECT id FROM "Enrollment" WHERE id=${enrollment.id} FOR UPDATE`;
  return enrollment;
}
export async function assertEditable(
  tx: Transaction,
  key: LearningTuple,
  expectedVersion?: number,
) {
  const milestone = await tx.milestone.findUnique({
    where: { eventId_id: { eventId: key.eventId, id: key.milestoneId } },
  });
  if (!milestone) throw new AuthorizationError(403, "FORBIDDEN");
  const submission = await tx.submission.findUnique({
    where: { eventId_studentId_milestoneId: key },
    include: {
      versions: {
        orderBy: { version: "desc" },
        take: 1,
        include: { feedback: true },
      },
    },
  });
  const latest = submission?.versions[0];
  if (
    expectedVersion !== undefined &&
    (latest?.version ?? 0) !== expectedVersion
  )
    fail("Versi berubah. Muat ulang sebelum mengunggah.", 409, "STALE_VERSION");
  if (latest && !latest.feedback.some((f) => f.revisionRequested))
    fail(
      "Pengumpulan sudah dikirim; tunggu permintaan revisi.",
      409,
      "SUBMISSION_FINAL",
    );
  const previous = await tx.milestone.findMany({
    where: { eventId: key.eventId, position: { lt: milestone.position } },
    include: { surveys: { where: { enabled: true } } },
  });
  for (const m of previous) {
    if (
      !(await tx.submission.count({
        where: {
          eventId: key.eventId,
          studentId: key.studentId,
          milestoneId: m.id,
        },
      }))
    )
      fail("Selesaikan milestone sebelumnya.", 409, "MILESTONE_LOCKED");
    for (const binding of m.surveys)
      if (
        !(await tx.surveyResponseReference.count({
          where: {
            eventId: key.eventId,
            studentId: key.studentId,
            milestoneId: m.id,
            surveyReferenceId: binding.surveyReferenceId,
            completedAt: { not: null },
          },
        }))
      )
        fail("Isi survei wajib sebelumnya.", 409, "MILESTONE_LOCKED");
  }
  return { milestone, submission, latest };
}
export function studentTuple(
  user: Principal,
  eventId: string,
  milestoneId: string,
) {
  if (user.role !== "STUDENT") throw new AuthorizationError(403, "FORBIDDEN");
  return { eventId, milestoneId, studentId: user.student!.id };
}
