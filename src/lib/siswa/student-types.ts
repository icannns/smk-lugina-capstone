import type { EventAttachment } from "../guru/event-types";
export const STUDENT_NAME_MAX_LENGTH = 120;
export type WorkDraft = {
  files: EventAttachment[];
  text: string;
  link: string;
};
export type SurveyDraft = {
  first: number | null;
  second: number | null;
  reflection: string;
};
export type SurveyResponse = SurveyDraft & {
  id: string;
  submittedAt: string;
  version: number;
};
export type StudentProfile = {
  name: string;
  email: string;
  phone: string;
  avatar?: string;
};
export type CertificateClaim = {
  id: string;
  eventId: string;
  studentId: string;
  studentName: string;
  score: number;
  claimedAt: string;
  downloadedAt?: string;
};
export type StudentUIState = {
  workDrafts: Record<string, WorkDraft>;
  surveyDrafts: Record<string, SurveyDraft>;
  surveyResponses: Record<string, SurveyResponse>;
  profiles: Record<string, StudentProfile>;
  certificates: Record<string, CertificateClaim>;
};
export const initialStudentUI: StudentUIState = {
  workDrafts: {},
  surveyDrafts: {},
  surveyResponses: {},
  profiles: {},
  certificates: {},
};
