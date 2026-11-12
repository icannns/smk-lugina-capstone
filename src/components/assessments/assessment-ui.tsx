"use client";

import { useEffect, useId, useRef } from "react";
import { DashboardButton } from "../guru/dashboard-ui";
import { StatusBadge } from "../guru/learning-ui";
import { Surface } from "../guru/design-ui";
import { assessmentResultText, assessmentStatusLabels } from "@/lib/assessments/selectors";
import type { AssessmentQueryState, AssessmentRecord, AssessmentStatus } from "@/lib/assessments/types";

const badgeStatus = {
  completed: "complete",
  awaiting_result: "partial",
  in_progress: "working",
  not_started: "none",
} as const;

export function AssessmentBadge({ status }: { status: AssessmentStatus }) {
  return <StatusBadge status={badgeStatus[status]}>{assessmentStatusLabels[status]}</StatusBadge>;
}

export function assessmentDate(value?: string) {
  if (!value || !Number.isFinite(Date.parse(value))) return "Belum tercatat";
  return `${new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta",
  }).format(new Date(value))} WIB`;
}

export function AssessmentLoadState({
  state, onRetry,
}: { state: Exclude<AssessmentQueryState, { status: "ready" }>; onRetry: () => void }) {
  const failed = state.status === "error";
  return (
    <Surface>
      <div role={failed ? "alert" : "status"} aria-busy={!failed} className="space-y-3 text-sm">
        <p className="font-medium">{failed ? "Hasil asesmen belum dapat dimuat." : "Memuat hasil asesmen…"}</p>
        <p className="text-secondary">{failed ? "Coba muat ulang bagian ini. Data event dan tugas tetap tersedia." : "Menyiapkan data asesmen contoh."}</p>
        {failed && <DashboardButton variant="outline" onClick={onRetry}>Coba lagi</DashboardButton>}
      </div>
    </Surface>
  );
}

export function AssessmentResultCard({
  record, name, eventName, onDetail,
}: { record: AssessmentRecord; name?: string; eventName: string; onDetail: () => void }) {
  return (
    <article className="min-w-0 rounded-xl border border-line p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1 basis-40">
          {name && <p className="mb-1 break-words text-sm font-semibold">{name}</p>}
          <h4 className="break-words text-sm font-medium">{record.title}</h4>
          <p className="mt-1 break-words text-xs leading-[18px] text-secondary">{eventName}</p>
        </div>
        <AssessmentBadge status={record.status} />
      </div>
      <p className={`my-3 break-words ${record.result?.score && record.status === "completed" ? "text-2xl font-semibold" : "text-sm leading-6 text-secondary"}`}>
        {assessmentResultText(record)}
      </p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-secondary">Selesai: {assessmentDate(record.completedAt)}</p>
        <DashboardButton variant="outline" onClick={onDetail} aria-label={`Lihat detail ${record.title}${name ? ` — ${name}` : ""}`}>Lihat detail</DashboardButton>
      </div>
    </article>
  );
}

export function AssessmentDetail({
  record, studentName, eventName, onClose,
}: { record: AssessmentRecord; studentName: string; eventName: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const title = useId(), description = useId();
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, []);
  return (
    <dialog ref={ref} aria-labelledby={title} aria-describedby={description} onCancel={onClose}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = event.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled)");
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault(); last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first?.focus();
        }
      }}
      className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-40px)] max-w-lg overflow-y-auto rounded-2xl border border-line bg-white p-5 text-foreground shadow-xl backdrop:bg-slate-950/35 sm:p-8">
      <p className="mb-2 text-xs font-semibold text-primary">DATA ASESMEN CONTOH</p>
      <h2 id={title} className="break-words text-xl font-semibold">{record.title}</h2>
      <p id={description} className="mt-2 text-sm leading-6 text-secondary">Catatan fiktif untuk demonstrasi. Belum terhubung ke layanan asesmen.</p>
      <dl className="my-5 grid min-w-0 gap-4 text-sm">
        <div><dt className="text-xs text-secondary">Siswa</dt><dd className="mt-1 break-words font-medium">{studentName}</dd></div>
        <div><dt className="text-xs text-secondary">Event</dt><dd className="mt-1 break-words">{eventName}</dd></div>
        <div><dt className="mb-1 text-xs text-secondary">Status asesmen</dt><dd><AssessmentBadge status={record.status} /></dd></div>
        <div><dt className="text-xs text-secondary">Hasil</dt><dd className="mt-1 break-words leading-6">{assessmentResultText(record)}</dd></div>
        {record.status === "completed" && record.result?.score && record.result.summary && <div><dt className="text-xs text-secondary">Ringkasan</dt><dd className="mt-1 break-words leading-6">{record.result.summary}</dd></div>}
        <div><dt className="text-xs text-secondary">Waktu selesai (WIB)</dt><dd className="mt-1">{assessmentDate(record.completedAt)}</dd></div>
        {record.status === "completed" && <div><dt className="text-xs text-secondary">Umpan balik</dt><dd className="mt-1 break-words leading-6">{record.feedback || "Belum ada umpan balik."}</dd></div>}
      </dl>
      {record.type === "technostress" && <p className="rounded-xl bg-gray-50 p-3 text-xs leading-5 text-secondary">Ringkasan respons ini bukan diagnosis. Skala, interpretasi, dan tindak lanjut menunggu tim pemilik instrumen.</p>}
      <div className="mt-6 flex justify-end"><DashboardButton variant="outline" onClick={onClose} autoFocus>Tutup detail</DashboardButton></div>
    </dialog>
  );
}
