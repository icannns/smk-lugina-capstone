"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  listedEvents,
  useEventDraftStore,
  useTeacherProfile,
} from "@/lib/guru/event-draft-store";
import {
  eventLearning,
  assessmentFor,
  feedbackFor,
  monitoringHref,
  rubricScore,
  submissionStatus,
  certificateThreshold,
  assessmentStatus,
  assessmentLabels,
} from "@/lib/guru/learning-selectors";
import { formatEventDate } from "@/lib/guru/event-selectors";
import { prototypePdf } from "@/lib/guru/client-export";
import { TeacherPage } from "../teacher-page";
import { Surface, DesignIcon, controlClass } from "../design-ui";
import {
  EmptyRows,
  FeatureHeading,
  Pagination,
  SearchField,
  StatusBadge,
  StudentAvatar,
} from "../learning-ui";
import {
  DashboardDialog,
  type DashboardDialogState,
} from "../dashboard-dialog";
import { Evidence } from "../monitoring/submission-assessment";
export function StudentWork() {
  const teacher = useTeacherProfile();
  const params = useSearchParams(),
    state = useEventDraftStore(),
    events = listedEvents(state).filter((e) => e.status !== "draft"),
    eventId = params.get("event"),
    studentId = params.get("student"),
    event = events.find((e) => e.id === eventId);
  const archiveEvents = events.filter((e) => e.status !== "upcoming");
  const [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all"),
    [page, setPage] = useState(1),
    [dialog, setDialog] = useState<DashboardDialogState | null>(null);
  const frame = studentId ? "291:26470" : eventId ? "291:26201" : "291:25994";
  const href = (id: string, student?: string) =>
    `/guru/work?event=${encodeURIComponent(id)}${student ? `&student=${encodeURIComponent(student)}` : ""}`;
  const data = event
      ? eventLearning(
          event,
          state.learning,
          state.rubrics[event.rubricId ?? ""],
        )
      : null,
    row = data?.rows.find((r) => r.student.id === studentId),
    rubric = state.rubrics[event?.rubricId ?? ""];
  const progress =
      data?.rows.filter(
        (r) =>
          r.student.name.toLowerCase().includes(search.toLowerCase()) &&
          (filter === "all" ||
            (filter === "reviewed" && assessmentStatus(r) === "complete") ||
            filter === assessmentStatus(r)),
      ) ?? [],
    current = Math.min(page, Math.max(1, Math.ceil(progress.length / 20)));
  function reset() {
    setSearch("");
    setFilter("all");
    setPage(1);
  }
  return (
    <TeacherPage activePage="work" frame={frame}>
      {!eventId ? (
        <>
          <FeatureHeading
            title="Karya Siswa"
            description="Arsip karya per event. Halaman ini hanya untuk melihat — penilaian dilakukan di Monitoring."
          />
          <div className="mb-4 flex flex-wrap gap-2">
            <SearchField
              placeholder="Cari event"
              frame={frame}
              value={search}
              onChange={setSearch}
            />
            <select
              aria-label="Filter event"
              className={`${controlClass} sm:!w-52 !border-transparent`}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Semua event</option>
              <option value="ongoing">Berlangsung</option>
              <option value="ended">Berakhir</option>
            </select>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {archiveEvents
              .filter(
                (e) =>
                  (filter === "all" || e.status === filter) &&
                  e.title.toLowerCase().includes(search.toLowerCase()),
              )
              .map((e) => {
                const d = eventLearning(
                    e,
                    state.learning,
                    state.rubrics[e.rubricId ?? ""],
                  ),
                  percent = d.rows.length
                    ? Math.round((d.finished / d.rows.length) * 100)
                    : 0;
                return (
                  <Surface
                    padded={false}
                    key={e.id}
                    className="overflow-hidden"
                  >
                    <div className="h-28 bg-[linear-gradient(120deg,#438cff,#12bdb3)] p-4">
                      <StatusBadge
                        status={e.status === "ongoing" ? "pending" : "missing"}
                      >
                        {e.status === "ongoing"
                          ? "Berlangsung"
                          : e.status === "ended"
                            ? "Berakhir"
                            : "Belum dimulai"}
                      </StatusBadge>
                    </div>
                    <div className="p-6">
                      <h2 className="font-semibold">{e.title}</h2>
                      <p className="mt-1 text-xs text-secondary">
                        {e.period.split(",")[0]} –{" "}
                        {e.period.split(" – ")[1]?.split(",")[0] ??
                          "Belum diatur"}{" "}
                        · {d.rows.length} peserta
                      </p>
                      <div className="mb-2 mt-4 flex justify-between gap-2 text-xs">
                        <span className="text-secondary">Siswa selesai</span>
                        <span>
                          {d.finished} dari {d.rows.length} siswa · {percent}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-teal-600"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <p className="mt-4 text-xs text-secondary">
                        {d.rows.length - d.finished} siswa belum selesai
                      </p>
                      <Link
                        href={href(e.id)}
                        onClick={reset}
                        className="mt-5 flex h-10 items-center justify-center gap-2 text-sm"
                      >
                        <DesignIcon frame="291:25994" name="imgIcon2" />
                        Lihat Karya
                      </Link>
                    </div>
                  </Surface>
                );
              })}
          </div>
          {!archiveEvents.some(
            (e) =>
              (filter === "all" || e.status === filter) &&
              e.title.toLowerCase().includes(search.toLowerCase()),
          ) && <EmptyRows>Event tidak ditemukan.</EmptyRows>}
        </>
      ) : !event || (studentId && !row) ? (
        <EmptyRows>
          Event atau peserta tidak ditemukan.{" "}
          <Link href="/guru/work" className="text-primary" onClick={reset}>
            Kembali ke Karya Siswa
          </Link>
        </EmptyRows>
      ) : (
        <>
          <nav
            aria-label="Breadcrumb"
            className="mb-4 flex flex-wrap items-center gap-2 text-xs text-secondary"
          >
            <Link href="/guru/work" onClick={reset}>
              Karya Siswa
            </Link>
            <span>›</span>
            {studentId ? (
              <Link href={href(event.id)} onClick={reset}>
                {event.title}
              </Link>
            ) : (
              <span className="text-foreground">{event.title}</span>
            )}
            {row && (
              <>
                <span>›</span>
                <span className="text-foreground">{row.student.name}</span>
              </>
            )}
          </nav>
          {!row ? (
            <>
              <h1 className="text-[30px] font-semibold leading-[38px] tracking-[-.75px]">
                {event.title}
              </h1>
              <div className="mb-6 mt-1 flex items-center gap-2 text-sm text-secondary">
                <StatusBadge status="missing">
                  {event.status === "ended"
                    ? "Berakhir"
                    : event.status === "ongoing"
                      ? "Berlangsung"
                      : "Belum dimulai"}
                </StatusBadge>
                {data!.rows.length} peserta
              </div>
              <Surface padded={false} className="overflow-hidden">
                <div className="flex flex-wrap gap-4 border-b border-line p-4">
                  <SearchField
                    value={search}
                    onChange={(v) => {
                      setSearch(v);
                      setPage(1);
                    }}
                    frame={frame}
                    icon="imgIcon1"
                  />
                  <select
                    aria-label="Status penilaian"
                    value={filter}
                    onChange={(e) => {
                      setFilter(e.target.value);
                      setPage(1);
                    }}
                    className={`${controlClass} !border-transparent sm:!w-40`}
                  >
                    <option value="all">Semua</option>
                    <option value="reviewed">Seluruhnya dinilai</option>
                    <option value="partial">Sebagian dinilai</option>
                    <option value="none">Belum dinilai</option>
                  </select>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="h-10 bg-gray-50 text-xs font-normal text-secondary">
                      <tr>
                        {[
                          "Nama",
                          "Progres",
                          "Status penilaian",
                          "Nilai akhir",
                          "",
                        ].map((v, i) => (
                          <th key={i} className="px-4 font-normal">
                            {v}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {progress
                        .slice((current - 1) * 20, current * 20)
                        .map((r) => (
                          <tr
                            key={r.student.id}
                            className="h-14 border-t border-line"
                          >
                            <td className="px-4">
                              <div className="flex items-center gap-2">
                                <StudentAvatar name={r.student.name} small />
                                {r.student.name}
                              </div>
                            </td>
                            <td className="px-4">
                              {r.submitted} dari {r.total} milestone
                            </td>
                            <td className="px-4">
                              <StatusBadge status={assessmentStatus(r)}>
                                {assessmentLabels[assessmentStatus(r)]}
                              </StatusBadge>
                            </td>
                            <td className="px-4">
                              <span
                                className={
                                  r.score === null
                                    ? "text-xs text-secondary"
                                    : "font-semibold"
                                }
                              >
                                {r.score ??
                                  assessmentLabels[assessmentStatus(r)]}
                              </span>
                            </td>
                            <td className="px-4">
                              <Link
                                href={href(event.id, r.student.id)}
                                onClick={reset}
                                aria-label={`Lihat Detail ${r.student.name}`}
                                className="rounded-full bg-blue-50 px-3 py-2 text-xs text-primary"
                              >
                                Lihat Detail
                              </Link>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                {!progress.length && (
                  <EmptyRows>Belum ada karya yang sesuai filter.</EmptyRows>
                )}
                {progress.length > 20 && (
                  <Pagination
                    total={progress.length}
                    page={current}
                    size={20}
                    onChange={setPage}
                  />
                )}
              </Surface>
            </>
          ) : (
            <>
              <div className="mb-1 flex items-center gap-3">
                <StudentAvatar name={row.student.name} />
                <h1 className="text-[30px] font-semibold leading-[38px] tracking-[-.75px]">
                  {row.student.name}
                </h1>
              </div>
              <p className="mb-6 text-sm text-secondary">
                {row.student.email} · Event: {event.title}
              </p>
              <div className="mb-6 grid gap-4 lg:grid-cols-3">
                <Surface className="flex min-h-36 flex-col items-center justify-center">
                  <p className="text-xs text-secondary">Nilai akhir</p>
                  <p className="mt-1 text-[30px] font-semibold">
                    {row.score ?? "—"}
                  </p>
                </Surface>
                <Surface className="flex min-h-36 flex-col justify-center">
                  <div className="mb-2 flex justify-between gap-2 text-xs">
                    <span className="text-secondary">Progres</span>
                    <span>
                      {row.submitted} dari {row.total} milestone ·{" "}
                      {row.total
                        ? Math.round((row.submitted / row.total) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-teal-600"
                      style={{
                        width: `${row.total ? (row.submitted / row.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </Surface>
                <Surface className="flex min-h-36 flex-col justify-center">
                  <p className="text-xs text-secondary">Sertifikat</p>
                  {row.score !== null &&
                  row.completed === row.total &&
                  row.score >= certificateThreshold(event) ? (
                    <>
                      <p className="my-2 text-xs text-secondary">
                        Dokumen penyelesaian contoh · bukan sertifikat resmi
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setDialog({
                              title: "Sertifikat contoh",
                              description: `PROTOTIPE — ${row.student.name} menyelesaikan ${event.title}, nilai ${row.score}. Ini hanya contoh dokumen pembelajaran, bukan penerbitan atau sertifikasi resmi.`,
                            })
                          }
                          className="flex items-center gap-2 text-xs"
                        >
                          <DesignIcon frame={frame} name="imgIcon1" />
                          Lihat
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            prototypePdf(
                              "Dokumen penyelesaian contoh",
                              [
                                `Nama: ${row.student.name}`,
                                `Event: ${event.title}`,
                                `Nilai: ${row.score}`,
                              ],
                              `sertifikat-demo-${row.student.id}.pdf`,
                            )
                          }
                          className="flex items-center gap-2 rounded-control bg-primary px-3 py-2 text-xs text-white"
                        >
                          <DesignIcon frame={frame} name="imgIcon2" />
                          Unduh PDF
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="mt-2 text-xs text-secondary">
                      {row.score === null
                        ? "Penilaian belum lengkap."
                        : "Nilai belum memenuhi ambang sertifikat contoh."}
                    </p>
                  )}
                </Surface>
              </div>
              <ol className="ml-5 space-y-4 border-l border-line pl-8">
                {event.milestones.map((m, i) => {
                  const s = row.submissions[i],
                    version = s?.versions.at(-1),
                    status = submissionStatus(s, state.learning),
                    score = s
                      ? rubricScore(assessmentFor(s, state.learning), rubric)
                      : null,
                    feedback = s ? feedbackFor(s.id, state.learning) : [],
                    isRevision = (versionNumber: number) => versionNumber > 1 &&
                      feedback.some((item) => item.revision && item.version === versionNumber - 1),
                    revisions = s?.versions.filter((entry) => isRevision(entry.version)).length ?? 0;
                  return (
                    <li key={m.id} className="relative">
                      <span
                        className={`absolute -left-[53px] top-5 grid size-10 place-items-center rounded-full border-4 border-page text-sm text-white ${status === "reviewed" ? "bg-green-600" : "bg-gray-400"}`}
                      >
                        {i + 1}
                      </span>
                      <Surface>
                        <div className="flex flex-wrap justify-between gap-2">
                          <div>
                            <h2 className="font-semibold">{m.title || m.id}</h2>
                            <p className="mt-1 text-xs text-secondary">
                              {version
                                ? `Dikirim ${formatEventDate(version.submittedAt, true)}`
                                : "Belum dikumpulkan"}
                            </p>
                          </div>
                          <div className="flex items-start gap-2">
                            <StatusBadge status={status} />
                            {score && (
                              <span className="text-sm font-medium">
                                Nilai {score.percent}
                              </span>
                            )}
                          </div>
                        </div>
                        {s && version && (
                          <div className="mt-4">
                            <Evidence submission={s} version={version} onPreview={setDialog} />
                            {version.note && (
                              <p className="mt-2 whitespace-pre-wrap [overflow-wrap:anywhere] text-sm">{version.note}</p>
                            )}
                            {version.link && (
                              <a href={version.link} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-primary hover:underline">
                                Buka tautan karya
                              </a>
                            )}
                          </div>
                        )}
                        {feedback.map((f) => (
                          <div
                            key={f.id}
                            className="mt-3 rounded-xl bg-gray-50 p-3"
                          >
                            <p className="mb-1 text-xs text-secondary">
                              {teacher.name} ·{" "}
                              {formatEventDate(f.createdAt.slice(0, 16))}
                            </p>
                            <p className="whitespace-pre-wrap text-sm">
                              {f.message}
                            </p>
                          </div>
                        ))}
                        {s && s.versions.length > 1 && (
                          <details className="mt-3">
                            <summary className="cursor-pointer text-center text-xs text-primary">
                              Riwayat pengumpulan{revisions > 0 ? ` (${revisions} revisi)` : ""}
                            </summary>
                            <div className="mt-3 space-y-2">
                              {[...s.versions].reverse().map((v) => (
                                <div key={v.version}>
                                  <p className="mb-1 text-xs text-secondary">
                                    {v.version === 1 ? "Pengumpulan awal" : isRevision(v.version) ? `Revisi versi ${v.version}` : `Pengumpulan versi ${v.version}`} ·{" "}
                                    {formatEventDate(v.submittedAt, true)}
                                  </p>
                                  <Evidence
                                    submission={s}
                                    version={v}
                                    onPreview={setDialog}
                                  />
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                      </Surface>
                    </li>
                  );
                })}
              </ol>
              <p className="mt-6 text-xs text-secondary">
                ⓘ Nilai tidak dapat diubah dari halaman ini.{" "}
                <span className="rounded bg-gray-100 px-2 py-1">
                  Hanya baca
                </span>{" "}
                <Link
                  href={monitoringHref(
                    event.id,
                    row.student.id,
                    event.milestones[0]?.id,
                  )}
                  className="ml-2 text-primary"
                >
                  Buka Monitoring →
                </Link>
              </p>
            </>
          )}
        </>
      )}
      <DashboardDialog
        action={dialog}
        onClose={() => setDialog(null)}
        onDelete={() => setDialog(null)}
      />
    </TeacherPage>
  );
}
