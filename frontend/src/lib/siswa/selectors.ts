import type { DemoAccount } from "../auth/accounts";
import type { ManagedEvent } from "../guru/event-types";
import type { AssessmentChanges } from "../guru/teacher-types";
import {
  allSubmissions,
  allEnrollments,
  allStudents,
  eventLearning,
  submissionStatus,
  certificateThreshold,
} from "../guru/learning-selectors";
import { submissionId } from "../guru/learning-data";
import type { StudentProfile, StudentUIState } from "./student-types";
export const workHref = (eventId: string, milestone?: string) =>
  `/siswa/workspace?event=${encodeURIComponent(eventId)}${milestone ? `&milestone=${encodeURIComponent(milestone)}` : ""}`;
export const surveyHref = (
  eventId: string,
  milestone: string,
  mode = "instructions",
) =>
  `/siswa/survey?event=${encodeURIComponent(eventId)}&milestone=${encodeURIComponent(milestone)}&mode=${mode}`;
export const projectHref = (eventId: string) =>
  `/siswa/portfolio?event=${encodeURIComponent(eventId)}&view=project`;
export function isEnrolled(
  eventId: string,
  studentId: string,
  learning: AssessmentChanges,
) {
  return allEnrollments(learning).some(
    (e) => e.eventId === eventId && e.studentId === studentId,
  );
}
export function milestoneUnlocked(
  event: ManagedEvent,
  studentId: string,
  index: number,
  learning: AssessmentChanges,
) {
  const submissions = allSubmissions(learning);
  return (
    index >= 0 &&
    (index === 0 ||
      Boolean(
        submissions.find(
          (s) =>
            s.id ===
            submissionId(event.id, studentId, event.milestones[index]?.id),
        ),
      ) ||
      event.milestones
        .slice(0, index)
        .every((m) =>
          submissions.some(
            (s) =>
              s.id === submissionId(event.id, studentId, m.id) &&
              s.surveyComplete,
          ),
        ))
  );
}
export function studentProfileFor(
  account: DemoAccount,
  learning: AssessmentChanges,
  ui: StudentUIState,
): StudentProfile {
  const profile = ui.profiles[account.studentId ?? ""];
  if (profile) return profile;
  const known = allStudents(learning).find((s) => s.id === account.studentId);
  return {
    name: account.name,
    email: known?.email ?? account.email,
    phone: "",
    avatar: undefined,
  };
}
export function certificateConditions(
  event: ManagedEvent,
  row: ReturnType<typeof eventLearning>["rows"][number],
  learning: AssessmentChanges,
) {
  const tasks = row.total > 0 && row.completed === row.total,
    assessed = row.total > 0 && row.reviewed === row.total,
    threshold = certificateThreshold(event),
    score = row.score !== null && row.score >= threshold,
    noRevision = !row.submissions.some(
      (s) => submissionStatus(s, learning) === "revision",
    );
  return {
    tasks,
    assessed,
    threshold,
    score,
    noRevision,
    eligible: tasks && assessed && score && noRevision,
  };
}
