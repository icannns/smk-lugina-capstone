"use client";

import { useEffect, useState } from "react";
import { databaseAssessmentRepository } from "@/lib/assessments/http-repository";
import type { AssessmentQueryState, AssessmentScope } from "@/lib/assessments/types";

export function useAssessmentResults(scope: AssessmentScope | null) {
  const role = scope?.role;
  const studentId = scope?.role === "student" ? scope.studentId : undefined;
  const key = role === "teacher" ? "teacher" : `student:${studentId ?? ""}`;
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState<{ key: string; attempt: number; state: AssessmentQueryState }>();
  useEffect(() => {
    if (!role || (role === "student" && !studentId)) return;
    let controller: AbortController | null = null;
    let inFlight = false, disposed = false;
    const requestedScope: AssessmentScope = role === "teacher"
      ? { role: "teacher" }
      : { role: "student", studentId: studentId! };
    function load() {
      if (disposed || inFlight) return;
      inFlight = true;
      controller = new AbortController();
      const signal = controller.signal;
      databaseAssessmentRepository.list(requestedScope, signal).then(
        (records) => {
          if (!disposed && !signal.aborted)
            setQuery({ key, attempt, state: { status: "ready", records } });
        },
        () => {
          if (!disposed && !signal.aborted)
            setQuery({ key, attempt, state: { status: "error" } });
        },
      ).finally(() => { inFlight = false; });
    }
    const refresh = () => { if (document.visibilityState === "visible") load(); };
    load();
    const timer = window.setInterval(refresh, 5000);
    window.addEventListener("focus", refresh);
    return () => { disposed = true; controller?.abort(); window.clearInterval(timer); window.removeEventListener("focus", refresh); };

  }, [role, studentId, key, attempt]);
  // Never render records belonging to the prior account during identity changes.
  const state: AssessmentQueryState = query?.key === key && query.attempt === attempt
    ? query.state
    : { status: "loading" };
  return { state, retry: () => setAttempt((value) => value + 1) };
}
