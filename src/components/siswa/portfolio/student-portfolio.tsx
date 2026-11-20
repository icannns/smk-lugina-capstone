"use client";
import { enrollmentKey } from "@/lib/domain/keys";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { listedEvents, useEventDraftStore } from "@/lib/guru/event-draft-store";
import { eventDescriptions } from "@/lib/guru/event-data";
import {
  assessmentFor,
  milestoneRequiresSurvey,
  submissionComplete,
  eventCompletionStatus,
  enrollmentProgress,
  rubricScore,
  submissionLabels,
  submissionStatus,
} from "@/lib/guru/learning-selectors";
import { formatEventDate } from "@/lib/guru/event-selectors";
import { prototypePdf } from "@/lib/guru/client-export";
import type { ManagedEvent } from "@/lib/guru/event-types";
import {
  certificateConditions,
  isEnrolled,
  projectHref,
  workHref,
} from "@/lib/siswa/selectors";
import {
  claimStudentCertificate,
  markCertificateDownloaded,
} from "@/lib/siswa/student-actions";
import { Surface } from "../../guru/design-ui";
import { EmptyRows } from "../../guru/learning-ui";
import { StudentBadge as StatusBadge, StudentEventCompletionBadge } from "../siswa-ui";
import { SiswaShell, SiswaIcon } from "../siswa-shell";
import { useStudentIdentity } from "../use-student-identity";
import {
  Breadcrumb,
  LearningProgress,
  SiswaButton,
  SiswaDialog,
  SiswaLink,
  StudentNotice,
  studentControl,
  plainHtml,
  formatPeriod,
} from "../siswa-ui";
import { StudentEvidence } from "../workspace/student-evidence";
import { MilestoneWorkCard } from "./milestone-work-card";
export function StudentPortfolio() {
  const params = useSearchParams(),
    state = useEventDraftStore(),
    identity = useStudentIdentity(),
    studentId = identity.studentId ?? "",
    events = listedEvents(state).filter(
      (e) =>
        e.status !== "draft" && isEnrolled(e.id, studentId, state.learning),
    ),
    eventId = params.get("event"),
    event = events.find((e) => e.id === eventId),
    [search, setSearch] = useState(""),
    [period, setPeriod] = useState("all"),
    [status, setStatus] = useState("all");
  if (eventId)
    return event ? (
      <PortfolioEvent
        key={`${event.id}:${params.get("view")}`}
        event={event}
        project={params.get("view") === "project"}
      />
    ) : (
      <SiswaShell frame="370:3829" active="portfolio">
        <EmptyRows>
          Karya tidak ditemukan.{" "}
          <Link href="/siswa/portfolio" className="text-primary">
            Kembali ke Portofolio
          </Link>
        </EmptyRows>
      </SiswaShell>
    );
  const filtered = events.filter(
      (e) =>
        e.title.toLowerCase().includes(search.toLowerCase()) &&
        (period === "all" || e.period.includes(period)) &&
        (status === "all" || e.status === status),
    ),
    years = [
      ...new Set(events.flatMap((e) => e.period.match(/20\d{2}/g) ?? [])),
    ];
  return (
    <SiswaShell frame="370:3829" active="portfolio">
      <header className="mb-6">
        <h1 className="text-[30px] font-semibold leading-[38px]">
          Portofolio Pribadi
        </h1>
        <p className="mt-1 text-sm text-secondary">
          Kumpulan karya Anda. Portofolio bersifat pribadi dan tidak memiliki
          tautan publik.
        </p>
      </header>
      <div className="mb-5 flex flex-wrap gap-3">
        <label className="relative w-full sm:w-80">
          <span className="pointer-events-none absolute left-3 top-3">
            <SiswaIcon frame="370:3829" name="imgIcon1" />
          </span>
          <input
            aria-label="Cari project"
            className={`${studentControl} !pl-9`}
            placeholder="Cari project"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select
          aria-label="Periode portofolio"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className={`${studentControl} sm:!w-44`}
        >
          <option value="all">Semua periode</option>
          {years.map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>
        <select
          aria-label="Status portofolio"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={`${studentControl} sm:!w-44`}
        >
          <option value="all">Semua status</option>
          <option value="ongoing">Berlangsung</option>
          <option value="ended">Berakhir</option>
          <option value="upcoming">Segera dimulai</option>
        </select>
      </div>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {filtered.map((e) => {
          const row = enrollmentProgress(
              e,
              studentId,
              state.learning,
              state.rubrics[e.rubricId ?? ""],
            ),
            percent = row.total
              ? Math.round((row.submitted / row.total) * 100)
              : 0;
          return (
            <Surface key={e.id} className="flex min-h-[252px] flex-col !p-6">
              <div className="mb-3 flex flex-wrap gap-2">
                <StatusBadge
                  status={e.status === "ended" ? "missing" : "pending"}
                >
                  {e.status === "ended"
                    ? "Berakhir"
                    : e.status === "upcoming"
                      ? "Segera dimulai"
                      : "Berlangsung"}
                </StatusBadge>
                <StudentEventCompletionBadge status={eventCompletionStatus(row)} />
              </div>
              <h2 className="mb-2 text-base font-semibold">{e.title}</h2>
              <p className="text-xs text-secondary">{formatPeriod(e.period)}</p>
              <div className="my-5 space-y-3 text-xs">
                <div className="flex justify-between gap-2">
                  <span className="text-secondary">Karya</span>
                  <span>
                    {row.submitted} dari {row.total} milestone terkumpul ·{" "}
                    {percent}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-teal-600"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
              <div className="mt-auto flex flex-wrap items-end justify-between gap-3 text-xs">
                <div>
                  <p className="mb-1 text-secondary">Nilai akhir</p>
                  <p
                    className={
                      row.score !== null
                        ? "text-base font-semibold"
                        : "text-secondary"
                    }
                  >
                    {row.score ?? "Belum dinilai"}
                  </p>
                </div>
                <Link
                  href={`/siswa/portfolio?event=${e.id}`}
                  className="rounded-lg px-3 py-2 font-medium hover:bg-gray-50"
                >
                  Lihat Karya
                </Link>
              </div>
            </Surface>
          );
        })}
      </div>
      {!filtered.length && (
        <EmptyRows>
          Tidak ada karya yang sesuai pencarian.{" "}
          <Link href="/siswa/events" className="text-primary">
            Jelajah Event
          </Link>
        </EmptyRows>
      )}
    </SiswaShell>
  );
}
function PortfolioEvent({
  event,
  project,
}: {
  event: ManagedEvent;
  project: boolean;
}) {
  const state = useEventDraftStore(),
    identity = useStudentIdentity(),
    studentId = identity.studentId ?? "",
    rubric = state.rubrics[event.rubricId ?? ""],
    row = enrollmentProgress(event, studentId, state.learning, rubric),
    conditions = certificateConditions(event, row, state.learning),
    claim = state.studentUI.certificates[enrollmentKey(event.id,studentId)],
    [preview, setPreview] = useState(false),
    [notice, setNotice] = useState(""),
    [error, setError] = useState(""),
    [history, setHistory] = useState<string | null>(null),
    selected = row.submissions.find((s) => s?.id === history),
    hasRevision = row.submissions.some(
      (s) => submissionStatus(s, state.learning) === "revision",
    ),
    frame = project
      ? claim
        ? "370:5120"
        : row.score !== null
          ? "370:4833"
          : "370:5687"
      : hasRevision
        ? "370:4068"
        : row.score !== null
          ? "370:4426"
          : "370:5414";
  async function download() {
    if (!claim) return;
    setNotice(""); setError("");
    const result = await claimStudentCertificate(event.id);
    if (result.error) { setError(result.error); return; }
    prototypePdf(
      "Dokumen Penyelesaian Belajar Contoh",
      [
        claim.studentName,
        event.title,
        `Nilai tercatat: ${claim.score}`,
        `Diklaim: ${claim.claimedAt.replace("T", " ")} WIB`,
        `ID contoh: ${claim.id}`,
        "Pemandu demo: Bapak Budi (tokoh fiktif)",
        "Nama dibekukan saat klaim. Tidak ada tanda tangan institusi.",
      ],
      `sertifikat-prototipe-${event.id}.pdf`,
    );
    const recorded = await markCertificateDownloaded(event.id);
    setNotice(recorded ? "PDF contoh dibuat dan catatan unduh tersimpan. Periksa unduhan browser." : "PDF contoh dibuat, tetapi catatan unduh gagal disimpan. Periksa pesan server.");
  }
  return (
    <SiswaShell frame={preview ? "370:5945" : frame} active="portfolio">
      <Breadcrumb
        items={[
          {
            label: project ? "Dashboard" : "Portofolio Pribadi",
            href: project ? "/siswa/dashboard" : "/siswa/portfolio",
          },
          { label: event.title },
          ...(project ? [{ label: "Detail Project" }] : []),
        ]}
      />
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-[30px] font-semibold leading-[38px]">
            {event.title}
          </h1>
          {project ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge
                status={event.status === "ended" ? "missing" : "pending"}
              >
                {event.status === "ended"
                  ? "Berakhir"
                  : event.status === "upcoming"
                    ? "Segera dimulai"
                    : "Berlangsung"}
              </StatusBadge>
              <StudentEventCompletionBadge status={eventCompletionStatus(row)} />
              {!project && (
                <p className="text-xs text-secondary">
                  {event.period} · Mode {event.mode}
                </p>
              )}
            </div>
          ) : (
            <div className="mt-1 text-sm leading-5 text-secondary">
              <StudentEventCompletionBadge status={eventCompletionStatus(row)} />
              <p>
                {eventDescriptions[event.id] ||
                  plainHtml(event.caseStudyHtml) ||
                  "Karya dan dokumentasi pembelajaran pada event ini."}
              </p>
              <p className="mt-1 break-words">
                {identity.name} · {formatPeriod(event.period)}
              </p>
            </div>
          )}
        </div>
        {project ? (
          <div className="rounded-2xl border border-line bg-white px-4 py-3">
            <p className="text-xs text-secondary">Nilai akhir (0–100)</p>
            <p className="mt-1 text-2xl font-semibold">
              {row.score ?? "Belum dinilai"}
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-40 rounded-2xl bg-white px-4 py-3 shadow-[0_0_0_1px_#0000000f]">
              <p className="text-xs leading-4 text-secondary">
                Nilai akhir (0–100)
              </p>
              <p
                className={`mt-1 text-base font-semibold leading-5 ${row.score === null ? "text-secondary" : ""}`}
              >
                {row.score ?? "Belum dinilai"}
              </p>
            </div>
            <SiswaLink href={projectHref(event.id)}>
              <SiswaIcon frame="370:4068" name="imgIcon2" />
              Buka Project
            </SiswaLink>
          </div>
        )}
      </header>
      {notice && (
        <div className="mb-5">
          <StudentNotice tone="green">{notice}</StudentNotice>
        </div>
      )}
      {error && (
        <p role="alert" className="mb-4 text-sm text-danger">
          {error}
        </p>
      )}
      {project && (
        <div className="mb-6 rounded-2xl border border-line bg-white p-6">
          <LearningProgress
            value={
              row.total ? Math.round((row.completed / row.total) * 100) : 0
            }
            label={`${row.completed} dari ${row.total} milestone selesai · ${row.total ? Math.round((row.completed / row.total) * 100) : 0}%`}
            helper="Progres 100% belum berarti sudah dinilai atau berhak sertifikat."
          />
        </div>
      )}
      <div
        className={
          project
            ? "grid items-start gap-6 xl:grid-cols-[minmax(0,2.067fr)_minmax(0,1fr)]"
            : ""
        }
      >
        <div className="space-y-4">
          {project && <h2 className="mb-2 font-semibold">Milestone</h2>}
          {event.milestones.map((m, i) => {
            const s = row.submissions[i],
              status = submissionStatus(s, state.learning),
              score =
                s && status === "reviewed"
                  ? rubricScore(assessmentFor(s, state.learning), rubric)
                  : null;
            if (!project)
              return (
                <MilestoneWorkCard
                  key={m.id}
                  event={event}
                  index={i}
                  submission={s}
                />
              );
            return (
              <Surface
                key={m.id}
                className={project ? "relative sm:!pl-[76px]" : ""}
              >
                {project && (
                  <span
                    className={`mb-3 grid size-9 shrink-0 place-items-center rounded-full text-xs font-medium sm:absolute sm:left-6 sm:top-6 sm:mb-0 ${submissionComplete(s) ? "bg-[#00a63e] text-white" : "bg-gray-100 text-secondary"}`}
                  >
                    {submissionComplete(s) ? (
                      <SiswaIcon frame="370:4833" name="imgIcon2" />
                    ) : (
                      i + 1
                    )}
                  </span>
                )}
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="mb-1 text-xs text-secondary">
                      Milestone {i + 1}
                    </p>
                    <h2 className="font-semibold">{m.title}</h2>
                  </div>
                  <StatusBadge status={status}>{submissionLabels[status]}</StatusBadge>
                </div>
                {project && (
                  <>
                    <div className="my-3 grid gap-2 text-xs text-secondary sm:grid-cols-2">
                      <p>
                        Deadline:{" "}
                        {m.deadline
                          ? formatEventDate(m.deadline, true)
                          : "Belum ditentukan"}
                      </p>
                      <p>Nilai: {score?.percent ?? "Belum dinilai"}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={s ? "complete" : "missing"}>
                        {s ? "Sudah dikumpulkan" : "Belum dikumpulkan"}
                      </StatusBadge>
                      <StatusBadge
                        status={s?.surveyComplete ? "complete" : "missing"}
                      >
                        {!milestoneRequiresSurvey(m, s) ? "Survei tidak diwajibkan" : s?.surveyComplete
                          ? "Form terkirim"
                          : "Form belum terkirim"}
                      </StatusBadge>
                    </div>
                    <div className="mt-2">
                      {s ? (
                        <SiswaButton
                          variant="plain"
                          className="!min-h-9 !text-[13px]"
                          onClick={() => setHistory(s.id)}
                        >
                          Lihat Pengumpulan
                        </SiswaButton>
                      ) : (
                        <SiswaLink
                          href={workHref(event.id, m.id)}
                          className="!min-h-9 !text-[13px]"
                        >
                          Buka Ruang Kerja
                        </SiswaLink>
                      )}
                    </div>
                  </>
                )}
              </Surface>
            );
          })}
        </div>
        {project && (
          <aside className="space-y-6">
            {
              <>
                <Surface>
                  <h2 className="mb-4 font-semibold">Ringkasan project</h2>
                  {[
                    [
                      "Studi kasus",
                      plainHtml(event.caseStudyHtml) ||
                        (event.id === "wireframe"
                          ? "Buat wireframe aplikasi perpustakaan sekolah untuk peminjaman buku."
                          : "Lihat rincian event dan instruksi milestone."),
                    ],
                    [
                      "Ketentuan",
                      "Lanjut ke milestone berikutnya setelah tugas dan form selesai.",
                    ],
                    [
                      "Arahan",
                      plainHtml(event.directionsHtml) ||
                        (event.id === "wireframe"
                          ? "Fokus pada struktur, bukan warna."
                          : "Ikuti instruksi dan format pengumpulan tiap milestone."),
                    ],
                    [
                      "Syarat sertifikat",
                      `Semua tugas dan form selesai, penilaian lengkap, nilai akhir minimal ${conditions.threshold}.`,
                    ],
                  ].map(([label, value]) => (
                    <div key={label} className="mb-4 last:mb-0">
                      <h3 className="mb-1 text-xs font-semibold">{label}</h3>
                      <p className="whitespace-pre-wrap text-xs leading-5 text-secondary">
                        {value}
                      </p>
                    </div>
                  ))}
                </Surface>
                <Surface>
                  <div className="flex items-start gap-3">
                    <span className="mt-1 shrink-0 rounded-xl border border-amber-200 bg-amber-50 p-2">
                      <SiswaIcon frame="370:4833" name="imgIcon5" />
                    </span>
                    <div>
                      <h2 className="font-semibold">Sertifikat</h2>
                      <p className="mb-4 mt-1 text-xs leading-4 text-secondary">
                        Deadline berakhir saja tidak membuat Anda lulus. Dokumen
                        ini hanya contoh penyelesaian belajar.
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-3 text-xs">
                    {[
                      [
                        conditions.tasks,
                        `Semua tugas dan form selesai (${row.completed} dari ${row.total})`,
                      ],
                      [
                        conditions.assessed,
                        `Penilaian lengkap (${row.reviewed} dari ${row.total} milestone)`,
                      ],
                      [
                        conditions.score,
                        `Nilai akhir minimal ${conditions.threshold}`,
                      ],
                      [conditions.noRevision, "Tidak ada revisi terbuka"],
                    ].map(([ok, label]) => (
                      <li
                        key={String(label)}
                        className="flex items-start gap-2"
                      >
                        <span
                          aria-label={ok ? "Terpenuhi" : "Belum terpenuhi"}
                          className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${ok ? "bg-[#00a63e] text-white" : "border border-gray-300 text-gray-400"}`}
                        >
                          {ok ? (
                            <SiswaIcon frame="370:4833" name="imgIcon6" />
                          ) : (
                            "○"
                          )}
                        </span>
                        {label}
                      </li>
                    ))}
                  </ul>
                  {claim ? (
                    <>
                      <div className="my-4 rounded-xl bg-green-50 p-3 text-xs text-green-800">
                        <p className="font-semibold">Dokumen contoh diklaim</p>
                        <p className="mt-1">
                          {formatEventDate(claim.claimedAt, true)} · nilai
                          tercatat {claim.score}
                        </p>
                        <p className="mt-1 break-all">{claim.id}</p>
                        <p className="mt-1">
                          Nama saat klaim: {claim.studentName}
                        </p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <SiswaButton
                          variant="outline"
                          onClick={() => setPreview(true)}
                        >
                          Lihat
                        </SiswaButton>
                        <SiswaButton onClick={download}>Unduh PDF</SiswaButton>
                      </div>
                    </>
                  ) : (
                    <SiswaButton
                      className="mt-5 w-full"
                      disabled={!conditions.eligible}
                      onClick={() => setPreview(true)}
                    >
                      <SiswaIcon frame="370:4833" name="imgIcon7" />
                      Klaim Sertifikat
                    </SiswaButton>
                  )}
                  <p className="mt-3 text-[11px] leading-4 text-secondary">
                    Prototipe · bukan sertifikat kompetensi resmi, tanpa tanda
                    tangan institusi atau layanan verifikasi.
                  </p>
                </Surface>
              </>
            }
          </aside>
        )}
      </div>
      {selected && (
        <SiswaDialog
          title="Riwayat Pengumpulan"
          wide
          onClose={() => setHistory(null)}
        >
          <div className="space-y-6">
            {selected.versions.map((v) => (
              <div key={v.version}>
                <h3 className="mb-3 text-sm font-semibold">
                  Versi {v.version} · {formatEventDate(v.submittedAt, true)}
                </h3>
                <StudentEvidence submission={selected} version={v} />
              </div>
            ))}
          </div>
          <SiswaButton
            variant="outline"
            className="mt-5"
            onClick={() => setHistory(null)}
          >
            Tutup
          </SiswaButton>
        </SiswaDialog>
      )}
      {preview && (
        <SiswaDialog
          title={
            claim
              ? "Sertifikat Pembelajaran Contoh"
              : "Klaim Sertifikat Pembelajaran PjBL"
          }
          label="Prototipe · Tidak Resmi"
          frame="370:5945"
          wide
          blur
          onClose={() => setPreview(false)}
        >
          <div className="relative overflow-hidden rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-white to-teal-50 p-6 text-center">
            <p className="text-xs font-medium tracking-widest text-primary">
              L · LUGINA PJBL — DEMONSTRASI
            </p>
            <h3 className="my-5 text-xl font-semibold">
              Dokumen Penyelesaian Belajar
            </h3>
            <p className="text-xs text-secondary">
              Contoh pembelajaran diberikan kepada
            </p>
            <p className="my-3 break-words text-2xl font-semibold text-primary">
              {claim?.studentName ?? identity.name}
            </p>
            <p className="text-xs leading-5 text-secondary">
              Telah menyelesaikan event contoh
            </p>
            <p className="my-3 font-semibold">{event.title}</p>
            <p className="text-xs">
              Nilai tercatat: {claim?.score ?? row.score}
            </p>
            <p className="mb-1 mt-8 text-sm">
              Bapak Budi · Pemandu Demo Fiktif
            </p>
            <p className="text-[10px] font-semibold text-amber-800">
              CONTOH PROTOTIPE · TANPA TANDA TANGAN INSTITUSI
            </p>
          </div>
          <p className="mt-4 text-xs leading-5 text-secondary">
            Nama dibekukan pada saat klaim. Catatan dokumen disimpan di server
            dan PDF contoh dibuat di browser; tidak ada penerbitan resmi
            atau verifikasi eksternal.
          </p>
          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <SiswaButton variant="outline" onClick={() => setPreview(false)}>
              {claim ? "Tutup" : "Batal"}
            </SiswaButton>
            {claim ? (
              <SiswaButton onClick={download}>Unduh PDF</SiswaButton>
            ) : (
              <SiswaButton
                onClick={async () => {
                  const r = await claimStudentCertificate(event.id);
                  setError(r.error ?? "");
                  if (r.claim) {
                    setNotice(
                      "Catatan dokumen belajar prototipe tersimpan di server.",
                    );
                    setPreview(false);
                  }
                }}
              >
                Konfirmasi &amp; Klaim Contoh
              </SiswaButton>
            )}
          </div>
        </SiswaDialog>
      )}
    </SiswaShell>
  );
}
