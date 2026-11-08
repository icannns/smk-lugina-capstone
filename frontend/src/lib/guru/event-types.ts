import type { EventStatus } from "./dashboard-data";

export type EventMilestone = {
  id: string;
  title: string;
  instructions?: string;
  deadline?: string; // Local wall time in WIB, never parsed in the browser's time zone.
  formats?: string;
  surveyActive?: boolean;
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
