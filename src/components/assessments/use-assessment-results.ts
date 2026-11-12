"use client";

import { useEffect, useState } from "react";
import { mockAssessmentRepository } from "@/lib/assessments/repository";
import type { AssessmentQueryState, AssessmentScope } from "@/lib/assessments/types";

export function useAssessmentResults(scope: AssessmentScope | null) {
  const role = scope?.role;
  const studentId = scope?.role === "student" ? scope.studentId : undefined;
  const key = role === "teacher" ? "teacher" : `student:${studentId ?? ""}`;
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState<{ key: string; attempt: number; state: AssessmentQueryState }>();
  useEffect(() => {
    if (!role || (role === "student" && !studentId)) return;
    const controller = new AbortController();
    const requestedScope: AssessmentScope = role === "teacher"
      ? { role: "teacher" }
      : { role: "student", studentId: studentId! };
    mockAssessmentRepository.list(requestedScope, controller.signal).then(
      (records) => {
        if (!controller.signal.aborted)
          setQuery({ key, attempt, state: { status: "ready", records } });
      },
      () => {
        if (!controller.signal.aborted)
          setQuery({ key, attempt, state: { status: "error" } });
      },
    );
    return () => controller.abort();
  }, [role, studentId, key, attempt]);
  // Never render records belonging to the prior account during identity changes.
  const state: AssessmentQueryState = query?.key === key && query.attempt === attempt
    ? query.state
    : { status: "loading" };
  return { state, retry: () => setAttempt((value) => value + 1) };
}
