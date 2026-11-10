"use client";
import Link from "next/link";
import { useState } from "react";
import { useDemoAuth } from "@/lib/auth/session";
import { listedEvents, useEventDraftStore } from "@/lib/guru/event-draft-store";
import {
  eventLearning,
  feedbackFor,
  submissionStatus,
  certificateThreshold,
} from "@/lib/guru/learning-selectors";
import { formatEventDate } from "@/lib/guru/event-selectors";
import { SiswaShell } from "./siswa-shell";
import { Surface } from "../guru/design-ui";
import { EmptyRows } from "../guru/learning-ui";
import { StudentBadge as StatusBadge } from "./siswa-ui";
import { useStudentIdentity } from "./use-student-identity";
export function StudentDashboard() {
  const { account } = useDemoAuth(),
    state = useEventDraftStore(),
    [filter, setFilter] = useState("all"),
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
      return row ? [{ event, row }] : [];
    });
  const certificates = mine.filter(
    ({ event, row }) =>
      row.score !== null &&
      row.completed === row.total &&
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
    ({ event }) => !state.studentUI.certificates[`${event.id}:${studentId}`],
  );
  const visible = mine.filter(
    ({ event, row }) =>
      filter === "all" ||
      (filter === "complete" && row.completed === row.total) ||
      (filter === "active" &&
        row.completed < row.total &&
        event.status !== "upcoming"),
  );
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
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [
            "Event diikuti",
            mine.length,
            `${mine.filter((e) => e.event.status === "ongoing").length} aktif · ${mine.filter((e) => e.row.completed === e.row.total).length} selesai`,
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
                <p className="mt-1 text-xs text-secondary">
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
              <p className="mt-1 text-xs text-secondary">
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
              onClick={() => setFilter(key)}
              className={`rounded-lg px-4 py-2 text-xs ${filter === key ? "bg-white shadow-sm" : "text-secondary"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {visible.map(({ event, row }) => {
          const complete = row.completed === row.total,
            progress = row.total
              ? Math.round((row.completed / row.total) * 100)
              : 0,
            index = row.submissions.findIndex((s) => s && !s.surveyComplete),
            active =
              index >= 0
                ? index
                : Math.max(
                    0,
                    row.submissions.findIndex((s) => !s),
                  ),
            milestone = event.milestones[active];
          return (
            <Surface key={event.id} className="!p-6">
              <div className="mb-3 flex justify-between gap-2">
                <StatusBadge status={complete ? "complete" : "pending"}>
                  {complete
                    ? "Selesai"
                    : event.status === "upcoming"
                      ? "Segera dimulai"
                      : "Dalam pengerjaan"}
                </StatusBadge>
                <span className="text-xs text-secondary">
                  Nilai: {row.score ?? "belum ada"}
                </span>
              </div>
              <h3 className="font-semibold">{event.title}</h3>
              <p className="mt-1 text-xs text-secondary">
                {state.profile.name.split(",")[0]} ·{" "}
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
                  {complete ? "Hasil akhir" : "Milestone aktif"}
                </p>
                <p className="mt-1 font-semibold">
                  {complete
                    ? row.score !== null
                      ? "Seluruh milestone sudah dinilai"
                      : "Penilaian belum lengkap"
                    : `${active + 1}. ${milestone?.title || "Milestone"}`}
                </p>
                <p className="mt-1 text-secondary">
                  {complete
                    ? row.score === null
                      ? "Nilai akhir menunggu penilaian Guru."
                      : "Dokumen belajar sesuai syarat nilai."
                    : `Deadline ${milestone?.deadline ? formatEventDate(milestone.deadline, true) : "belum ditentukan"}`}
                </p>
              </div>
              <Link
                href={
                  complete
                    ? `/siswa/portfolio?event=${event.id}`
                    : `/siswa/workspace?event=${event.id}&milestone=${milestone?.id}`
                }
                className={`flex h-10 items-center justify-center rounded-xl border text-sm font-medium ${complete ? "border-line bg-white" : "border-primary bg-primary text-white"}`}
              >
                {complete ? "Lihat Ringkasan" : "Buka Ruang Kerja"}
              </Link>
            </Surface>
          );
        })}
      </div>
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
