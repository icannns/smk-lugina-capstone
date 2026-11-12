"use client";

import { Surface } from "../guru/design-ui";
import { DashboardButton } from "../guru/dashboard-ui";
import { AssessmentBadge } from "./assessment-ui";
import {
  assessmentHighlight,
  assessmentLabels,
  assessmentResultText,
  assessmentSummary,
} from "@/lib/assessments/selectors";
import type { AssessmentRecord, AssessmentType } from "@/lib/assessments/types";

export function AssessmentSummaryCard({
  type, records, teacher, expanded, panelId, onOpen,
}: {
  type: AssessmentType;
  records: readonly AssessmentRecord[];
  teacher: boolean;
  expanded: boolean;
  panelId: string;
  onOpen: (trigger: HTMLButtonElement) => void;
}) {
  const label = assessmentLabels[type];
  const summary = assessmentSummary(records);
  const latest = assessmentHighlight(records);
  return (
    <article data-assessment-summary={type} className="min-w-0">
      <Surface className="flex h-full flex-col !p-4 sm:!p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-base font-semibold leading-6">{label}</h3>
          {!teacher && latest && <AssessmentBadge status={latest.status} />}
        </div>
        {teacher ? (
          <>
            <p className="mt-3 text-[28px] font-semibold leading-9">
              {summary.available}<span className="ml-2 text-xs font-normal text-secondary">hasil tersedia</span>
            </p>
            <p className="mt-1 text-xs leading-[18px] text-secondary">
              {summary.unavailable} belum tersedia · {summary.total} catatan
            </p>
          </>
        ) : latest ? (
          <>
            <p className={`mt-3 break-words ${latest.status === "completed" && latest.result?.score ? "text-[28px] font-semibold leading-9" : "text-sm font-medium leading-6"}`}>
              {assessmentResultText(latest)}
            </p>
            <p className="mt-1 break-words text-xs leading-[18px] text-secondary">{latest.title}</p>
            <p className="mt-1 text-xs leading-[18px] text-secondary">{records.length} catatan · lihat hasil dan riwayat</p>
          </>
        ) : (
          <p className="mt-3 text-sm leading-6 text-secondary">Belum ada {label.toLocaleLowerCase("id-ID")} untuk ditampilkan.</p>
        )}
        <div className="mt-auto pt-4">
          <DashboardButton
            variant="outline"
            aria-expanded={expanded}
            aria-controls={panelId}
            aria-label={`Lihat hasil ${label}`}
            onClick={(event) => onOpen(event.currentTarget)}
            className="w-full"
          >
            {teacher ? "Lihat Hasil" : "Lihat Detail"}
          </DashboardButton>
        </div>
      </Surface>
    </article>
  );
}
