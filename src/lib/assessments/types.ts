/** Independent assessment results, never milestone rubric grades. */
export type AssessmentType = "competency" | "technostress" | "uiux";
export type AssessmentStatus =
  | "not_started"
  | "in_progress"
  | "awaiting_result"
  | "completed";

export type AssessmentRecord = Readonly<{
  id: string;
  type: AssessmentType;
  title: string;
  studentId: string;
  eventId?: string;
  status: AssessmentStatus;
  result?: Readonly<{
    score?: Readonly<{ value: number; maximum: number }>;
    summary?: string;
  }>;
  completedAt?: string;
  feedback?: string;
  source: "mock" | "api";
  origin?: "DEMO" | "INTERNAL" | "EXTERNAL";
}>;

export type AssessmentScope =
  | Readonly<{ role: "teacher" }>
  | Readonly<{ role: "student"; studentId: string }>;

export type AssessmentFilters = Readonly<{
  search: string;
  eventId: string;
  status: AssessmentStatus | "all";
}>;

export type AssessmentQueryState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; records: readonly AssessmentRecord[] };

export interface AssessmentRepository {
  list(
    scope: AssessmentScope,
    signal: AbortSignal,
  ): Promise<readonly AssessmentRecord[]>;
}
