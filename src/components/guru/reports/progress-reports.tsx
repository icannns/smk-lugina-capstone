"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { listedEvents, useEventDraftStore } from "@/lib/guru/event-draft-store";
import {
  emptyReportFilters,
  reportRows,
  reportExport,
  type ReportFilters,
} from "@/lib/guru/report-selectors";
import {
  allStudents,
  milestoneSurveyLabel,
  allEnrollments,
  eventCompletionLabels,
  assessmentStatus,
  assessmentLabels,
  milestoneLabel,
} from "@/lib/guru/learning-selectors";
import { formatEventDate } from "@/lib/guru/event-selectors";
import { prototypePdf, downloadSpreadsheet } from "@/lib/guru/client-export";
import { TeacherPage } from "../teacher-page";
import { Surface, DesignIcon, controlClass } from "../design-ui";
import {
  FeatureHeading,
  EmptyRows,
  StatusBadge,
  Pagination,
} from "../learning-ui";
export function ProgressReports() {
  const params = useSearchParams();
  return (
    <ReportContent
      key={params.toString()}
      initial={
        Object.fromEntries(
          Object.entries(emptyReportFilters).map(([key, value]) => [
            key,
            params.get(key) ?? value,
          ]),
        ) as ReportFilters
      }
    />
  );
}
function ReportContent({ initial }: { initial: ReportFilters }) {
  const state = useEventDraftStore(),
    events = listedEvents(state).filter((e) => e.status !== "draft"),
    event = events.find((e) => e.id === initial.event);
  const [filters, setFilters] = useState(initial),
    [error, setError] = useState(""),
    [page, setPage] = useState(1);
  const selected = events.find((e) => e.id === filters.event),
    students = allEnrollments(state.learning)
      .filter((e) => e.eventId === selected?.id)
      .map((e) =>
        allStudents(state.learning).find((s) => s.id === e.studentId)!,
      )
      .filter(Boolean);
  const data = event
      ? reportRows(
          event,
          state.learning,
          state.rubrics[event.rubricId ?? ""],
          initial,
        )
      : null,
    frame =
      event?.id === "kantin" ? "291:27314" : event ? "291:26879" : "291:26708",
    current = Math.min(
      page,
      Math.max(1, Math.ceil((data?.rows.length ?? 0) / 20)),
    );
  function change(key: keyof ReportFilters, value: string) {
    setFilters((f) => ({
      ...f,
      [key]: value,
      ...(key === "event" ? { student: "all", milestone: "all" } : {}),
    }));
    setError("");
  }
  function show() {
    if (!selected) {
      setError("Pilih event terlebih dahulu.");
      return;
    }
    const q = new URLSearchParams(
      Object.entries(filters).filter(([k, v]) => k === "event" || v !== "all"),
    );
    window.history.pushState(null, "", `/guru/reports?${q}`);
  }
  const created = new Date().toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <TeacherPage activePage="reports" frame={frame}>
      <FeatureHeading
        title="Laporan Perkembangan"
        description="Rekap progres dan nilai siswa per event. Respons lengkap Form Survei dapat diakses pada menu Hasil Survei."
      />
      <Surface className="mb-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {(
            [
              [
                "event",
                "Pilih event",
                [["", "Pilih event"], ...events.map((e) => [e.id, e.title])],
              ],
              [
                "survey",
                "Status survei",
                [
                  ["all", "Semua status survei"],
                  ["complete", "Sudah diisi"],
                  ["missing", "Belum diisi"],
                ],
              ],
              [
                "student",
                "Siswa",
                [
                  ["all", "Semua siswa"],
                  ...students.map((s) => [s.id, s.name]),
                ],
              ],
              [
                "work",
                "Pengerjaan",
                [
                  ["all", "Semua pengerjaan"],
                  ["complete", "Selesai"],
                  ["awaitingAssessment", "Menunggu penilaian"],
                  ["working", "Dalam pengerjaan"],
                  ["none", "Belum mengerjakan"],
                ],
              ],
              [
                "assessment",
                "Penilaian",
                [
                  ["all", "Semua penilaian"],
                  ["complete", "Seluruhnya dinilai"],
                  ["partial", "Sebagian dinilai"],
                  ["none", "Belum dinilai"],
                ],
              ],
              [
                "milestone",
                "Milestone",
                [
                  ["all", "Semua milestone"],
                  ...(selected?.milestones.map((m) => [
                    m.id,
                    `${milestoneLabel(selected!, m.id)} · ${m.title}`,
                  ]) ?? []),
                ],
              ],
            ] as [keyof ReportFilters, string, string[][]][]
          ).map(([key, label, options]) => (
            <select
              key={key}
              aria-label={label}
              className={`${controlClass} !border-transparent !px-2 !text-[13px]`}
              value={filters[key]}
              onChange={(e) => change(key, e.target.value)}
            >
              {options.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setFilters(emptyReportFilters);
              window.history.pushState(null, "", "/guru/reports");
              setError("");
            }}
            className="h-10 rounded-control px-4 text-sm text-secondary"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={show}
            className="flex h-10 items-center gap-2 rounded-control bg-primary px-4 text-sm font-medium text-white"
          >
            <DesignIcon frame="291:26708" name="imgIcon1" />
            Tampilkan
          </button>
        </div>
        {error && (
          <p role="alert" className="mt-2 text-sm text-red-600">
            {error}
          </p>
        )}
        {selected && (
          <p className="mt-3 text-xs text-secondary">
            Semua siswa mencakup peserta event terpilih. Filter lain tetap berlaku.
            {filters.milestone !== "all" && " Filter milestone membatasi rincian tugas, survei, dan status nilai. Progres dan nilai akhir tetap mencakup seluruh event."}
          </p>
        )}
      </Surface>
      {!data || !event ? (
        <Surface className="flex min-h-[640px] flex-col items-center justify-center text-center">
          <span className="mb-4 rounded-2xl bg-blue-50 p-3">
            <DesignIcon frame="291:26708" name="imgIcon2" />
          </span>
          <h2 className="font-semibold">Pilih event lalu tekan Tampilkan</h2>
          <p className="mt-1 text-sm text-secondary">
            Laporan dibuat berdasarkan filter yang Anda pilih.
          </p>
        </Surface>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{event.title}</h2>
              <p className="text-xs text-secondary">
                {event.period} · Dibuat {created} WIB
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!data.rows.length}
                onClick={() =>
                  prototypePdf(
                    "Laporan perkembangan - data contoh",
                    [
                      event.title,
                      `Peserta: ${data.rows.length}, selesai: ${data.finished}, rata-rata: ${data.average ?? "-"}`,
                      "Nama | Progres | Nilai akhir",
                      ...data.rows.map(
                        (r) =>
                          `${r.student.name} | ${r.eventProgress.completed}/${r.eventProgress.total} | ${r.eventProgress.score ?? "Belum lengkap"}`,
                      ),
                    ],
                    `laporan-${event.id}-demo.pdf`,
                    "Data simulasi. Bukan laporan resmi institusi.",
                  )
                }
                className="flex h-10 items-center gap-2 rounded-control bg-white px-4 text-sm disabled:opacity-40"
              >
                <DesignIcon frame="291:27371" name="imgIcon" />
                Unduh PDF
              </button>
              <button
                type="button"
                disabled={!data.rows.length}
                onClick={() =>
                  downloadSpreadsheet(
                    `laporan-${event.id}-demo.xlsx`,
                    reportExport(event, data),
                  )
                }
                className="flex h-10 items-center gap-2 rounded-control bg-white px-4 text-sm disabled:opacity-40"
              >
                <DesignIcon frame="291:27371" name="imgIcon1" />
                Unduh Excel
              </button>
            </div>
          </div>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Peserta", data.rows.length, "", "imgIcon"],
              [
                "Selesai",
                data.finished,
                `dari ${data.rows.length} siswa`,
                "imgIcon1",
              ],
              [
                "Rata-rata progres",
                `${data.percent}%`,
                `nilai lengkap: ${data.scored} siswa`,
                "imgIcon2",
              ],
              [
                "Rata-rata nilai akhir",
                data.average ?? "—",
                `dari ${data.scored} siswa yang sudah dinilai`,
                "imgIcon3",
              ],
            ].map(([title, value, helper, icon], i) => (
              <Surface key={title} className="min-h-[146px]">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-xs text-secondary">{title}</h3>
                  <span
                    className={`rounded-xl p-2 ${["bg-blue-50", "bg-green-50", "bg-teal-50", "bg-purple-50"][i]}`}
                  >
                    <DesignIcon frame="291:27387" name={String(icon)} />
                  </span>
                </div>
                <p className="text-[30px] font-semibold leading-[38px]">
                  {value}
                </p>
                {helper && (
                  <p className="mt-1 text-xs text-secondary">{helper}</p>
                )}
              </Surface>
            ))}
          </div>
          <Surface padded={false} className="overflow-hidden">
            <div className="overflow-x-auto">
              <table
                className="w-full table-fixed text-left text-xs"
                style={{ minWidth: 1016 + data.milestones.length * 172 }}
              >
                <colgroup>
                  {[
                    150,
                    77,
                    105,
                    ...data.milestones.map(() => 172),
                    95,
                    109,
                    166,
                    181,
                    133,
                  ].map((width, i) => (
                    <col key={i} style={{ width }} />
                  ))}
                </colgroup>
                <thead className="h-11 bg-gray-50 text-[11px] text-secondary">
                  <tr>
                    <th className="sticky left-0 z-10 bg-gray-50 px-4 font-normal">
                      Nama
                    </th>
                    <th className="px-4 font-normal">Progres</th>
                    <th className="px-4 font-normal">Pengerjaan</th>
                    {data.milestones.map((m) => (
                      <th key={m.id} className="px-4 font-normal">
                        {milestoneLabel(event, m.id)} (tugas · survei · nilai)
                      </th>
                    ))}
                    {[
                      "Skor rubrik",
                      "Nilai konversi",
                      "Status nilai",
                      "Nilai akhir",
                      "Sertifikat",
                    ].map((title) => (
                      <th key={title} className="px-4 font-normal">
                        {title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rows
                    .slice((current - 1) * 20, current * 20)
                    .map((r) => (
                      <tr
                        key={r.student.id}
                        className="h-[46px] border-t border-line"
                      >
                        <td className="sticky left-0 z-10 bg-white px-4">
                          <Link
                            href={`/guru/work?event=${event.id}&student=${r.student.id}`}
                            className="hover:text-primary hover:underline"
                          >
                            {r.student.name}
                          </Link>
                        </td>
                        <td className="px-4">
                          {r.eventProgress.completed} dari {r.eventProgress.total}
                        </td>
                        <td className="px-4">
                          <StatusBadge status={r.eventProgress.status}>
                            {eventCompletionLabels[r.eventProgress.status]}
                          </StatusBadge>
                        </td>
                        {r.submissions.map((s, i) => (
                          <td key={i} className="px-4 text-[11px]">
                            {s
                              ? `${formatEventDate(s.versions.at(-1)!.submittedAt)} · ${milestoneSurveyLabel(data.milestones[i], s)} · ${r.scored[i]?.percent ?? "Belum dinilai"}`
                              : "— · — · Belum dinilai"}
                          </td>
                        ))}
                        <td className="px-4">
                          {r.scored.some(Boolean)
                            ? r.scored.reduce((s, v) => s + (v?.total ?? 0), 0)
                            : "—"}
                        </td>
                        <td className="px-4">
                          {r.scored.map((s) => s?.percent ?? "—").join(", ")}
                        </td>
                        <td className="px-4">
                          <StatusBadge status={assessmentStatus(r)}>
                            {assessmentLabels[assessmentStatus(r)]}
                          </StatusBadge>
                        </td>
                        <td className="px-4 font-semibold">{r.eventProgress.score ?? ""}</td>
                        <td className="px-4 text-[11px] text-secondary">
                          {r.certificateEligible ? (
                            <Link
                              href={`/guru/work?event=${event.id}&student=${r.student.id}`}
                              className="text-primary"
                            >
                              Contoh tersedia
                            </Link>
                          ) : (
                            "Belum memenuhi"
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {!data.rows.length && (
              <EmptyRows>
                <p>Tidak ada peserta yang sesuai filter laporan.</p>
                {Object.entries(initial).some(([key, value]) => key !== "event" && value !== "all") && (
                  <button
                    type="button"
                    onClick={() => window.history.pushState(null, "", `/guru/reports?${new URLSearchParams({ event: event.id })}`)}
                    className="mt-3 rounded-control border border-line bg-white px-4 py-2 font-medium text-primary"
                  >
                    Hapus filter lain
                  </button>
                )}
              </EmptyRows>
            )}
            <p className="border-t border-line px-4 py-3 text-xs text-secondary">
              Nilai kosong dibiarkan kosong; statusnya tercantum di kolom Status
              nilai.
            </p>
            {data.rows.length > 20 && (
              <Pagination
                total={data.rows.length}
                page={current}
                size={20}
                onChange={setPage}
              />
            )}
          </Surface>
        </>
      )}
      {state.storageError && (
        <p role="alert" className="mt-4 text-sm text-amber-800">
          {state.storageError}
        </p>
      )}
    </TeacherPage>
  );
}
