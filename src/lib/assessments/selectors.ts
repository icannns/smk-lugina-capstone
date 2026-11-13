import type {
  AssessmentFilters,
  AssessmentRecord,
  AssessmentScope,
  AssessmentStatus,
  AssessmentType,
} from "./types";

export const assessmentLabels: Record<AssessmentType, string> = {
  competency: "Uji Kompetensi",
  technostress: "Technostress",
  uiux: "Asesmen UI/UX",
};
export const assessmentStatusLabels: Record<AssessmentStatus, string> = {
  not_started: "Belum dikerjakan",
  in_progress: "Sedang dikerjakan",
  awaiting_result: "Menunggu hasil",
  completed: "Selesai",
};
export const initialAssessmentFilters: AssessmentFilters = {
  search: "",
  eventId: "all",
  status: "all",
};

/** Fail closed: an empty/missing student identity must never mean all students. */
export function scopedAssessments(
  records: readonly AssessmentRecord[],
  scope: AssessmentScope | null,
): AssessmentRecord[] {
  if (!scope) return [];
  if (scope.role === "teacher") return [...records];
  if (scope.role !== "student" || !scope.studentId?.trim()) return [];
  return records.filter(
    (record) =>
      record.studentId === scope.studentId && record.type !== "technostress",
  );
}

function usableScore(score: NonNullable<AssessmentRecord["result"]>["score"]) {
  return score && Number.isFinite(score.value) && Number.isFinite(score.maximum) && score.maximum > 0;
}

export function assessmentHasResult(record: AssessmentRecord) {
  return record.status === "completed" && Boolean(
    usableScore(record.result?.score) || record.result?.summary?.trim(),
  );
}

export function assessmentResultText(record: AssessmentRecord): string {
  if (record.status !== "completed")
    return record.status === "awaiting_result"
      ? "Hasil belum diterbitkan."
      : "Belum ada hasil.";
  const score = record.result?.score;
  if (score && usableScore(score))
    return `${score.value.toLocaleString("id-ID")} / ${score.maximum.toLocaleString("id-ID")}`;
  return record.result?.summary?.trim() || "Hasil belum tersedia.";
}

export function assessmentSummary(records: readonly AssessmentRecord[]) {
  const available = records.filter(assessmentHasResult).length;
  return { total: records.length, available, unavailable: records.length - available };
}

/** Most recent dated record, not the highest score or a derived pass/fail result. */
export function assessmentHighlight(records: readonly AssessmentRecord[]) {
  return [...records].sort((a, b) => {
    const time = (value?: string) => value && Number.isFinite(Date.parse(value)) ? Date.parse(value) : 0;
    return time(b.completedAt) - time(a.completedAt);
  })[0];
}

export function filterAssessments(
  records: readonly AssessmentRecord[],
  filters: AssessmentFilters,
  names: ReadonlyMap<string, string>,
): AssessmentRecord[] {
  const term = filters.search.trim().toLocaleLowerCase("id-ID");
  return records.filter((record) =>
    (filters.eventId === "all" || (record.eventId ?? "none") === filters.eventId) &&
    (filters.status === "all" || record.status === filters.status) &&
    (!term || [names.get(record.studentId) ?? record.studentId, record.title]
      .some((value) => value.toLocaleLowerCase("id-ID").includes(term))),
  );
}

export function assessmentOriginLabel(record: AssessmentRecord) {
  return record.source === "mock" ? "Data contoh" : record.origin === "INTERNAL" ? "Hasil internal" : "Hasil tersimpan";
}
