export type Student = { id: string; name: string; email: string };
export type StudentEvent = {
  id: string;
  title: string;
  milestones: { id: string; title: string }[];
};
export type MilestoneSummary = {
  id: string;
  title: string;
  submittedAt?: string;
  summary?: string;
  instrument?: string;
  completion?: string;
  integration?: string;
  reflection?: string;
  badgeTone?: "amber" | "green";
};
export type StudentEnrollment = {
  id: string;
  eventId: string;
  studentId: string;
  completedMilestones: number;
  reviewed: boolean;
  milestones: MilestoneSummary[];
};
export type StudentRecord = {
  id: string;
  enrollment: StudentEnrollment;
  student: Student;
  event: StudentEvent;
  milestone: MilestoneSummary;
};
export type ReviewFilter = "all" | "unreviewed" | "reviewed";
export type StudentFilters = {
  event: string;
  milestone: string;
  search: string;
  review: ReviewFilter;
  page: number;
};
export type StudentSession = {
  notes: Record<string, string>;
  reviews: Record<string, boolean>;
};
