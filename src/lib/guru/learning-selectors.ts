import type { EventMilestone, ManagedEvent } from "./event-types";
import type {
  AssessmentChanges,
  GuruRubric,
  TeacherSubmission,
} from "./teacher-types";
import { eventEnrollments } from "./event-data";
import {
  initialFeedback,
  teacherSubmissions,
  teacherStudents,
} from "./learning-data";
export function workStatus(row: {
  submitted: number;
  completed: number;
  total: number;
}) {
  return row.total > 0 && row.completed === row.total
    ? "complete"
    : row.submitted > 0
      ? "working"
      : "none";
}
export const workLabels = {
  complete: "Selesai",
  working: "Dalam pengerjaan",
  none: "Belum mengerjakan",
};
export function assessmentStatus(row: { reviewed: number; total: number }) {
  return row.reviewed === 0
    ? "none"
    : row.total > 0 && row.reviewed === row.total
      ? "complete"
      : "partial";
}
export const assessmentLabels = {
  none: "Belum dinilai",
  partial: "Sebagian dinilai",
  complete: "Seluruhnya dinilai",
};
export function milestoneLabel(
  event: { milestones: { id: string }[] },
  id: string,
) {
  const index = event.milestones.findIndex((m) => m.id === id);
  return index < 0 ? "Milestone" : `M${index + 1}`;
}
export function allStudents(changes: AssessmentChanges) {
  if (changes.source === "api") return changes.students ?? [];
  const extra = changes.students ?? [],
    byId = new Map(extra.map((s) => [s.id, s]));
  return [
    ...teacherStudents.map((s) => byId.get(s.id) ?? s),
    ...extra.filter((s) => !teacherStudents.some((x) => x.id === s.id)),
  ];
}
export function allEnrollments(changes: AssessmentChanges) {
  if (changes.source === "api") return changes.enrollments ?? [];
  const extra = changes.enrollments ?? [];
  return [
    ...eventEnrollments,
    ...extra.filter(
      (e) =>
        !eventEnrollments.some(
          (x) => x.eventId === e.eventId && x.studentId === e.studentId,
        ),
    ),
  ];
}
export function allSubmissions(changes: AssessmentChanges) {
  if (changes.source === "api") return Object.values(changes.submissions ?? {});
  const extra = changes.submissions ?? {};
  return [
    ...teacherSubmissions.map((s) => extra[s.id] ?? s),
    ...Object.values(extra).filter(
      (s) => !teacherSubmissions.some((x) => x.id === s.id),
    ),
  ];
}
export function assessmentForVersion(
  submission: TeacherSubmission,
  version: number,
  changes: AssessmentChanges,
) {
  return (
    changes.assessments[`${submission.id}:v${version}`]?.scores ??
    submission.versions.find((v) => v.version === version)?.scores
  );
}
export function certificateThreshold(event: ManagedEvent) {
  return Number(
    event.certificateConfig?.threshold ??
      event.certificate?.match(/≥\s*(\d+)/)?.[1] ??
      75,
  );
}
export function assessmentFor(
  submission: TeacherSubmission,
  changes: AssessmentChanges,
) {
  const latest = submission.versions.at(-1)!;
  const saved = changes.assessments[`${submission.id}:v${latest.version}`];
  if (
    feedbackFor(submission.id, changes).some(
      (f) =>
        f.revision &&
        f.version === latest.version &&
        (changes.source === "api" || !saved || f.createdAt > saved.savedAt),
    )
  )
    return undefined;
  return saved?.scores ?? latest.scores;
}
export function feedbackFor(id: string, changes: AssessmentChanges) {
  return [...(changes.source === "api" ? [] : initialFeedback[id] ?? []), ...(changes.feedback[id] ?? [])];
}
export function submissionStatus(
  submission: TeacherSubmission | undefined,
  changes: AssessmentChanges,
) {
  if (!submission) return "missing";
  const latest = submission.versions.at(-1)!;
  const saved = changes.assessments[`${submission.id}:v${latest.version}`];
  if (
    feedbackFor(submission.id, changes).some(
      (f) =>
        f.revision &&
        f.version === latest.version &&
        (changes.source === "api" || !saved || f.createdAt > saved.savedAt),
    )
  )
    return "revision";
  if (assessmentFor(submission, changes)) return "reviewed";
  return submissionComplete(submission) ? "pending" : "survey";
}
export const submissionLabels = {
  missing: "Belum dikumpulkan",
  pending: "Menunggu penilaian",
  reviewed: "Sudah dinilai",
  revision: "Revisi diminta",
  survey: "Survei belum diisi",
};
export function rubricScore(
  values: Record<string, number> | undefined,
  rubric: GuruRubric | undefined,
) {
  if (
    !values ||
    !rubric ||
    !rubric.criteria.length ||
    !rubric.criteria.every(
      (c) =>
        Number.isInteger(values[c.id]) &&
        values[c.id] >= c.min &&
        values[c.id] <= c.max,
    )
  )
    return null;
  const total = rubric.criteria.reduce((sum, c) => sum + values[c.id], 0),
    max = rubric.criteria.reduce((sum, c) => sum + c.max, 0);
  return { total, max, percent: Math.round((total / max) * 100) };
}
export function enrollmentProgress(
  event: ManagedEvent,
  studentId: string,
  changes: AssessmentChanges,
  rubric?: GuruRubric,
) {
  const submissions = event.milestones.map((m) =>
    allSubmissions(changes).find(
      (s) => s.eventId === event.id && s.studentId === studentId && s.milestoneId === m.id,
    ),
  );
  const scored = submissions.map((s) =>
    s && submissionStatus(s, changes) === "reviewed"
      ? rubricScore(assessmentFor(s, changes), rubric)
      : null,
  );
  const submitted = submissions.filter(Boolean).length,
    reviewed = scored.filter(Boolean).length;
  return {
    student: allStudents(changes).find((s) => s.id === studentId) ?? {
      id: studentId,
      name: "Siswa contoh",
      email: "siswa.demo@example.com",
    },
    submissions,
    submitted,
    completed: submissions.filter((s) => submissionComplete(s)).length,
    reviewed,
    total: event.milestones.length,
    score:
      reviewed === event.milestones.length && reviewed > 0
        ? Math.round(
            scored.reduce((sum, s) => sum + (s?.percent ?? 0), 0) / reviewed,
          )
        : null,
  };
}
export function eventLearning(
  event: ManagedEvent,
  changes: AssessmentChanges,
  rubric?: GuruRubric,
) {
  const enrollments = allEnrollments(changes).filter(
    (e) => e.eventId === event.id,
  );
  const rows = enrollments.map((e) =>
    enrollmentProgress(event, e.studentId, changes, rubric),
  );
  const total = rows.length * event.milestones.length,
    submitted = rows.reduce((s, r) => s + r.submitted, 0),
    reviewed = rows.reduce((s, r) => s + r.reviewed, 0);
  const scores = rows.flatMap((r) => (r.score === null ? [] : [r.score]));
  const completed = rows.reduce(
    (sum, r) => sum + r.submissions.filter((s) => submissionComplete(s)).length,
    0,
  );
  return {
    rows,
    total,
    submitted,
    completed,
    reviewed,
    pending: submitted - reviewed,
    finished: rows.filter(
      (r) => r.total > 0 && r.submissions.every((s) => submissionComplete(s)),
    ).length,
    assessed: rows.filter((r) => r.score !== null).length,
    percent: total ? Math.round((completed / total) * 100) : 0,
    average: scores.length
      ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
      : null,
  };
}
export function monitoringHref(
  eventId: string,
  studentId?: string,
  milestoneId?: string,
) {
  const q = new URLSearchParams({ event: eventId });
  if (studentId) q.set("student", studentId);
  if (milestoneId) q.set("milestone", milestoneId);
  return `/guru/monitoring?${q}`;
}

export function submissionComplete(submission: TeacherSubmission | undefined) {
  return Boolean(submission && (submission.surveyRequired === false || submission.surveyComplete));
}

export function milestoneRequiresSurvey(milestone: EventMilestone, submission?: TeacherSubmission) {
  return submission?.surveyRequired ?? milestone.surveyActive !== false;
}
export function milestoneSurveyLabel(milestone: EventMilestone, submission?: TeacherSubmission) {
  return !milestoneRequiresSurvey(milestone, submission) ? "Tidak diwajibkan" : submission?.surveyComplete ? "Terisi" : "Belum diisi";
}
