import type { ManagedEvent } from "./event-types";
import type { StudentEnrollment, StudentEvent } from "./student-types";
import { studentEnrollments } from "./student-data";
import { submissionId } from "./learning-data";
import {
  allStudents,
  allSubmissions,
  allEnrollments,
} from "./learning-selectors";
import type { AssessmentChanges } from "./teacher-types";
import { formatEventDate } from "./event-selectors";
import type { StudentUIState } from "../siswa/student-types";
import { initialStudentUI } from "../siswa/student-types";
import type { StudentSession } from "./student-types";
import { initialStudentReviews } from "./student-review-state";
export function studentDirectory(
  events: ManagedEvent[],
  learning: AssessmentChanges = { assessments: {}, feedback: {} },
  studentUI: StudentUIState = initialStudentUI,
  reviews: StudentSession = initialStudentReviews,
) {
  const eventEnrollments = allEnrollments(learning),
    teacherStudents = allStudents(learning),
    teacherSubmissions = allSubmissions(learning);
  const active = events.filter((e) => e.status !== "draft");
  const directoryEvents: StudentEvent[] = active
    .map((e) => ({ id: e.id, title: e.title, milestones: e.milestones }))
    .sort((a, b) => (a.id === "wireframe" ? -1 : b.id === "wireframe" ? 1 : 0));
  const enrollments: StudentEnrollment[] = eventEnrollments.flatMap((e) => {
    const event = active.find((x) => x.id === e.eventId);
    if (!event) return [];
    const original = learning.source === "api" ? undefined : studentEnrollments.find((x) => x.id === e.id);
    const milestones = event.milestones.map((m) => {
      const submission = teacherSubmissions.find(
          (s) => s.eventId === e.eventId && s.studentId === e.studentId && s.milestoneId === m.id,
        ),
        complete = submission?.surveyComplete ?? false,
        previous = original?.milestones.find((x) => x.id === m.id),
        response = submission && studentUI.surveyResponses[submissionId(e.eventId,e.studentId,m.id)];
      return {
        id: m.id,
        title: m.title,
        ...(complete
          ? {
              submittedAt: response?.submittedAt
                ? formatEventDate(response.submittedAt, true)
                : (previous?.submittedAt ?? "Waktu respons tidak tersedia"),
              summary:
                submission?.surveySummary ??
                previous?.summary ??
                `Skor Technostress: ${submission!.surveyScore ?? "—"} / 5.0`,
              instrument: submission?.instrument ?? previous?.instrument,
              completion: submission?.completion ?? previous?.completion,
              integration: submission?.integration ?? previous?.integration,
              reflection:
                response?.reflection ??
                submission?.reflection ??
                previous?.reflection,
              badgeTone: previous?.badgeTone,
            }
          : {}),
      };
    });
    return [
      {
        ...e,
        reviewed:
          (reviews.reviews[e.id] ?? original?.reviewed ?? false) &&
          !event.milestones.some((m) => {
            const response =
              studentUI.surveyResponses[
                submissionId(event.id, e.studentId, m.id)
              ];
            if (!response) return false;
            // New responses need review even when the historical enrollment was reviewed.
            return !reviews.reviewedResponses?.[e.id]?.includes(response.id);
          }),
        completedMilestones: milestones.filter((m) => m.submittedAt).length,
        milestones,
      },
    ];
  });
  return { events: directoryEvents, enrollments, students: teacherStudents };
}
