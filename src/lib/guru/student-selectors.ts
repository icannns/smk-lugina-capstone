import { studentEnrollments, studentEvents, students } from "./student-data";
import type {
  StudentFilters,
  StudentRecord,
  Student,
  StudentEvent,
  StudentEnrollment,
} from "./student-types";

export function readStudentFilters(params: {
  get: (key: string) => string | null;
}): StudentFilters {
  const page = Number(params.get("page") ?? 1);
  const review = params.get("review");
  return {
    event: params.get("event") ?? "",
    milestone: params.get("milestone") ?? "",
    search: params.get("q") ?? "",
    review: review === "reviewed" || review === "unreviewed" ? review : "all",
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
  };
}

export function studentHref(filters: StudentFilters, student?: string): string {
  const params = new URLSearchParams();
  if (filters.event) params.set("event", filters.event);
  if (filters.milestone) params.set("milestone", filters.milestone);
  if (filters.search) params.set("q", filters.search);
  if (filters.review !== "all") params.set("review", filters.review);
  if (filters.page > 1) params.set("page", String(filters.page));
  if (student) params.set("student", student);
  return `/guru/students${params.size ? `?${params}` : ""}`;
}

export function getStudentRecords(
  filters: StudentFilters,
  reviews: Record<string, boolean>,
  directory: {
    events: StudentEvent[];
    enrollments: StudentEnrollment[];
    students: Student[];
  } = { events: studentEvents, enrollments: studentEnrollments, students },
): StudentRecord[] {
  const event = directory.events.find((e) => e.id === filters.event);
  if (!event) return [];
  return directory.enrollments
    .filter((enrollment) => enrollment.eventId === event.id)
    .flatMap((enrollment) => {
      const student = directory.students.find(
        (s) => s.id === enrollment.studentId,
      )!;
      const reviewed = reviews[enrollment.id] ?? enrollment.reviewed;
      if (
        !student.name
          .toLocaleLowerCase("id")
          .includes(filters.search.trim().toLocaleLowerCase("id"))
      )
        return [];
      if (
        (filters.review === "reviewed" && !reviewed) ||
        (filters.review === "unreviewed" && reviewed)
      )
        return [];
      return enrollment.milestones
        .filter(
          (m) =>
            m.submittedAt && (!filters.milestone || m.id === filters.milestone),
        )
        .map((milestone) => ({
          id: `${enrollment.id}-${milestone.id}`,
          enrollment,
          student,
          event,
          milestone,
        }));
    });
}
