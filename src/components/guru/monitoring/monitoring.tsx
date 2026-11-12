"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { listedEvents, useEventDraftStore } from "@/lib/guru/event-draft-store";
import {
  eventLearning,
  monitoringHref,
  submissionStatus,
  workStatus,
  workLabels,
  assessmentStatus,
  assessmentLabels,
  milestoneLabel,
} from "@/lib/guru/learning-selectors";
import { formatEventDate } from "@/lib/guru/event-selectors";
import { TeacherPage } from "../teacher-page";
import { Surface, controlClass } from "../design-ui";
import {
  EmptyRows,
  EventSelect,
  FeatureHeading,
  Pagination,
  SearchField,
  StatusBadge,
  StudentAvatar,
} from "../learning-ui";
import { Assessment } from "./submission-assessment";
export function Monitoring() {
  const params = useSearchParams(),
    state = useEventDraftStore();
  const events = listedEvents(state).filter((e) => e.status !== "draft"),
    event = events.find((e) => e.id === (params.get("event") ?? "kantin"));
  if (!event)
    return (
      <TeacherPage activePage="monitoring" frame="291:21691">
        <EmptyRows>
          Event tidak ditemukan.{" "}
          <Link href="/guru/monitoring" className="text-primary">
            Kembali ke Monitoring
          </Link>
        </EmptyRows>
      </TeacherPage>
    );
  if (params.get("student"))
    return (
      <Assessment
        key={JSON.stringify([event.id,params.get("student"),params.get("milestone")])}
        event={event}
        studentId={params.get("student")!}
        milestoneId={params.get("milestone") ?? event.milestones[0]?.id}
      />
    );
  return <MonitoringList key={event.id} eventId={event.id} />;
}
function MonitoringList({ eventId }: { eventId: string }) {
  const state = useEventDraftStore(),
    events = listedEvents(state).filter((e) => e.status !== "draft"),
    event = events.find((e) => e.id === eventId)!;
  const data = eventLearning(
    event,
    state.learning,
    state.rubrics[event.rubricId ?? ""],
  );
  const [search, setSearch] = useState(""),
    [milestone, setMilestone] = useState("all"),
    [filter, setFilter] = useState("all"),
    [page, setPage] = useState(1);
  const filtered = data.rows.filter(
    (r) =>
      r.student.name
        .toLocaleLowerCase("id")
        .includes(search.trim().toLocaleLowerCase("id")) &&
      (filter === "all" ||
        r.submissions.some(
          (s, i) =>
            (milestone === "all" || event.milestones[i].id === milestone) &&
            (filter === "missing"
              ? submissionStatus(s, state.learning) === "missing"
              : filter === "revision"
                ? submissionStatus(s, state.learning) === "revision"
                : ["pending", "survey"].includes(
                    submissionStatus(s, state.learning),
                  )),
        )),
  );
  const columns = event.milestones.filter(
      (m) => milestone === "all" || m.id === milestone,
    ),
    current = Math.min(page, Math.max(1, Math.ceil(filtered.length / 20)));
  const frame = event.id === "wireframe" ? "291:25369" : "291:21691";
  return (
    <TeacherPage activePage="monitoring" frame={frame}>
      <FeatureHeading
        title="Monitoring Progres"
        description="Pantau pengumpulan dan nilai setiap siswa per milestone."
      >
        <EventSelect
          events={events}
          value={event.id}
          onChange={(id) =>
            window.history.pushState(null, "", monitoringHref(id))
          }
        />
      </FeatureHeading>
      <Surface className="mb-6 grid items-center gap-6 sm:grid-cols-3 xl:grid-cols-[1fr_1fr_1fr_2fr]">
        <div>
          <p className="text-xs text-secondary">Periode</p>
          <div className="mt-1">
            <StatusBadge
              status={event.status === "ongoing" ? "pending" : "missing"}
            >
              {event.status === "ongoing"
                ? "Berlangsung"
                : event.status === "ended"
                  ? "Berakhir"
                  : "Belum dimulai"}
            </StatusBadge>
          </div>
          <p className="mt-1 text-xs text-secondary">
            {event.period.split(",")[0]}
            {event.period.includes(" – ")
              ? ` – ${event.period.split(" – ")[1].split(",")[0]}`
              : ""}
          </p>
        </div>
        <div>
          <p className="text-xs text-secondary">Sistem Milestone</p>
          <p className="mt-1">{event.mode}</p>
        </div>
        <div>
          <p className="text-xs text-secondary">Peserta</p>
          <p className="mt-1">{data.rows.length} siswa</p>
        </div>
        <div className="sm:col-span-3 xl:col-span-1">
          <div className="mb-2 flex justify-between gap-2 text-xs">
            <span className="text-secondary">Progres keseluruhan</span>
            <span>
              {data.completed} dari {data.total} pengumpulan · {data.percent}%
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="Progres keseluruhan"
            aria-valuenow={data.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-1.5 overflow-hidden rounded-full bg-gray-100"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-teal-600"
              style={{ width: `${data.percent}%` }}
            />
          </div>
        </div>
      </Surface>
      <Surface padded={false} className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-4 border-b border-line p-4">
          <SearchField
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
          />
          <select
            className={`${controlClass} sm:!w-52 !border-transparent`}
            aria-label="Filter milestone"
            value={milestone}
            onChange={(e) => {
              setMilestone(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">Semua milestone</option>
            {event.milestones.map((m) => (
              <option key={m.id} value={m.id}>
                {milestoneLabel(event, m.id)} · {m.title}
              </option>
            ))}
          </select>
          <div
            className="flex max-w-full flex-wrap rounded-xl bg-gray-100 p-1"
            role="group"
            aria-label="Status pengumpulan"
          >
            {[
              ["all", "Semua"],
              ["missing", "Belum mengumpulkan"],
              ["pending", "Perlu diperiksa"],
              ["revision", "Revisi diminta"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={filter === key}
                onClick={() => {
                  setFilter(key);
                  setPage(1);
                }}
                className={`rounded-lg px-3 py-2 text-xs ${filter === key ? "bg-white text-foreground shadow-sm" : "text-secondary"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table
            className="w-full table-fixed text-left text-xs"
            style={{ minWidth: 220 + 80 + columns.length * 184 + 390 }}
          >
            <thead className="h-10 bg-gray-50 text-[11px] font-normal text-secondary">
              <tr>
                <th className="sticky left-0 z-10 w-[200px] bg-gray-50 px-4 font-normal">
                  Siswa
                </th>
                <th className="w-20 px-4 font-normal">Progres</th>
                {columns.map((m) => (
                  <th key={m.id} className="w-[184px] px-4 font-normal">
                    {milestoneLabel(event, m.id)} · {m.title || "Milestone"}
                  </th>
                ))}
                <th className="w-40 px-4 font-normal">Pengerjaan</th>
                <th className="w-36 px-4 font-normal">Penilaian</th>
                <th className="w-28 px-4 font-normal">Nilai akhir</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice((current - 1) * 20, current * 20).map((r) => (
                <tr
                  key={r.student.id}
                  className="h-[74px] border-t border-line"
                >
                  <td className="sticky left-0 z-10 bg-white px-4 py-3">
                    <div className="flex items-center gap-2">
                      <StudentAvatar name={r.student.name} small />
                      {r.student.name}
                    </div>
                  </td>
                  <td className="px-4">
                    {r.completed} dari {r.total}
                  </td>
                  {columns.map((m) => {
                    const s =
                        r.submissions[
                          event.milestones.findIndex((x) => x.id === m.id)
                        ],
                      status = submissionStatus(s, state.learning);
                    return (
                      <td key={m.id} className="px-4 py-3">
                        <Link
                          aria-label={`${r.student.name} ${milestoneLabel(event, m.id)} ${status}`}
                          href={monitoringHref(event.id, r.student.id, m.id)}
                          className="block rounded focus:outline-2 focus:outline-primary"
                        >
                          <StatusBadge status={status} />
                          {s && s.versions.length > 1 && (
                            <span className="ml-1 rounded bg-red-50 px-1 text-[10px] text-red-500">
                              Ulang
                            </span>
                          )}
                          <p className="mt-1 text-[10px] text-secondary">
                            {s
                              ? formatEventDate(
                                  s.versions.at(-1)!.submittedAt,
                                  true,
                                )
                              : "—"}
                          </p>
                        </Link>
                      </td>
                    );
                  })}
                  <td className="px-4">
                    <StatusBadge status={workStatus(r)}>
                      {workLabels[workStatus(r)]}
                    </StatusBadge>
                  </td>
                  <td className="px-4">
                    <StatusBadge status={assessmentStatus(r)}>
                      {assessmentLabels[assessmentStatus(r)]}
                    </StatusBadge>
                  </td>
                  <td className="px-4">{r.score ?? "Belum lengkap"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filtered.length && (
          <EmptyRows>
            {data.rows.length
              ? "Tidak ada siswa yang sesuai filter."
              : "Belum ada peserta terdaftar pada event ini."}
          </EmptyRows>
        )}
        <Pagination
          total={filtered.length}
          page={current}
          size={20}
          onChange={setPage}
        />
      </Surface>
      {state.storageError && (
        <p role="alert" className="mt-4 text-sm text-amber-800">
          {state.storageError}
        </p>
      )}
    </TeacherPage>
  );
}
