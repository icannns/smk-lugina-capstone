"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { listedEvents, useEventDraftStore } from "@/lib/guru/event-draft-store";
import {
  allEnrollments,
  certificateThreshold,
} from "@/lib/guru/learning-selectors";
import { formatEventDate } from "@/lib/guru/event-selectors";
import type { ManagedEvent } from "@/lib/guru/event-types";
import { eventCardPageSize } from "@/lib/guru/event-pagination";
import { EventPagination } from "./event-pagination";
import { enrollStudent } from "@/lib/siswa/student-actions";
import { isEnrolled, workHref } from "@/lib/siswa/selectors";
import { SiswaShell, SiswaIcon } from "../siswa-shell";
import { useStudentIdentity } from "../use-student-identity";
import { Surface } from "../../guru/design-ui";
import { EmptyRows } from "../../guru/learning-ui";
import { StudentBadge as StatusBadge } from "../siswa-ui";
import {
  Breadcrumb,
  SiswaButton,
  SiswaLink,
  SiswaDialog,
  StudentNotice,
  SummaryRows,
  studentControl,
  formatPeriod,
  plainHtml,
} from "../siswa-ui";
export function StudentEvents() {
  const params = useSearchParams(),
    state = useEventDraftStore(),
    identity = useStudentIdentity(),
    events = listedEvents(state).filter((e) => e.status !== "draft"),
    eventId = params.get("event"),
    event = events.find((e) => e.id === eventId);
  const [tab, setTab] = useState("all"),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState("all"),
    [page, setPage] = useState(1);
  const studentId = identity.studentId ?? "",
    mine = events.filter((e) => isEnrolled(e.id, studentId, state.learning)),
    filtered = events.filter(
      (e) =>
        (tab === "all" || !isEnrolled(e.id, studentId, state.learning)) &&
        (status === "all" || e.status === status) &&
        e.title.toLowerCase().includes(search.toLowerCase()),
    ),
    pages = Math.max(1, Math.ceil(filtered.length / eventCardPageSize)),
    current = Math.min(page, pages);
  if (eventId)
    return event ? (
      <StudentEventDetail key={event.id} event={event} />
    ) : (
      <SiswaShell frame="370:2001" active="events">
        <EmptyRows>
          Event tidak ditemukan.{" "}
          <Link href="/siswa/events" className="text-primary">
            Kembali ke Jelajah Event
          </Link>
        </EmptyRows>
      </SiswaShell>
    );
  return (
    <SiswaShell frame="370:1786" active="events">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-semibold leading-[38px]">
            Jelajah Event
          </h1>
          <p className="mt-1 text-sm text-secondary">
            Pilih dan ikuti event pembelajaran yang tersedia secara mandiri
            sesuai minatmu.
          </p>
        </div>
        <SiswaLink
          href="/siswa/dashboard"
          className="!border-primary !text-primary"
        >
          Event Saya ({mine.length})
        </SiswaLink>
      </header>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl bg-gray-100 p-1">
          {[
            ["all", `Semua Event (${events.length})`],
            ["new", `Belum Diikuti (${events.length - mine.length})`],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={tab === key}
              onClick={() => {
                setTab(key);
                setPage(1);
              }}
              className={`rounded-lg px-3 py-2 text-xs ${tab === key ? "bg-white shadow-sm" : "text-secondary"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="relative block min-w-0 basis-full sm:flex-1 sm:basis-0 sm:max-w-80">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            <SiswaIcon frame="370:1786" name="imgIcon" />
          </span>
          <input
            aria-label="Cari judul event"
            placeholder="Cari judul event"
            className={`${studentControl} pl-9`}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <select
          aria-label="Status event"
          className={`${studentControl} sm:!w-36`}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">Semua</option>
          <option value="ongoing">Berlangsung</option>
          <option value="upcoming">Segera dimulai</option>
          <option value="ended">Berakhir</option>
        </select>
      </div>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {filtered.slice((current - 1) * eventCardPageSize, current * eventCardPageSize).map((e) => {
          const enrolled = isEnrolled(e.id, studentId, state.learning);
          return (
            <Surface
              key={e.id}
              className="flex min-h-[254px] flex-col gap-4 !p-6"
            >
              <div>
                <StatusBadge
                  status={
                    enrolled
                      ? "complete"
                      : e.status === "ended"
                        ? "missing"
                        : "pending"
                  }
                >
                  {enrolled
                    ? `Sudah Diikuti · ${e.status === "ended" ? "Selesai" : e.status === "upcoming" ? "Segera dimulai" : "Aktif"}`
                    : `${e.status === "ended" ? "Berakhir" : "Terbuka"} · ${e.status === "ongoing" ? "Berlangsung" : e.status === "upcoming" ? "Segera Dimulai" : "Arsip"}`}
                </StatusBadge>
              </div>
              <h2 className="text-base font-semibold">{e.title}</h2>
              <dl className="grid grid-cols-3 gap-2 text-xs">
                {[
                  ["Milestone", e.milestones.length],
                  ["Mode", e.mode],
                  ["Pengampu", (e.teacherName ?? "—").split(",")[0]],
                ].map(([key, v]) => (
                  <div key={key}>
                    <dt className="mb-1 text-secondary">{key}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
                <div className="col-span-3">
                  <dt className="mb-1 text-secondary">Periode</dt>
                  <dd>{formatPeriod(e.period)} · Sertifikat Tersedia</dd>
                </div>
              </dl>
              <SiswaLink
                href={`/siswa/events?event=${e.id}`}
                primary={!enrolled && e.status === "ongoing"}
                className="mt-auto w-full"
              >
                {!enrolled && e.status === "ongoing"
                  ? "Lihat Detail & Enroll"
                  : "Lihat Detail Event"}
              </SiswaLink>
            </Surface>
          );
        })}
      </div>
      {!filtered.length && (
        <EmptyRows>Tidak ada event sesuai pencarian atau filter.</EmptyRows>
      )}
      <EventPagination total={filtered.length} page={current} onChange={setPage} />
    </SiswaShell>
  );
}
function StudentEventDetail({ event }: { event: ManagedEvent }) {
  const state = useEventDraftStore(),
    identity = useStudentIdentity(),
    studentId = identity.studentId ?? "",
    enrolled = isEnrolled(event.id, studentId, state.learning),
    [confirm, setConfirm] = useState(false),
    [success, setSuccess] = useState(false),
    [error, setError] = useState("");
  const frame = confirm ? "370:2171" : enrolled ? "370:2352" : "370:2001",
    participants = event.participantCount ?? allEnrollments(state.learning).filter(
      (e) => e.eventId === event.id,
    ).length;
  return (
    <SiswaShell frame={frame} active="events">
      <Breadcrumb
        items={[
          { label: "Jelajah Event", href: "/siswa/events" },
          { label: event.title },
        ]}
      />
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-semibold leading-[38px] tracking-[-.75px]">
            {event.title}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <StatusBadge status={enrolled ? "complete" : "pending"}>
              {enrolled
                ? "Sudah Terdaftar · Aktif"
                : `Terbuka · ${event.status === "ongoing" ? "Berlangsung" : event.status === "upcoming" ? "Segera Dimulai" : "Berakhir"}`}
            </StatusBadge>
            <p className="text-xs text-secondary">
              {event.period} · Pengampu: {event.teacherName ?? "—"}
            </p>
          </div>
        </div>
        {enrolled ? (
          <SiswaLink primary href={workHref(event.id, event.milestones[0]?.id)}>
            Buka Ruang Kerja Event
          </SiswaLink>
        ) : (
          <SiswaButton
            disabled={event.status === "ended"}
            onClick={() => setConfirm(true)}
          >
            Enroll Event
          </SiswaButton>
        )}
      </header>
      <StudentNotice tone={enrolled ? "green" : "blue"}>
        {enrolled
          ? success
            ? "Pendaftaran berhasil! Event ini telah ditambahkan ke halaman Dashboard Anda. Anda kini dapat mulai mengerjakan Milestone 1."
            : "Kamu sudah terdaftar pada event ini. Buka ruang kerja untuk melanjutkan milestone."
          : event.status === "ended"
            ? "Event telah berakhir. Rincian tetap dapat dilihat sebagai arsip contoh."
            : `Event ini terbuka untuk pendaftaran mandiri (Self-Enroll). Pelajari rincian event & ${event.milestones.length} milestone di bawah ini, lalu klik 'Enroll Event' untuk mulai mengikuti.`}
      </StudentNotice>
      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,2.067fr)_minmax(0,1fr)]">
        <Surface>
          <h2 className="mb-4 font-semibold">
            Rincian Milestone &amp; Deadline ({event.milestones.length}{" "}
            Milestone)
          </h2>
          <ol className="space-y-3">
            {event.milestones.map((m, i) => (
              <li key={m.id} className="rounded-2xl border border-line p-4">
                <div className="flex flex-wrap justify-between gap-2">
                  <h3 className="text-base font-medium">
                    {i + 1}. {m.title || "Milestone"}
                  </h3>
                  <StatusBadge
                    status={
                      i === 0 ? (enrolled ? "complete" : "pending") : "missing"
                    }
                  >
                    Tahap {i + 1} ·{" "}
                    {i === 0
                      ? enrolled
                        ? "Terbuka (Aktif)"
                        : "Terbuka saat Enroll"
                      : "Mode Penyelesaian"}
                  </StatusBadge>
                </div>
                <p className="my-2 text-sm text-secondary">
                  {m.instructions ||
                    "Instruksi belum disediakan pada data contoh event ini."}
                </p>
                <p className="text-xs text-secondary">
                  Deadline{" "}
                  {m.deadline
                    ? formatEventDate(m.deadline, true)
                    : "belum ditentukan"}{" "}
                  · Format: {m.formats || "belum ditentukan"} · Form Survei:{" "}
                  {m.surveyActive ? "Aktif" : "Belum disiapkan"}
                </p>
              </li>
            ))}
          </ol>
        </Surface>
        <div className="space-y-6">
          <Surface>
            <h2 className="text-sm font-semibold">Ringkasan Event</h2>
            <SummaryRows
              rows={[
                ["Mode", event.mode],
                ["Peserta", `${participants} siswa (Enroll Mandiri)`],
                [
                  "Rubrik",
                  state.rubrics[event.rubricId ?? ""]?.title ??
                    "Belum tersedia",
                ],
                ["Sertifikat", `Nilai akhir ≥ ${certificateThreshold(event)}`],
              ]}
            />
          </Surface>
          <Surface>
            <h2 className="text-sm font-semibold">
              Rincian Event &amp; Studi Kasus
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-5 text-secondary">
              {plainHtml(event.caseStudyHtml) ||
                (event.id === "kantin"
                  ? "Kantin SMK Lugina melayani ±600 siswa saat istirahat 20 menit. Antrean panjang membuat banyak siswa kehabisan waktu. Rancang ulang pengalaman pemesanan melalui aplikasi mobile agar pemesanan dan pengambilan makanan lebih cepat."
                  : "Studi kasus belum disediakan pada data contoh event ini.")}
            </p>
            <div className="my-3 rounded-xl border border-line bg-gray-50 p-3 text-xs text-secondary">
              <p className="mb-1 font-semibold text-foreground">
                Ketentuan Penyelesaian:
              </p>
              <p>• Milestone dikerjakan berurutan.</p>
              <p>• Isi Form Survei setelah tugas milestone dikumpulkan.</p>
              <p>
                • Dokumen belajar contoh tersedia setelah seluruh penilaian
                lengkap dan nilai memenuhi syarat.
              </p>
            </div>
            {enrolled ? (
              <SiswaLink primary href="/siswa/dashboard" className="w-full">
                Mulai Kerjakan di Dashboard
              </SiswaLink>
            ) : (
              <SiswaButton
                className="w-full"
                disabled={event.status === "ended"}
                onClick={() => setConfirm(true)}
              >
                Enroll Event Sekarang
              </SiswaButton>
            )}
          </Surface>
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      )}
      {confirm && (
        <SiswaDialog
          title="Ikuti Event Pembelajaran Ini?"
          label="Konfirmasi Pendaftaran Mandiri"
          frame="370:2171"
          onClose={() => setConfirm(false)}
        >
          <p className="text-sm leading-5 text-secondary">
            Anda akan mendaftar secara mandiri pada event &quot;{event.title}
            &quot; ({event.milestones.length} Milestone · Mode {event.mode})
            menggunakan akun {identity.name}. Event ini akan langsung
            ditambahkan ke halaman Dashboard Anda.
          </p>
          <div className="mt-4 flex justify-end gap-3">
            <SiswaButton variant="outline" onClick={() => setConfirm(false)}>
              Batal
            </SiswaButton>
            <SiswaButton
              onClick={async () => {
                const result = await enrollStudent(event.id);
                setError(result);
                if (!result) {
                  setSuccess(true);
                  setConfirm(false);
                }
              }}
            >
              Ya, Enroll Event
            </SiswaButton>
          </div>
        </SiswaDialog>
      )}
    </SiswaShell>
  );
}
