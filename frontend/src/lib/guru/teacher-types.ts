import type { EventAttachment, EventEnrollment } from "./event-types";
import type { Student } from "./student-types";
export type WizardStep =
  "information" | "milestones" | "rubric" | "certificate" | "review" | "done";
export type RubricCriterion = {
  id: string;
  title: string;
  description: string;
  min: number;
  max: number;
  levels?: string[];
};
export type TeacherProfile = {
  name: string;
  email: string;
  phone: string;
  role: string;
  avatar?: string;
};
export type GuruRubric = {
  id: string;
  title: string;
  description: string;
  criteria: RubricCriterion[];
  updated: string;
  inUse: boolean;
};
export type CertificateMarker = "student" | "event" | "date" | "score";
export type SubmissionVersion = {
  version: number;
  submittedAt: string;
  file: string;
  scores?: Record<string, number>;
  files?: EventAttachment[];
  note?: string;
  link?: string;
};
export type TeacherSubmission = {
  id: string;
  eventId: string;
  studentId: string;
  milestoneId: string;
  versions: SubmissionVersion[];
  surveyComplete: boolean;
  surveyScore?: number;
  surveySummary?: string;
  instrument?: string;
  completion?: string;
  integration?: string;
  reflection?: string;
  link?: string;
  note?: string;
};
export type TeacherFeedback = {
  id: string;
  message: string;
  createdAt: string;
  revision: boolean;
  deadline?: string;
  version: number;
};
export type TeacherAssessment = {
  submissionId: string;
  version: number;
  scores: Record<string, number>;
  savedAt: string;
};
export type AssessmentChanges = {
  assessments: Record<string, TeacherAssessment>;
  feedback: Record<string, TeacherFeedback[]>;
  submissions?: Record<string, TeacherSubmission>;
  enrollments?: EventEnrollment[];
  students?: Student[];
};
export type CertificateConfig = {
  mode: "details" | "template";
  threshold: string;
  name: string;
  organizer: string;
  issuedAt: string;
  signer: string;
  signerRole: string;
  description: string;
  logo?: { name: string; size: number; type: string };
  signature?: { name: string; size: number; type: string };
  template?: { name: string; size: number; type: string };
  positions: Record<CertificateMarker, { x: number; y: number }>;
};
