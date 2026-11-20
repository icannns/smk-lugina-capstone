"use client";
import { enrollmentKey } from "@/lib/domain/keys";
import Link from "next/link";
import { useState } from "react";
import { useAppAuth } from "@/lib/auth/session";
import { listedEvents, useEventDraftStore } from "@/lib/guru/event-draft-store";
import {
  eventLearning,
  eventCompletionStatus,
  feedbackFor,
  submissionStatus,
  certificateThreshold,
} from "@/lib/guru/learning-selectors";
import { formatEventDate } from "@/lib/guru/event-selectors";
import { SiswaShell } from "./siswa-shell";
import { Surface } from "../guru/design-ui";
import { EmptyRows } from "../guru/learning-ui";
import { StudentBadge as StatusBadge, StudentEventCompletionBadge } from "./siswa-ui";
import { useStudentIdentity } from "./use-student-identity";
import { DashboardAssessments } from "@/components/assessments/dashboard-assessments";
import { EventPagination } from "./events/event-pagination";
import { eventCardPageSize } from "@/lib/guru/event-pagination";
export function StudentDashboard() {
  const { account } = useAppAuth(),
    state = useEventDraftStore(),
    [filter, setFilter] = useState("all"),
    [page, setPage] = useState(1),
    studentId = account?.studentId;
  const identity = useStudentIdentity();
  const mine = listedEvents(state)
    .filter((e) => e.status !== "draft")
    .flatMap((event) => {
      const data = eventLearning(
          event,
          state.learning,
          state.rubrics[event.rubricId ?? ""],
        ),
        row = data.rows.find((r) => r.student.id === studentId);
      if (!row) return [];
      const status = eventCompletionStatus(row);
      return [{ event, row, status, active: event.status === "ongoing" && status !== "complete" }];
    });
  const certificates = mine.filter(
    ({ event, row, status }) =>
      status === "complete" &&
      row.score !== null &&
      row.score >= certificateThreshold(event),
  );
  const tasks = mine.flatMap(({ event, row }) =>
    row.submissions.flatMap((s, i) =>
      s && ["revision", "survey"].includes(submissionStatus(s, state.learning))
        ? [
            {
              event,
              s,
              milestone: event.milestones[i],
              status: submissionStatus(s, state.learning) as
                "revision" | "survey",
            },
          ]
        : [],
    ),
  );
  const certificateActions = certificates.filter(
    ({ event }) => !state.studentUI.certificates[enrollmentKey(event.id,studentId ?? "")],
  );
  const filtered = mine.filter(
    ({ active, status }) =>
      filter === "all" ||
      (filter === "complete" && status === "complete") ||
      (filter === "active" && active),
  );
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / eventCardPageSize)));
  const visible = filtered.slice((currentPage - 1) * eventCardPageSize, currentPage * eventCardPageSize);
  return (
    <SiswaShell frame="370:2522" active="dashboard">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 max-w-full">
          <h1 className="break-words text-[30px] font-bold leading-[38px]">
            Halo, {identity.name.split(" ")[0] ?? "Siswa"}
          </h1>
          <p className="mt-1 text-sm text-secondary">
            Pantau event yang kamu ikuti dan selesaikan setiap milestone tepat
            waktu.
          </p>
        </div>
        <Link
          href="/siswa/events"
          className="rounded-xl border border-line bg-white px-4 py-3 text-sm font-medium"
        >
          Jelajah Event Lainnya
        </Link>
      </header>
      <div role="region" aria-label="Ringkasan event Siswa" className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [
            "Event diikuti",
            mine.length,
            `${mine.filter((e) => e.active).length} aktif · ${mine.filter((e) => e.status === "complete").length} selesai`,
          ],
          [
            "Milestone selesai",
            `${mine.reduce((n, e) => n + e.row.completed, 0)} / ${mine.reduce((n, e) => n + e.row.total, 0)}`,
            "Dari seluruh event",
          ],
          [
            "Perlu tindakan",
            tasks.length + certificateActions.length,
            "Revisi, survei, sertifikat",
          ],
          ["Sertifikat", certificates.length, "Dokumen belajar contoh"],
        ].map(([title, value, helper]) => (
          <Surface key={title} className="!p-5">
            <h2 className="text-xs text-secondary">{title}</h2>
            <p className="my-1 text-[30px] font-semibold leading-[38px]">
              {value}
            </p>
            <p className="text-xs text-secondary">{helper}</p>
          </Surface>
        ))}
      </div>
      <div className="mb-6"><DashboardAssessments audience="student" /></div>
      <Surface className="mb-8 !p-6">
        <div className="mb-4 flex justify-between gap-3">
          <h2 className="font-semibold">Perlu Tindakan</h2>
          <span className="text-xs text-secondary">
            {tasks.length + certificateActions.length} item
          </span>
        </div>
        {tasks.map(({ event, s, milestone, status }) => {
          const feedback = feedbackFor(s.id, state.learning)
            .filter((f) => f.revision)
            .at(-1);
          return (
            <div
              key={s.id}
              className="flex flex-wrap items-center gap-4 border-b border-line py-4 last:border-0"
            >
              <span className="w-36">
                <StatusBadge status={status} />
              </span>
              <div className="min-w-0 flex-1 basis-64">
                <h3 className="text-sm font-medium">
                  Milestone {event.milestones.indexOf(milestone) + 1} ·{" "}
                  {milestone.title}
                </h3>
                <p className="mt-1 break-words text-xs text-secondary">
                  {event.title} ·{" "}
                  {status === "revision"
                    ? `Batas revisi ${feedback?.deadline ? formatEventDate(feedback.deadline, true) : "belum ditentukan"}`
                    : "Lengkapi formulir survei pada ruang kerja milestone."}
                </p>
              </div>
              <Link
                href={`/siswa/workspace?event=${event.id}&milestone=${milestone.id}`}
                className={`rounded-xl border px-4 py-2 text-xs font-medium ${status === "revision" ? "border-primary bg-primary text-white" : "border-line bg-white"}`}
              >
                {status === "revision" ? "Unggah Revisi" : "Isi Form Survei"}
              </Link>
            </div>
          );
        })}
        {certificateActions.map(({ event, row }) => (
          <div
            key={event.id}
            className="flex flex-wrap items-center gap-4 border-b border-line py-4 last:border-0"
          >
            <span className="w-36">
              <StatusBadge status="complete">Sertifikat tersedia</StatusBadge>
            </span>
            <div className="min-w-0 flex-1 basis-64">
              <h3 className="text-sm font-medium">{event.title}</h3>
              <p className="mt-1 break-words text-xs text-secondary">
                Nilai akhir: {row.score} · Dokumen penyelesaian belajar contoh
              </p>
            </div>
            <Link
              href={`/siswa/portfolio?event=${event.id}&view=project`}
              className="rounded-xl border border-line px-4 py-2 text-xs font-medium"
            >
              Lihat Sertifikat
            </Link>
          </div>
        ))}
        {!tasks.length && !certificateActions.length && (
          <p className="text-sm text-secondary">
            Belum ada tindakan yang diperlukan.
          </p>
        )}
      </Surface>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Event Saya</h2>
        <div className="flex rounded-xl bg-gray-100 p-1">
          {[
            ["all", `Semua (${mine.length})`],
            ["active", "Aktif"],
            ["complete", "Selesai"],
          ].map(([key, label]) => (
            <button
              type="button"
              key={key}
              aria-pressed={filter === key}
              onClick={() => { setFilter(key); setPage(1); }}
              className={`rounded-lg px-4 py-2 text-xs ${filter === key ? "bg-white shadow-sm" : "text-secondary"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {visible.map(({ event, row, status }) => {
          const complete = status === "complete",
            awaitingAssessment = status === "awaitingAssessment",
            progress = row.total
              ? Math.round((row.completed / row.total) * 100)
              : 0,
            revisionIndex = row.submissions.findIndex((s) => submissionStatus(s, state.learning) === "revision"),
            surveyIndex = row.submissions.findIndex((s) => s && s.surveyRequired !== false && !s.surveyComplete),
            nextIndex = row.submissions.findIndex((s) => !s),
            activeIndex = [revisionIndex, surveyIndex, nextIndex].find((index) => index >= 0) ?? 0,
            milestone = event.milestones[activeIndex],
            showSummary = complete || (awaitingAssessment && revisionIndex < 0);
          return (
            <Surface key={event.id} className="!p-6">
              <div className="mb-3 flex justify-between gap-2">
                {event.status === "upcoming" && status === "none" ? (
                  <StatusBadge status="pending">Segera dimulai</StatusBadge>
                ) : <StudentEventCompletionBadge status={status} />}
                <span className="text-xs text-secondary">
                  Nilai: {row.score ?? "belum ada"}
                </span>
              </div>
              <h3 className="break-words font-semibold">{event.title}</h3>
              <p className="mt-1 break-words text-xs text-secondary">
                {(event.teacherName ?? "—").split(",")[0]} ·{" "}
                {event.period.split(",")[0]}
              </p>
              <div className="mb-2 mt-4 flex justify-between text-xs">
                <span>
                  {row.completed} dari {row.total} milestone
                </span>
                <strong>{progress}%</strong>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full ${complete ? "bg-green-500" : "bg-primary"}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="my-3 rounded-xl border border-line bg-gray-50 p-3 text-xs">
                <p className="text-secondary">
                  {complete ? "Hasil akhir" : showSummary ? "Penilaian Guru" : "Milestone aktif"}
                </p>
                <p className="mt-1 font-semibold">
                  {complete
                    ? "Seluruh milestone sudah dinilai"
                    : showSummary
                      ? "Penilaian belum lengkap"
                      : `${activeIndex + 1}. ${milestone?.title || "Milestone"}`}
                </p>
                <p className="mt-1 text-secondary">
                  {complete
                    ? "Dokumen belajar sesuai syarat nilai."
                    : showSummary
                      ? "Nilai akhir menunggu penilaian Guru."
                      : `Deadline ${milestone?.deadline ? formatEventDate(milestone.deadline, true) : "belum ditentukan"}`}
                </p>
              </div>
              <Link
                href={
                  showSummary
                    ? `/siswa/portfolio?event=${event.id}`
                    : `/siswa/workspace?event=${event.id}${milestone ? `&milestone=${milestone.id}` : ""}`
                }
                className={`flex h-10 items-center justify-center rounded-xl border text-sm font-medium ${complete ? "border-line bg-white" : "border-primary bg-primary text-white"}`}
              >
                {showSummary ? "Lihat Ringkasan" : "Buka Ruang Kerja"}
              </Link>
            </Surface>
          );
        })}
      </div>
      <EventPagination total={filtered.length} page={currentPage} onChange={setPage} />
      {!visible.length && (
        <EmptyRows>
          Belum ada event pada daftar ini.{" "}
          <Link href="/siswa/events" className="text-primary">
            Jelajah event yang tersedia.
          </Link>
        </EmptyRows>
      )}
    </SiswaShell>
  );
}
