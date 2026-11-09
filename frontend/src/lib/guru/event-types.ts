import type { EventStatus } from "./dashboard-data";
import type { CertificateConfig, WizardStep } from "./teacher-types";

export type EventMilestone = {
  id: string;
  title: string;
  instructions?: string;
  deadline?: string; // Local wall time in WIB, never parsed in the browser's time zone.
  formats?: string;
  surveyActive?: boolean;
  attachments?: EventAttachment[];
};
export type EventAttachment = {
  id: string;
  name: string;
  size: number;
  type: string;
};
export type ManagedEvent = {
  id: string;
  title: string;
  status: EventStatus | "draft";
  mode: "Penyelesaian";
  updated: string;
  period: string;
  milestones: EventMilestone[];
  progress?: number;
  rubric?: string;
  certificate?: string;
  rubricId?: string;
  certificateConfig?: CertificateConfig;
  caseStudyHtml?: string;
  directionsHtml?: string;
  startAt?: string;
  endAt?: string;
  attachments?: EventAttachment[];
  wizard?: {
    step: WizardStep;
    selectedMilestoneId: string;
    modeChosen: boolean;
  };
};
export type EventEnrollment = {
  id: string;
  eventId: string;
  studentId: string;
  method: "self";
};
export type EventFilters = {
  tab: "published" | "draft";
  search: string;
  status: "all" | EventStatus;
  sort: "reference" | "updated" | "title";
  page: number;
  pageSize: 2 | 4 | 6;
};
