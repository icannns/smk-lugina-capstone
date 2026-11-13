import "server-only";
import { uploadDto } from "../files/service";
import { enrollmentKey, submissionKey } from "../../lib/domain/keys";
import type { Principal } from "../auth/principal";
import type { Transaction } from "./common";
import { asJson, cleanHtml, timestamp, wib } from "./common";
import { getDatabase } from "../db";
import type { WorkspaceSnapshot } from "../../lib/domain/contracts";
import type { ManagedEvent, EventAttachment } from "../../lib/guru/event-types";
import type { CertificateConfig, GuruRubric, TeacherSubmission } from "../../lib/guru/teacher-types";
import type { WorkDraft, SurveyDraft } from "../../lib/siswa/student-types";
import { formatEventDate } from "../../lib/guru/event-selectors";

const empty = <T>(): Record<string,T> => Object.create(null) as Record<string,T>;

export async function workspace(user: Principal, database: Transaction = getDatabase()): Promise<WorkspaceSnapshot> {
  const teacher = user.role === "TEACHER";
  const events = await database.event.findMany({
    where: teacher ? { ownerTeacherId: user.teacher!.id } : { status: { not: "DRAFT" } },
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    include: { _count: { select: { enrollments: true } }, milestones: { orderBy: { position: "asc" }, include: { surveys: { where: { enabled: true } } } }, owner: { select: { user: { select: { name: true } } } }, rubricVersion: true },
  });
  const eventIds = events.map((event) => event.id);
  const enrollmentWhere = { eventId: { in: eventIds }, ...(teacher ? {} : { studentId: user.student!.id }) };
  const enrollments = await database.enrollment.findMany({ where: enrollmentWhere, include: { student: { include: { user: { select: { name: true, email: true } } } } } });
  const enrolledIds = [...new Set(enrollments.map((e) => e.studentId))];
  const submissions = await database.submission.findMany({ where: enrollmentWhere,
    include: { versions: { orderBy: { version: "asc" }, include: { attachments: { include: { upload: true } }, assessment: { include: { scores: true } }, feedback: { orderBy: { createdAt: "asc" } } } } },
  });
  const responses = await database.surveyResponseReference.findMany({ where: enrollmentWhere, orderBy: { revision: "asc" }, include: { reviews: teacher ? { where: { reviewerTeacherId: user.teacher!.id } } : true, binding: { include: { survey: true } } } });
  const rubrics = await database.rubric.findMany({ where: teacher ? { ownerTeacherId: user.teacher!.id } : { versions: { some: { events: { some: { id: { in: eventIds } } } } } }, include: { versions: { orderBy: { version: "desc" }, include: { criteria: { orderBy: { position: "asc" }, include: { levels: { orderBy: { score: "asc" } } } }, events: { select: { id: true } } } } } });
  const profile = teacher ? await database.teacherProfile.findUniqueOrThrow({ where: { id: user.teacher!.id } }) : await database.studentProfile.findUniqueOrThrow({ where: { id: user.student!.id } });
  const state: WorkspaceSnapshot = { accountId: user.id, serverTime: new Date().toISOString(), working: empty(), saved: empty(), published: empty(), deleted: [], storageError: "", rubrics: empty(),
    learning: { source: "api", assessments: empty(), feedback: empty(), submissions: empty(), enrollments: [], students: [] },
    profile: { name: user.name, email: profile.contactEmail ?? user.email ?? "", phone: profile.phone ?? "", role: profile.displayRole ?? (teacher ? "Guru" : "Siswa"), avatar: profile.avatar ?? undefined },
    studentUI: { profiles: empty(), workDrafts: empty(), surveyDrafts: empty(), surveyResponses: empty(), certificates: empty() },
    studentReviews: { notes: empty(), reviews: empty(), reviewedAt: empty(), reviewedResponses: empty() },
  };
  for (const rubric of rubrics) {
    const version = rubric.versions[0]; if (!version) continue;
    const dto: GuruRubric = { id: rubric.id, title: version.title, description: version.description, updated: wib(rubric.updatedAt).slice(0, 10), inUse: rubric.versions.some((v) => v.events.length > 0),
      criteria: version.criteria.map((c) => ({ id: c.id, title: c.title, description: c.description, min: c.minScore, max: c.maxScore, levels: c.levels.map((level) => level.description) })) };
    state.rubrics[dto.id] = dto;
  }
  for (const event of events) {
    const status: ManagedEvent["status"] = event.status === "DRAFT" ? "draft" : event.endsAt && event.endsAt < new Date() ? "ended" : event.startsAt && event.startsAt > new Date() ? "upcoming" : "ongoing";
    const dto: ManagedEvent = { id: event.id, teacherName: event.owner.user.name, participantCount: event._count.enrollments, revision: event.revision, title: event.title, status, mode: "Penyelesaian", updated: wib(event.updatedAt).slice(0, 10), updatedAt: event.updatedAt.toISOString(),
      period: event.startsAt && event.endsAt ? `${formatEventDate(wib(event.startsAt), true)} – ${formatEventDate(wib(event.endsAt), true)}` : "Belum diatur",
      startAt: wib(event.startsAt), endAt: wib(event.endsAt), caseStudyHtml: cleanHtml(event.caseStudyHtml ?? ""), directionsHtml: cleanHtml(event.directionsHtml ?? ""),
      rubricId: event.rubricVersion?.rubricId, rubric: event.rubricVersion?.title,
      certificateConfig: event.certificateConfig ? asJson(event.certificateConfig) as unknown as CertificateConfig : undefined,
      attachments: event.attachments as unknown as EventAttachment[] ?? [],
      wizard: event.wizardState ? event.wizardState as unknown as ManagedEvent["wizard"] : undefined,
      milestones: event.milestones.map((m) => ({ id: m.id, title: m.title, instructions: m.instructions ?? "", deadline: wib(m.deadline), formats: m.acceptedFormats.join(", "), surveyActive: m.surveys.length > 0, attachments: m.attachments as unknown as EventAttachment[] ?? [] })),
    };
    if (status === "draft") state.saved[dto.id] = dto; else state.published[dto.id] = dto;
  }
  for (const e of enrollments) {
    state.learning.enrollments!.push({ id: e.id, eventId: e.eventId, studentId: e.studentId, method: "self" });
    const student = { name: e.student.user.name, email: e.student.contactEmail ?? e.student.user.email ?? "", phone: e.student.phone ?? "", avatar: e.student.avatar ?? undefined };
    if (!state.learning.students!.some((s) => s.id === e.studentId)) state.learning.students!.push({ id: e.studentId, name: student.name, email: student.email });
    state.studentUI.profiles[e.studentId] = student;
    state.studentReviews.notes[e.id] = e.teacherNote;
    const latest = new Map<string, typeof responses[number]>();
    responses.filter((r) => r.eventId === e.eventId && r.studentId === e.studentId).forEach((r) => latest.set(JSON.stringify([r.milestoneId,r.surveyReferenceId]), r));
    const ids = [...latest.values()].filter((r) => r.reviews.length).map((r) => r.id);
    state.studentReviews.reviews[e.id] = latest.size > 0 && ids.length === latest.size;
    state.studentReviews.reviewedResponses![e.id] = ids;
    const reviewDates = [...latest.values()].flatMap((r) => r.reviews.map((review) => review.reviewedAt.toISOString())).sort();
    if (reviewDates.length) state.studentReviews.reviewedAt![e.id] = reviewDates.at(-1)!;
  }
  if (!teacher) state.studentUI.profiles[user.student!.id] = { name: user.name, email: profile.contactEmail ?? user.email ?? "", phone: profile.phone ?? "", avatar: profile.avatar ?? undefined };
  for (const s of submissions) {
    const event = events.find((e) => e.id === s.eventId)!;
    const milestone = event.milestones.find((m) => m.id === s.milestoneId)!;
    const response = responses.filter((r) => r.eventId === s.eventId && r.studentId === s.studentId && r.milestoneId === s.milestoneId).at(-1);
    const dto: TeacherSubmission = { id: s.id, eventId: s.eventId, studentId: s.studentId, milestoneId: s.milestoneId, surveyRequired: milestone.surveys.length > 0, surveyComplete: Boolean(response?.completedAt),
      reflection: response?.snapshot && typeof response.snapshot === "object" && !Array.isArray(response.snapshot) && typeof response.snapshot.reflection === "string" ? response.snapshot.reflection : undefined,
      surveySummary: response ? "Respons tersimpan; skor instrumen eksternal tidak dihitung aplikasi." : undefined,
      instrument: response?.binding.survey.title, completion: response ? "Respons survei tersimpan." : undefined, integration: response ? "Referensi database; provider eksternal belum dihubungkan." : undefined,
      versions: s.versions.map((v) => ({ version: v.version, submittedAt: timestamp(v.submittedAt), file: v.attachments[0]?.name ?? (v.link ? "Tautan project" : "Jawaban teks"), note: v.note ?? "", link: v.link ?? "",
        files: v.attachments.map((f) => (f.upload?.status === "READY" ? uploadDto(f.upload) : { id: f.id, name: f.name, size: Number(f.sizeBytes), type: f.contentType, uploaded: false })) })),
    };
    for (const v of s.versions) {
      if (v.assessment) state.learning.assessments[`${s.id}:v${v.version}`] = { submissionId: s.id, version: v.version, revision: v.assessment.revision, savedAt: timestamp(v.assessment.updatedAt), scores: Object.fromEntries(v.assessment.scores.map((score) => [score.criterionId, score.value.toNumber()])) };
      state.learning.feedback[s.id] = [...(state.learning.feedback[s.id] ?? []), ...v.feedback.map((f) => ({ id: f.id, message: f.message, createdAt: timestamp(f.createdAt), revision: f.revisionRequested, deadline: f.revisionDeadline ? wib(f.revisionDeadline) : undefined, version: v.version }))];
    }
    state.learning.submissions![s.id] = dto;
  }
  for (const r of responses) {
    const key = submissionKey(r.eventId,r.studentId,r.milestoneId);
    const snapshot = r.snapshot as unknown as { first?: number; second?: number; reflection?: string } | null;
    state.studentUI.surveyResponses[key] = { id: r.id, first: snapshot?.first ?? null, second: snapshot?.second ?? null, reflection: snapshot?.reflection ?? "", version: r.revision, submittedAt: r.completedAt ? timestamp(r.completedAt) : "" };
  }
  const drafts = teacher ? [] : await database.submissionDraft.findMany({ where: { ...enrollmentWhere, studentId: teacher ? { in: enrolledIds } : user.student!.id } });
  const uploads = teacher ? [] : await database.submissionUpload.findMany({where:{studentId:user.student!.id,status:"READY",eventId:{in:eventIds}}});
  for (const draft of drafts) {
    // A teacher may read submitted work, never a student's unsubmitted draft.
    if (teacher) continue;
    const key = submissionKey(draft.eventId,draft.studentId,draft.milestoneId);
    state.studentUI.workDrafts[key] = { text: draft.text, link: draft.link, files: (draft.files as unknown as WorkDraft["files"]).map(f => {const upload=uploads.find(u=>u.id===f.id&&u.eventId===draft.eventId&&u.milestoneId===draft.milestoneId);return upload ? uploadDto(upload) : {...f,uploaded:false};}) };
    if (draft.surveyDraft) state.studentUI.surveyDrafts[key] = draft.surveyDraft as unknown as SurveyDraft;
  }
  const claims = await database.prototypeCertificateClaim.findMany({ where: enrollmentWhere });
  for (const c of claims) state.studentUI.certificates[enrollmentKey(c.eventId,c.studentId)] = { id: c.id, eventId: c.eventId, studentId: c.studentId, studentName: c.studentName, score: c.score, claimedAt: timestamp(c.claimedAt), downloadedAt: c.downloadedAt ? timestamp(c.downloadedAt) : undefined };
  return state;
}
