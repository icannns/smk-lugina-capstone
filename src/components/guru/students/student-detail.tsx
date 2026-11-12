"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import type {
  MilestoneSummary,
  Student,
  StudentEnrollment,
  StudentEvent,
} from "@/lib/guru/student-types";
import type { DashboardAction } from "@/lib/guru/dashboard-data";
import { StudentCard, StudentIcon } from "./student-ui";
import { milestoneLabel } from "@/lib/guru/learning-selectors";

function Definition({
  title,
  children,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <dt className="text-xs leading-4 text-secondary">{title}</dt>
      <dd className="mt-1 text-sm leading-5">{children}</dd>
    </div>
  );
}

function SummaryCard({
  milestone,
  label,
  onResponse,
}: {
  milestone: MilestoneSummary;
  label: string;
  onResponse: () => void;
}) {
  return (
    <StudentCard className="p-5 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold leading-6">
          {label}
          {milestone.title && ` · ${milestone.title}`}
        </h3>
        {milestone.submittedAt && (
          <p className="text-xs leading-4 text-secondary">
            Dikirim {milestone.submittedAt}
          </p>
        )}
      </header>
      {milestone.submittedAt ? (
        <>
          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Definition title="Status Form Survei">
              <span
                className={`inline-flex min-h-[20.8px] items-center rounded-full px-2 py-0.5 text-xs font-medium leading-4 ${milestone.badgeTone === "amber" ? "bg-amber-50 text-[#973c00]" : "bg-green-50 text-[#008236]"}`}
              >
                Sudah Dikirim
              </span>
            </Definition>
            <Definition title="Instrumen Survei">
              <span className="font-medium">{milestone.instrument ?? "—"}</span>
            </Definition>
            <Definition title="Ringkasan Skor Survei" wide>
              {milestone.summary ?? "—"}
            </Definition>
            <Definition title="Status Kelengkapan Milestone">
              {milestone.completion ?? "—"}
            </Definition>
            <Definition title="Integrasi Hasil Survei">
              {milestone.integration ?? "—"}
            </Definition>
            <Definition title="Catatan Refleksi Siswa" wide>
              {milestone.reflection ?? "—"}
            </Definition>
          </dl>
          <div className="pt-4">
            <button
              type="button"
              onClick={onResponse}
              className="inline-flex h-8 items-center gap-2 rounded-control px-3 text-[13px] font-medium leading-[19.5px] text-secondary hover:bg-gray-50"
            >
              <StudentIcon name="detail-response" />
              Lihat Detail Respons
            </button>
          </div>
        </>
      ) : (
        <div className="mt-4 flex min-h-11 items-center gap-2 rounded-control bg-gray-50 px-4 py-3 text-sm leading-5 text-secondary">
          <StudentIcon name="detail-unfilled" />
          Form belum diisi
        </div>
      )}
    </StudentCard>
  );
}

type Props = {
  student: Student;
  event: StudentEvent;
  enrollment: StudentEnrollment;
  reviewed: boolean;
  savedNote: string;
  onSave: (text: string) => Promise<boolean>;
  onReview: () => Promise<boolean>;
  onAction: (action: DashboardAction) => void;
};

export function StudentDetail({
  student,
  event,
  enrollment,
  reviewed,
  savedNote,
  onSave,
  onReview,
  onAction,
}: Props) {
  const [note, setNote] = useState(savedNote);
  const [saved, setSaved] = useState(false);
  const total = enrollment.milestones.length;
  const progress = Math.round((enrollment.completedMilestones / total) * 100);
  const initials = student.name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("");
  return (
    <>
      <header>
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-1 text-[13px] leading-[19.5px]"
        >
          <Link
            href="/guru/students"
            className="text-secondary hover:text-primary hover:underline"
          >
            Pengelolaan Data Siswa
          </Link>
          <StudentIcon name="detail-breadcrumb" />
          <span aria-current="page" className="font-medium">
            {student.name}
          </span>
        </nav>
        <div className="flex flex-wrap items-end justify-between gap-3 pt-3">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#2b7fff,#00bba7)] text-[16.72px] font-semibold leading-[20.9px] tracking-[-0.75px] text-white">
                {initials}
              </span>
              <h1 className="text-[30px] font-semibold leading-[37.5px] tracking-[-0.75px]">
                {student.name}
              </h1>
            </div>
            <p className="mt-1 break-words text-sm leading-5 text-secondary">
              {student.email} · Event: {event.title}
            </p>
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium leading-4 ${reviewed ? "bg-green-50 text-[#008236]" : "bg-amber-50 text-[#973c00]"}`}
          >
            {reviewed ? "Sudah ditinjau" : "Belum ditinjau"}
          </span>
        </div>
      </header>
      <StudentCard className="mt-6 p-5 sm:p-6">
        <div className="flex flex-wrap justify-between gap-2 text-xs leading-4">
          <span className="text-secondary">Progres event</span>
          <span>
            <span className="font-medium">
              {enrollment.completedMilestones} dari {total} milestone
            </span>
            <span className="text-secondary"> · {progress}%</span>
          </span>
        </div>
        <div
          role="progressbar"
          aria-label={`Progres event ${student.name}`}
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100"
        >
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#3b82f6,#0d9488)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </StudentCard>
      <div className="mt-6 grid min-w-0 items-start gap-6 min-[1360px]:grid-cols-[minmax(0,1fr)_360px]">
        <section aria-labelledby="student-summaries-title" className="min-w-0">
          <h2
            id="student-summaries-title"
            className="flex flex-wrap items-center gap-2 text-sm leading-5 tracking-[0.35px] text-secondary"
          >
            <StudentIcon name="detail-summary" />
            <span className="font-semibold uppercase">
              Ringkasan Form Survei Siswa
            </span>
            <span>(read-only)</span>
          </h2>
          <div className="mt-3 flex flex-col gap-4">
            {enrollment.milestones.map((milestone) => (
              <SummaryCard
                key={milestone.id}
                milestone={milestone}
                label={milestoneLabel(event, milestone.id)}
                onResponse={() =>
                  onAction({
                    title: "Detail Respons",
                    description: `${student.name} · ${event.title} · ${milestoneLabel(event, milestone.id)}. Ringkasan di halaman ini bersifat baca-saja. Administrasi respons lengkap berada di modul Survei terpisah.`,
                  })
                }
              />
            ))}
          </div>
        </section>
        <section aria-labelledby="teacher-notes-title" className="min-w-0">
          <h2
            id="teacher-notes-title"
            className="flex flex-wrap items-center gap-2 text-sm leading-5 tracking-[0.35px] text-secondary"
          >
            <StudentIcon name="detail-lock" />
            <span className="font-semibold uppercase">Catatan Guru</span>
            <span>(internal)</span>
          </h2>
          <StudentCard className="mt-3 p-5 sm:p-6">
            <p
              id="teacher-note-guidance"
              className="mb-4 text-xs leading-4 text-secondary"
            >
              Hanya terlihat oleh guru/asesor. Tidak ditampilkan ke siswa dan
              tidak ikut laporan.
            </p>
            <label className="block">
              <span className="sr-only">Catatan Guru untuk {student.name}</span>
              <textarea
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  setSaved(false);
                }}
                aria-describedby="teacher-note-guidance"
                placeholder="Contoh: Sudah diberi contoh palet warna saat jam praktik."
                className="block h-24 min-h-24 w-full resize-y rounded-control border border-line bg-white px-3 py-2.5 text-sm leading-5 placeholder:text-[#99a1af]"
              />
            </label>
            <div className="mt-[22.4px] flex flex-col gap-2">
              <button
                type="button"
                onClick={async () => {
                  setSaved(await onSave(note));
                }}
                className="flex h-10 items-center justify-center rounded-control px-4 text-sm font-medium hover:bg-gray-50"
              >
                Simpan Catatan
              </button>
              <div>
                <button
                  type="button"
                  disabled={reviewed}
                  onClick={onReview}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-control bg-primary px-4 text-sm font-medium text-white shadow-[0_1px_3px_#155dfc33] hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <StudentIcon name="detail-check" />
                  Tandai Sudah Ditinjau
                </button>
                {reviewed && (
                  <p className="flex min-h-5 items-center gap-1 pt-1 text-xs leading-4 text-secondary">
                    <StudentIcon name="detail-info" />
                    Form ini sudah ditinjau
                  </p>
                )}
              </div>
            </div>
            {saved && (
              <p
                role="status"
                className="mt-3 text-xs leading-4 text-[#008236]"
              >
                Catatan tersimpan di server.
              </p>
            )}
          </StudentCard>
        </section>
      </div>
    </>
  );
}
