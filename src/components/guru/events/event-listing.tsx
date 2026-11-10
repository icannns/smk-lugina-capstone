import Link from "next/link";
import { eventHref, selectEvents } from "@/lib/guru/event-selectors";
import { statusLabels } from "@/lib/guru/dashboard-data";
import type { EventFilters, ManagedEvent } from "@/lib/guru/event-types";
import { DashboardPrimaryButton } from "../dashboard-ui";
import { ManagedEventCard } from "./event-card";
import { EventIcon, EventSelect, EventSurface } from "./event-ui";

export function EventListing({
  events,
  filters,
  deleted,
  deleting,
  onChange,
  onCreate,
  onResume,
  onDelete,
}: {
  events: ManagedEvent[];
  filters: EventFilters;
  deleted: string[];
  deleting: string | null;
  onChange: (patch: Partial<EventFilters>) => void;
  onCreate: () => void;
  onResume: (event: ManagedEvent) => void;
  onDelete: (event: ManagedEvent) => void;
}) {
  const result = selectEvents(events, filters, deleted);
  const published = events.filter((e) => e.status !== "draft").length;
  const drafts = events.filter(
    (e) => e.status === "draft" && !deleted.includes(e.id),
  ).length;
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="text-[30px] font-semibold leading-[37.5px] tracking-[-0.75px]">
            Create Event
          </h1>
          <p className="mt-1 text-sm leading-5 text-secondary">
            Buat, lanjutkan draf, dan kelola event pembelajaran yang sudah
            terbit.
          </p>
        </div>
        <div className="shrink-0">
          <DashboardPrimaryButton onClick={onCreate}>
            <EventIcon name="plus" />
            Create Event
          </DashboardPrimaryButton>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <nav
          aria-label="Status penerbitan event"
          className="flex h-10 gap-1 rounded-control bg-gray-100 p-1"
        >
          {(
            [
              ["published", `Terbit (${published})`],
              ["draft", `Draf (${drafts})`],
            ] as const
          ).map(([tab, label]) => (
            <Link
              key={tab}
              href={eventHref({ ...filters, tab, status: "all", page: 1 })}
              aria-current={filters.tab === tab ? "page" : undefined}
              className={`flex items-center rounded-lg px-3 text-[13px] font-medium leading-[19.5px] ${filters.tab === tab ? "bg-white shadow-sm" : "text-secondary hover:bg-white/60"}`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <label className="relative min-w-40 flex-1 basis-64 sm:max-w-80">
          <span className="sr-only">Cari judul event</span>
          <span className="pointer-events-none absolute left-3 top-3">
            <EventIcon name="search" />
          </span>
          <input
            type="search"
            aria-label="Cari judul event"
            placeholder="Cari judul event"
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value, page: 1 })}
            className="h-10 w-full rounded-control border border-line bg-white pl-9 pr-3 text-sm placeholder:text-[#99a1af] focus:outline-2 focus:outline-primary"
          />
        </label>
        <EventSelect
          label="Filter status event"
          value={filters.status}
          onChange={(e) =>
            onChange({
              status: e.target.value as EventFilters["status"],
              page: 1,
            })
          }
          className="w-[141px]"
        >
          <option value="all">Semua</option>
          {Object.entries(statusLabels).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </EventSelect>
        <EventSelect
          label="Urutkan event"
          value={filters.sort}
          onChange={(e) =>
            onChange({ sort: e.target.value as EventFilters["sort"], page: 1 })
          }
          className="sm:ml-auto sm:w-44"
        >
          <option value="reference">Urutan awal</option>
          <option value="updated">Terbaru diperbarui</option>
          <option value="title">Judul A–Z</option>
        </EventSelect>
      </div>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {result.total} {filters.tab === "draft" ? "draf" : "event"} ditemukan.
        Halaman {result.page} dari {result.pages}.
      </div>
      {result.records.length ? (
        <div className="mt-4 grid items-stretch gap-4 min-[700px]:grid-cols-2 min-[1360px]:grid-cols-3">
          {result.records.map((event) => (
            <ManagedEventCard
              key={event.id}
              event={event}
              filters={filters}
              deleting={deleting === event.id}
              onResume={() => onResume(event)}
              onDelete={() => onDelete(event)}
            />
          ))}
        </div>
      ) : (
        <EventSurface className="mt-4 p-8 text-center">
          <h2 className="text-base font-semibold">
            {filters.tab === "draft" && !drafts
              ? "Belum ada draf event"
              : "Tidak ada event yang sesuai"}
          </h2>
          <p className="mt-2 text-sm text-secondary">
            {filters.tab === "draft" && !drafts
              ? "Draf yang disimpan dalam sesi tab ini akan muncul di sini."
              : "Coba kata kunci atau status lain."}
          </p>
          {(filters.search || filters.status !== "all") && (
            <button
              type="button"
              onClick={() => onChange({ search: "", status: "all", page: 1 })}
              className="mt-4 text-sm font-medium text-primary hover:underline"
            >
              Reset pencarian dan filter
            </button>
          )}
        </EventSurface>
      )}
      {(filters.tab === "published" || result.total > 1) && (
        <div className="mt-6 flex min-h-11 flex-wrap items-center justify-between gap-4 text-[13px] text-[#6b7380]">
          <p>
            Menampilkan{" "}
            {result.total ? (result.page - 1) * filters.pageSize + 1 : 0}–
            {Math.min(result.page * filters.pageSize, result.total)} dari{" "}
            {result.total} event
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2">
              Per halaman
              <select
                aria-label="Event per halaman"
                value={filters.pageSize}
                onChange={(e) =>
                  onChange({
                    pageSize: Number(
                      e.target.value,
                    ) as EventFilters["pageSize"],
                    page: 1,
                  })
                }
                className="rounded-md border border-line bg-white px-2 py-1.5 text-foreground"
              >
                <option value={2}>2</option>
                <option value={4}>4</option>
                <option value={6}>6</option>
              </select>
            </label>
            <nav aria-label="Pagination event" className="flex gap-1.5">
              <button
                type="button"
                aria-label="Halaman event sebelumnya"
                disabled={result.page === 1}
                onClick={() => onChange({ page: result.page - 1 })}
                className="size-8 rounded-md border border-line bg-white text-[#384052] disabled:cursor-not-allowed disabled:opacity-40"
              >
                ‹
              </button>
              {Array.from({ length: result.pages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    type="button"
                    key={page}
                    aria-label={`Halaman event ${page}`}
                    aria-current={result.page === page ? "page" : undefined}
                    onClick={() => onChange({ page })}
                    className={`size-8 rounded-md border font-medium ${result.page === page ? "border-primary bg-primary font-semibold text-white" : "border-line bg-white text-[#384052]"}`}
                  >
                    {page}
                  </button>
                ),
              )}
              <button
                type="button"
                aria-label="Halaman event berikutnya"
                disabled={result.page === result.pages}
                onClick={() => onChange({ page: result.page + 1 })}
                className="size-8 rounded-md border border-line bg-white text-[#384052] disabled:cursor-not-allowed disabled:opacity-40"
              >
                ›
              </button>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
