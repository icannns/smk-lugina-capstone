"use client";

import { useMemo, useState } from "react";
import {
  statusLabels,
  statusOrder,
  type DashboardAction,
  type EventStatus,
  type GuruEvent,
} from "@/lib/guru/dashboard-data";
import { DashboardButton, DashboardIcon } from "./dashboard-ui";
import { useRouter } from "next/navigation";
import { monitoringHref } from "@/lib/guru/learning-selectors";

export function EventCard({
  event,
}: {
  event: GuruEvent;
  onAction: (action: DashboardAction) => void;
}) {
  const router = useRouter();
  const progress = event.total
    ? Math.round((event.completed / event.total) * 100)
    : 0;
  const colors = {
    ongoing: "bg-[#e8f7ed] text-[#1a7d4a]",
    upcoming: "bg-[#edf2ff] text-primary",
    ended: "bg-[#f5f6f8] text-[#667082]",
  };
  return (
    <article
      aria-label={event.title}
      className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 sm:p-6 min-[1360px]:h-[272px] min-[1360px]:[&>*]:shrink-0"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="min-w-0 flex-1 text-base font-semibold leading-6">
          {event.title}
        </h3>
        <span
          className={`inline-flex h-[26px] w-[130px] shrink-0 items-center justify-center rounded-[13px] px-2 text-xs leading-[18px] ${colors[event.status]}`}
        >
          {statusLabels[event.status]}
        </span>
      </div>
      <p className="min-h-5 text-xs leading-[18px] text-secondary">
        {event.period}
      </p>
      <dl className="grid grid-cols-2 gap-4 min-[480px]:grid-cols-3">
        {[
          {
            title: "Tugas terkirim",
            value: `${event.submitted} / ${event.total}`,
          },
          {
            title: "Milestone selesai",
            value: `${event.completed} / ${event.total}`,
          },
          { title: "Menunggu penilaian", value: `${event.pending} tugas` },
        ].map((metric) => (
          <div key={metric.title}>
            <dt className="min-h-5 text-xs leading-[18px] text-secondary">
              {metric.title}
            </dt>
            <dd className="mt-1 text-sm font-medium leading-5">
              {metric.value}
            </dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between gap-2 text-xs leading-[18px]">
          <span className="min-h-5 text-secondary">Penyelesaian milestone</span>
          <span className="w-15">{progress}%</span>
        </div>
        <div
          role="progressbar"
          aria-label={`Penyelesaian ${event.title}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          className="h-1.5 overflow-hidden rounded-[3px] bg-[#e4e9f4]"
        >
          <div
            className="h-full rounded-[3px] bg-primary"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="min-h-5 text-xs leading-[18px] text-secondary">
          {event.finishedStudents} dari {event.students} siswa selesai
        </p>
        <DashboardButton
          variant="outline"
          onClick={() => router.push(monitoringHref(event.id))}
        >
          Lihat Progres
        </DashboardButton>
      </div>
    </article>
  );
}

export function EventList({
  events,
  onAction,
}: {
  events: GuruEvent[];
  onAction: (action: DashboardAction) => void;
}) {
  const [status, setStatus] = useState<EventStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("status");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(4);
  const filtered = useMemo(
    () =>
      events
        .filter(
          (e) =>
            (status === "all" || e.status === status) &&
            e.title
              .toLocaleLowerCase("id")
              .includes(search.trim().toLocaleLowerCase("id")),
        )
        .sort((a, b) =>
          sort === "name"
            ? a.title.localeCompare(b.title, "id")
            : sort === "progress"
              ? (b.total ? b.completed / b.total : 0) -
                (a.total ? a.completed / a.total : 0)
              : sort === "newest"
                ? b.start.localeCompare(a.start)
                : statusOrder[a.status] - statusOrder[b.status],
        ),
    [events, search, sort, status],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const filters: { key: EventStatus | "all"; label: string }[] = [
    { key: "all", label: "Semua" },
    { key: "ongoing", label: "Berlangsung" },
    { key: "upcoming", label: "Belum dimulai" },
    { key: "ended", label: "Berakhir" },
  ];
  return (
    <section aria-labelledby="events-title" className="min-w-0">
      <h2 id="events-title" className="text-lg font-semibold leading-[26px]">
        Event Anda
      </h2>
      <div
        role="group"
        aria-label="Filter status event"
        className="mt-2.5 flex flex-wrap gap-2"
      >
        {filters.map((f) => (
          <button
            type="button"
            key={f.key}
            aria-pressed={status === f.key}
            onClick={() => {
              setStatus(f.key);
              setPage(1);
            }}
            className={`h-9 rounded-control border px-4 text-sm font-medium transition-colors ${status === f.key ? "border-line bg-white text-primary" : "border-transparent text-secondary hover:bg-white/70"}`}
          >
            {f.label} (
            {f.key === "all"
              ? events.length
              : events.filter((e) => e.status === f.key).length}
            )
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-4">
        <div className="relative w-full min-w-0 sm:max-w-80 sm:flex-1">
          <label htmlFor="event-search" className="sr-only">
            Cari event
          </label>
          <input
            id="event-search"
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari event"
            className="h-10 w-full rounded-control border border-line bg-white pl-9 pr-3 text-sm placeholder:text-[#99a1af]"
          />
          <span className="pointer-events-none absolute left-3 top-3">
            <DashboardIcon name="search" />
          </span>
        </div>
        <div className="relative w-full sm:w-55">
          <label htmlFor="event-sort" className="sr-only">
            Urutkan event
          </label>
          <select
            id="event-sort"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="h-10 w-full appearance-none rounded-control border border-line bg-white px-4 pr-10 text-sm"
          >
            <option value="status">Urut: Status event</option>
            <option value="name">Urut: Nama A–Z</option>
            <option value="progress">Urut: Progres tertinggi</option>
            <option value="newest">Urut: Terbaru</option>
          </select>
          <span className="pointer-events-none absolute right-4 top-3">
            <DashboardIcon name="chevron" />
          </span>
        </div>
      </div>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {filtered.length} event ditemukan
      </div>
      <div className="mt-4 flex flex-col gap-4">
        {visible.map((event) => (
          <EventCard key={event.id} event={event} onAction={onAction} />
        ))}
        {visible.length === 0 && (
          <div className="rounded-2xl border border-line bg-white p-8 text-center">
            <h3 className="font-semibold">Event tidak ditemukan</h3>
            <p className="mt-2 text-sm text-secondary">
              Coba kata kunci atau status lain.
            </p>
            <DashboardButton
              className="mt-4"
              onClick={() => {
                setSearch("");
                setStatus("all");
                setPage(1);
              }}
            >
              Reset filter
            </DashboardButton>
          </div>
        )}
      </div>
      <div className="mt-4 flex min-h-11 flex-wrap items-center justify-between gap-3 text-xs text-[#667082]">
        <p>
          Menampilkan {filtered.length ? (currentPage - 1) * pageSize + 1 : 0}–
          {Math.min(currentPage * pageSize, filtered.length)} dari{" "}
          {filtered.length} event
        </p>
        <nav aria-label="Halaman event" className="flex min-w-0 flex-wrap items-center gap-1.5">
          <label className="mr-1">
            <span className="sr-only">Event per halaman</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="h-8 max-w-28 rounded-lg border border-line bg-white px-1"
            >
              <option value={4}>4 / halaman</option>
              <option value={2}>2 / halaman</option>
            </select>
          </label>
          <button
            type="button"
            aria-label="Halaman sebelumnya"
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
            className="grid size-8 place-items-center rounded-lg border border-line bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            ‹
          </button>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`Halaman ${n}`}
              aria-current={currentPage === n ? "page" : undefined}
              onClick={() => setPage(n)}
              className={`grid size-8 place-items-center rounded-lg border ${currentPage === n ? "border-primary bg-primary text-white" : "border-line bg-white"}`}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            aria-label="Halaman berikutnya"
            disabled={currentPage === pageCount}
            onClick={() => setPage(currentPage + 1)}
            className="grid size-8 place-items-center rounded-lg border border-line bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            ›
          </button>
        </nav>
      </div>
    </section>
  );
}
