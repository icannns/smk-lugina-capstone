import {
  initialStudentUI,
  STUDENT_NAME_MAX_LENGTH,
  type StudentUIState,
} from "./student-types";
import type {
  AssessmentChanges,
  TeacherSubmission,
} from "../guru/teacher-types";
import type { EventAttachment } from "../guru/event-types";
const record = (v: unknown): v is Record<string, unknown> =>
    typeof v === "object" && v !== null && !Array.isArray(v),
  text = (v: unknown) => (typeof v === "string" ? v : "");
export function parseFiles(value: unknown): EventAttachment[] {
  return Array.isArray(value)
    ? value
        .filter(record)
        .filter(
          (f) =>
            typeof f.name === "string" &&
            typeof f.size === "number" &&
            Number.isFinite(f.size) &&
            f.size >= 0,
        )
        .slice(0, 5)
        .map((f, i) => ({
          id: text(f.id) || `file-${i}`,
          name: text(f.name),
          size: Number(f.size),
          type: text(f.type),
        }))
    : [];
}
function entries(value: unknown) {
  return record(value) ? Object.entries(value) : [];
}
const choice = (v: unknown) =>
  typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 5 ? v : null;
export function parseStudentUI(value: unknown): StudentUIState {
  if (!record(value)) return initialStudentUI;
  const result: StudentUIState = {
    workDrafts: {},
    surveyDrafts: {},
    surveyResponses: {},
    profiles: {},
    certificates: {},
  };
  for (const [key, v] of entries(value.workDrafts))
    if (record(v))
      result.workDrafts[key] = {
        files: parseFiles(v.files),
        text: text(v.text),
        link: text(v.link),
      };
  for (const [key, v] of entries(value.surveyDrafts))
    if (record(v))
      result.surveyDrafts[key] = {
        first: choice(v.first),
        second: choice(v.second),
        reflection: text(v.reflection),
      };
  for (const [key, v] of entries(value.surveyResponses))
    if (
      record(v) &&
      choice(v.first) &&
      choice(v.second) &&
      typeof v.id === "string"
    )
      result.surveyResponses[key] = {
        id: v.id,
        first: choice(v.first),
        second: choice(v.second),
        reflection: text(v.reflection),
        submittedAt: text(v.submittedAt),
        version: Number(v.version) || 1,
      };
  for (const [key, v] of entries(value.profiles))
    if (
      record(v) &&
      text(v.name).trim() &&
      /^[^\s@]+@example\.com$/i.test(text(v.email))
    )
      result.profiles[key] = {
        name: text(v.name).slice(0, STUDENT_NAME_MAX_LENGTH),
        email: text(v.email),
        phone: text(v.phone).slice(0, 30),
        avatar:
          /^data:image\/(jpeg|png);base64,/.test(text(v.avatar)) &&
          text(v.avatar).length < 400000
            ? text(v.avatar)
            : undefined,
      };
  for (const [key, v] of entries(value.certificates))
    if (
      record(v) &&
      text(v.id).startsWith("DEMO-") &&
      typeof v.score === "number"
    )
      result.certificates[key] = {
        id: text(v.id),
        eventId: text(v.eventId),
        studentId: text(v.studentId),
        studentName: text(v.studentName),
        score: v.score,
        claimedAt: text(v.claimedAt),
        downloadedAt: text(v.downloadedAt) || undefined,
      };
  return result;
}
export function parseLearningExtras(
  value: Record<string, unknown>,
): Pick<AssessmentChanges, "students" | "enrollments" | "submissions"> {
  const students = Array.isArray(value.students)
    ? value.students
        .filter(record)
        .filter(
          (s) =>
            text(s.id) &&
            text(s.name) &&
            /^[^\s@]+@example\.com$/i.test(text(s.email)),
        )
        .map((s) => ({
          id: text(s.id),
          name: text(s.name),
          email: text(s.email),
        }))
    : [];
  const enrollments = Array.isArray(value.enrollments)
    ? value.enrollments
        .filter(record)
        .filter((e) => text(e.id) && text(e.studentId) && text(e.eventId))
        .map((e) => ({
          id: text(e.id),
          studentId: text(e.studentId),
          eventId: text(e.eventId),
          method: "self" as const,
        }))
    : [];
  const submissions: Record<string, TeacherSubmission> = {};
  for (const [id, v] of entries(value.submissions)) {
    if (
      !record(v) ||
      !text(v.eventId) ||
      !text(v.studentId) ||
      !text(v.milestoneId) ||
      !Array.isArray(v.versions)
    )
      continue;
    const versions = v.versions
      .filter(record)
      .filter(
        (x) =>
          typeof x.version === "number" &&
          x.version >= 1 &&
          text(x.submittedAt),
      )
      .map((x) => ({
        version: Number(x.version),
        submittedAt: text(x.submittedAt),
        file: text(x.file),
        files: Array.isArray(x.files) ? parseFiles(x.files) : undefined,
        note: text(x.note) || undefined,
        link: text(x.link) || undefined,
        scores: record(x.scores)
          ? Object.fromEntries(
              Object.entries(x.scores).filter(
                (e): e is [string, number] =>
                  typeof e[1] === "number" && Number.isFinite(e[1]),
              ),
            )
          : undefined,
      }));
    if (!versions.length) continue;
    submissions[id] = {
      id,
      eventId: text(v.eventId),
      studentId: text(v.studentId),
      milestoneId: text(v.milestoneId),
      versions,
      surveyComplete: v.surveyComplete === true,
      surveyScore:
        typeof v.surveyScore === "number" ? v.surveyScore : undefined,
      surveySummary: text(v.surveySummary) || undefined,
      instrument: text(v.instrument) || undefined,
      completion: text(v.completion) || undefined,
      integration: text(v.integration) || undefined,
      reflection: text(v.reflection) || undefined,
      link: text(v.link) || undefined,
      note: text(v.note) || undefined,
    };
  }
  return { students, enrollments, submissions };
}
