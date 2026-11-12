"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useAppAuth } from "@/lib/auth/session";
import { allStudents } from "@/lib/guru/learning-selectors";
import { listedEvents, useEventDraftStore } from "@/lib/guru/event-draft-store";
import { assessmentLabels, scopedAssessments } from "@/lib/assessments/selectors";
import type { AssessmentScope, AssessmentType } from "@/lib/assessments/types";
import { AssessmentSection } from "./assessment-section";
import { AssessmentLoadState } from "./assessment-ui";
import { useAssessmentResults } from "./use-assessment-results";
import { AssessmentSummaryCard } from "./assessment-summary-card";

export function DashboardAssessments({ audience }: { audience: "teacher" | "student" }) {
  const { account } = useAppAuth();
  // Key the entire presentation to the account, resetting filters/details on logout.
  if (!account || account.role !== audience) return null;
  const scope: AssessmentScope | null = audience === "teacher"
    ? { role: "teacher" }
    : account.studentId ? { role: "student", studentId: account.studentId } : null;
  if (!scope) return null;
  return <AssessmentDashboardContent key={account.id} scope={scope} />;
}

function AssessmentDashboardContent({ scope }: { scope: AssessmentScope }) {
  const [activeType, setActiveType] = useState<AssessmentType | null>(null);
  const panelId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (activeType) {
      panel.current?.focus({ preventScroll: true });
      panel.current?.scrollIntoView({ block: "nearest" });
    }
  }, [activeType]);
  function closeResults() {
    setActiveType(null);
    trigger.current?.focus();
  }
  const { state, retry } = useAssessmentResults(scope);
  const store = useEventDraftStore();
  const { account } = useAppAuth();
  const teacher = scope.role === "teacher";
  const names = new Map(allStudents(store.learning).map((student) => [student.id, store.studentUI.profiles[student.id]?.name ?? student.name]));
  if (scope.role === "student" && account) names.set(scope.studentId, store.studentUI.profiles[scope.studentId]?.name ?? account.name);
  const eventNames = new Map(listedEvents(store).map((event) => [event.id, event.title]));
  const records = state.status === "ready" ? scopedAssessments(state.records, scope) : [];
  const types: AssessmentType[] = teacher ? ["competency", "technostress", "uiux"] : ["competency", "uiux"];
  return (
    <section aria-label={teacher ? "Hasil asesmen Guru" : "Hasil asesmen saya"} className="min-w-0 space-y-4">
      <div>
        <h2 className="text-lg font-semibold leading-[26px]">{teacher ? "Hasil Asesmen" : "Hasil Asesmen Saya"}</h2>
        <p className="mt-1 text-xs leading-[18px] text-secondary">Referensi PostgreSQL · Data demo ditandai. Layanan FOMO/COMMIT eksternal belum terhubung.</p>
      </div>
      {state.status !== "ready" ? <AssessmentLoadState state={state} onRetry={retry} /> :
        <>
          <div className={`grid min-w-0 gap-4 ${teacher ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
            {types.map((type) => <AssessmentSummaryCard
              key={type}
              type={type}
              records={records.filter((record) => record.type === type)}
              teacher={teacher}
              expanded={activeType === type}
              panelId={panelId}
              onOpen={(button) => {
                if (activeType === type) closeResults();
                else { trigger.current = button; setActiveType(type); }
              }}
            />)}
          </div>
          <div id={panelId} ref={panel} hidden={!activeType} tabIndex={-1} role="region"
            aria-label={activeType ? `Daftar hasil ${assessmentLabels[activeType]}` : "Daftar hasil asesmen"}
            className="min-w-0 scroll-mt-6 rounded-2xl">
            {activeType && <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium">{teacher ? "Daftar hasil" : "Hasil dan riwayat"} {assessmentLabels[activeType]}</p>
                <button type="button" onClick={closeResults} className="rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-primary-soft">Tutup hasil</button>
              </div>
              <AssessmentSection key={activeType} type={activeType} records={records.filter((record) => record.type === activeType)} teacher={teacher} names={names} eventNames={eventNames} />
            </>}
          </div>
        </>}
    </section>
  );
}
