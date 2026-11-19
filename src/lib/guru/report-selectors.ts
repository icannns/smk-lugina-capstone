import type { ManagedEvent } from "./event-types";
import type { AssessmentChanges, GuruRubric } from "./teacher-types";
import {
  assessmentFor,
  milestoneRequiresSurvey,
  milestoneSurveyLabel,
  submissionComplete,
  eventLearning,
  rubricScore,
  submissionStatus,
  certificateThreshold,
  eventCompletionStatus,
  eventCompletionLabels,
  assessmentStatus,
  assessmentLabels,
  milestoneLabel,
} from "./learning-selectors";
import { formatEventDate } from "./event-selectors";
export type ReportFilters = {
  event: string;
  survey: string;
  student: string;
  work: string;
  assessment: string;
  milestone: string;
};
export const emptyReportFilters: ReportFilters = {
  event: "",
  survey: "all",
  student: "all",
  work: "all",
  assessment: "all",
  milestone: "all",
};
export function reportRows(
  event: ManagedEvent,
  changes: AssessmentChanges,
  rubric: GuruRubric | undefined,
  filters: ReportFilters,
) {
  const data = eventLearning(event, changes, rubric),
    milestones = event.milestones.filter(
      (m) => filters.milestone === "all" || m.id === filters.milestone,
    );
  const rows = data.rows
    .map((r) => {
      const submissions = milestones.map(
          (m) =>
            r.submissions[event.milestones.findIndex((x) => x.id === m.id)],
        ),
        submitted = submissions.filter(Boolean).length,
        completed = submissions.filter(submissionComplete).length,
        scored = submissions.map((s) =>
          s && submissionStatus(s, changes) === "reviewed"
            ? rubricScore(assessmentFor(s, changes), rubric)
            : null,
        ),
        reviewed = scored.filter(Boolean).length,
        total = milestones.length;
      return {
        ...r,
        eventProgress: {
          completed: r.completed,
          total: r.total,
          score: r.score,
          status: eventCompletionStatus(r),
        },
        certificateEligible:
          r.score !== null &&
          r.completed === r.total &&
          r.score >= certificateThreshold(event),
        submissions,
        submitted,
        completed,
        reviewed,
        total,
        scored,
        score:
          total > 0 && reviewed === total
            ? Math.round(
                scored.reduce((s, v) => s + (v?.percent ?? 0), 0) / total,
              )
            : null,
      };
    })
    .filter((r) => {
      const required = r.submissions.filter((s, i) => milestoneRequiresSurvey(milestones[i], s));
      return (filters.student === "all" || r.student.id === filters.student) &&
        (filters.survey === "all" ||
          (filters.survey === "complete" && required.length > 0 && required.every((s) => s?.surveyComplete)) ||
          (filters.survey === "missing" && required.some((s) => !s?.surveyComplete))) &&
        (filters.work === "all" || filters.work === r.eventProgress.status) &&
        (filters.assessment === "all" || filters.assessment === assessmentStatus(r));
    });
  const finished = rows.filter(
      (r) => r.eventProgress.status === "complete",
    ).length,
    scores = rows.flatMap((r) => (r.eventProgress.score === null ? [] : [r.eventProgress.score])),
    total = rows.reduce((s, r) => s + r.eventProgress.total, 0),
    complete = rows.reduce((s, r) => s + r.eventProgress.completed, 0);
  return {
    rows,
    milestones,
    finished,
    scored: scores.length,
    percent: total ? Math.round((complete / total) * 100) : 0,
    average: scores.length
      ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
      : null,
  };
}
export function reportExport(
  event: ManagedEvent,
  data: ReturnType<typeof reportRows>,
) {
  return [
    ["PROTOTIPE — DATA FIKTIF"],
    [event.title],
    [
      "Nama",
      "Progres",
      "Pengerjaan",
      ...data.milestones.map(
        (m) => `${milestoneLabel(event, m.id)} (tugas · survei · nilai)`,
      ),
      "Skor rubrik",
      "Nilai konversi",
      "Status nilai",
      "Nilai akhir",
      "Sertifikat contoh",
    ],
    ...data.rows.map((r) => [
      r.student.name,
      `${r.eventProgress.completed} dari ${r.eventProgress.total}`,
      eventCompletionLabels[r.eventProgress.status],
      ...r.submissions.map((s, i) =>
        s
          ? `${formatEventDate(s.versions.at(-1)!.submittedAt)} · ${milestoneSurveyLabel(data.milestones[i], s)} · ${r.scored[i]?.percent ?? "Belum dinilai"}`
          : "— · — · Belum dinilai",
      ),
      r.scored.filter(Boolean).length
        ? r.scored.reduce((sum, s) => sum + (s?.total ?? 0), 0)
        : "",
      r.scored.map((s) => s?.percent ?? "").join(", "),
      assessmentLabels[assessmentStatus(r)],
      r.eventProgress.score ?? "",
      r.certificateEligible ? "Contoh tersedia" : "Belum memenuhi",
    ]),
  ];
}
