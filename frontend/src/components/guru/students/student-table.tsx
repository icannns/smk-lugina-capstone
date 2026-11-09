"use client";
import { milestoneLabel } from "@/lib/guru/learning-selectors";

import Link from "next/link";
import { studentPageSize } from "@/lib/guru/student-data";
import { studentHref } from "@/lib/guru/student-selectors";
import type {
  StudentFilters,
  StudentRecord,
  StudentEvent,
} from "@/lib/guru/student-types";
import { DashboardButton } from "../dashboard-ui";
import { StudentCard, StudentIcon, StudentSelect } from "./student-ui";

type Props = {
  filters: StudentFilters;
  records: StudentRecord[];
  reviews: Record<string, boolean>;
  onChange: (patch: Partial<StudentFilters>) => void;
  events: StudentEvent[];
};

export function StudentTable({
  filters,
  records,
  reviews,
  onChange,
  events: studentEvents,
}: Props) {
  const selectedEvent = studentEvents.find((e) => e.id === filters.event);
  const hasFilter = !!(
    filters.milestone ||
    filters.search ||
    filters.review !== "all"
  );
  const pageCount = Math.max(1, Math.ceil(records.length / studentPageSize));
  const page = Math.min(filters.page, pageCount);
  const visible = records.slice(
    (page - 1) * studentPageSize,
    page * studentPageSize,
  );
  const columnWidths = filters.milestone
    ? [272, 162.325, 89.275, 292.1875, 169.1, 127.0125]
    : [244, 167.675, 92.225, 301.825, 174.6875, 131.225];
  return (
    <>
      <header>
        <h1 className="text-[30px] font-semibold leading-[37.5px] tracking-[-0.75px]">
          Pengelolaan Data Siswa
        </h1>
        <p className="mt-1 text-sm leading-5 text-secondary">
          Pantau data siswa, progres event, dan status pengisian Form Survei di
          setiap milestone.
        </p>
      </header>
      <StudentCard className="mt-6 overflow-hidden">
        <div className="flex flex-wrap items-start gap-2 border-b border-line p-4 min-[1360px]:min-h-[72.8px]">
          <StudentSelect
            label="Event peserta"
            value={filters.event}
            onChange={(e) =>
              onChange({
                event: e.target.value,
                milestone: "",
                search: "",
                review: "all",
                page: 1,
              })
            }
            className="w-full sm:w-[267.2px]"
          >
            <option value="">Pilih event…</option>
            {studentEvents.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </StudentSelect>
          {selectedEvent && (
            <>
              <StudentSelect
                label="Milestone"
                value={filters.milestone}
                onChange={(e) =>
                  onChange({ milestone: e.target.value, page: 1 })
                }
                className="w-full sm:w-[196px]"
              >
                <option value="">Semua milestone</option>
                {selectedEvent.milestones.map((m) => (
                  <option key={m.id} value={m.id}>
                    {milestoneLabel(selectedEvent, m.id)}
                    {m.title && ` ${m.title}`}
                  </option>
                ))}
              </StudentSelect>
              <label className="relative w-full sm:min-w-36 sm:max-w-80 sm:flex-1">
                <span className="sr-only">Cari siswa</span>
                <input
                  type="search"
                  value={filters.search}
                  onChange={(e) =>
                    onChange({ search: e.target.value, page: 1 })
                  }
                  placeholder="Cari siswa"
                  className="h-10 w-full rounded-control border border-line bg-white pl-9 pr-3 text-sm leading-5 placeholder:text-[#99a1af]"
                />
                <span className="pointer-events-none absolute left-3 top-3">
                  <StudentIcon name="list-search" />
                </span>
              </label>
              <StudentSelect
                label="Status peninjauan"
                value={filters.review}
                onChange={(e) =>
                  onChange({
                    review: e.target.value as StudentFilters["review"],
                    page: 1,
                  })
                }
                className="w-full sm:w-[142.4px]"
              >
                <option value="all">Semua</option>
                <option value="unreviewed">Belum ditinjau</option>
                <option value="reviewed">Sudah ditinjau</option>
              </StudentSelect>
              {hasFilter && (
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      milestone: "",
                      search: "",
                      review: "all",
                      page: 1,
                    })
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-control px-4 text-sm font-medium text-secondary hover:bg-gray-50"
                >
                  <StudentIcon name="filtered-reset" />
                  Reset Filter
                </button>
              )}
            </>
          )}
        </div>
        {!filters.event ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-primary-soft">
              <StudentIcon name="initial-filter" />
            </span>
            <h2 className="text-base font-semibold leading-6">
              Pilih event untuk melihat data siswa
            </h2>
            <p className="mt-1 text-sm leading-5 text-secondary">
              Gunakan pemilih event di atas untuk menampilkan peserta yang
              terdaftar.
            </p>
          </div>
        ) : !selectedEvent ? (
          <div className="p-12 text-center">
            <h2 className="font-semibold">Event contoh tidak ditemukan</h2>
            <DashboardButton
              className="mt-4"
              onClick={() =>
                onChange({
                  event: "",
                  milestone: "",
                  search: "",
                  review: "all",
                  page: 1,
                })
              }
            >
              Pilih event lain
            </DashboardButton>
          </div>
        ) : (
          <>
            <div role="status" className="sr-only">
              {records.length} catatan ditemukan
            </div>
            <div
              role="region"
              aria-label="Tabel data siswa, geser horizontal jika diperlukan"
              tabIndex={0}
              className="relative min-w-0 overflow-x-auto"
            >
              <table className="w-full min-w-[1112px] table-fixed border-collapse text-left">
                <caption className="sr-only">
                  Catatan peserta {selectedEvent.title}
                </caption>
                <colgroup>
                  {columnWidths.map((width, i) => (
                    <col
                      key={i}
                      style={{ width: `${(width / 1112) * 100}%` }}
                    />
                  ))}
                </colgroup>
                <thead className="bg-gray-50/60">
                  <tr className="h-10">
                    {[
                      "Nama siswa",
                      "Event",
                      "Milestone",
                      "Status Form Survei",
                      "Dikirim",
                      "",
                    ].map((title, i) => (
                      <th
                        key={i}
                        scope="col"
                        className="px-4 py-3 text-xs font-medium leading-4 text-secondary"
                      >
                        {title || <span className="sr-only">Aksi</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((record) => {
                    const reviewed =
                      reviews[record.enrollment.id] ??
                      record.enrollment.reviewed;
                    const href = studentHref(
                      { ...filters, page },
                      record.student.id,
                    );
                    return (
                      <tr
                        key={record.id}
                        className="h-[56.7px] border-b border-line last:border-b-0 hover:bg-gray-50/50"
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={href}
                            aria-label={`Detail ${record.student.name}, ${milestoneLabel(record.event, record.milestone.id)}`}
                            className="flex items-center gap-2 text-sm leading-5 hover:text-primary"
                          >
                            {!reviewed && (
                              <span
                                title="Belum ditinjau"
                                className="size-2 shrink-0 rounded-full bg-primary"
                              />
                            )}
                            <span className="truncate">
                              {record.student.name}
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            title={record.event.title}
                            className="block truncate text-sm leading-5"
                          >
                            {record.event.title}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm leading-5">
                          {milestoneLabel(record.event, record.milestone.id)}
                        </td>
                        <td className="overflow-hidden px-4 py-3">
                          <span
                            title={record.milestone.summary}
                            className={`block truncate ${record.milestone.summary?.includes("Evaluasi Lancar") ? "w-fit max-w-full rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium leading-4 text-[#008236]" : "text-sm leading-5"}`}
                          >
                            {record.milestone.summary}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="block whitespace-nowrap text-xs leading-4 text-secondary">
                            {record.milestone.submittedAt}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={href}
                            aria-label={`Lihat Detail ${record.student.name}, ${milestoneLabel(record.event, record.milestone.id)}`}
                            className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-control bg-primary-soft px-3 text-[13px] font-medium leading-[18.571px] text-[#1447e6] hover:bg-blue-100"
                          >
                            Lihat Detail
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {visible.length === 0 && (
                <div className="px-6 py-12 text-center">
                  <h2 className="font-semibold">
                    Tidak ada data siswa yang sesuai
                  </h2>
                  <p className="mt-2 text-sm text-secondary">
                    Ubah pencarian atau filter untuk melihat catatan lain.
                  </p>
                  <DashboardButton
                    className="mt-4"
                    onClick={() =>
                      onChange({
                        milestone: "",
                        search: "",
                        review: "all",
                        page: 1,
                      })
                    }
                  >
                    Reset Filter
                  </DashboardButton>
                </div>
              )}
            </div>
            <div className="flex min-h-[56.8px] flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-[13px] leading-[19.5px] text-secondary">
              <p>
                Menampilkan {visible.length} dari {records.length} data
              </p>
              <nav
                aria-label="Halaman data siswa"
                className="flex items-center gap-1"
              >
                <button
                  type="button"
                  aria-label="Halaman siswa sebelumnya"
                  disabled={page === 1}
                  onClick={() => onChange({ page: page - 1 })}
                  className="grid size-8 place-items-center rounded-lg hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <StudentIcon name="list-previous" />
                </button>
                <span aria-live="polite" className="px-2">
                  {page} / {pageCount}
                </span>
                <button
                  type="button"
                  aria-label="Halaman siswa berikutnya"
                  disabled={page === pageCount}
                  onClick={() => onChange({ page: page + 1 })}
                  className="grid size-8 place-items-center rounded-lg hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <StudentIcon name="list-next" />
                </button>
              </nav>
            </div>
          </>
        )}
      </StudentCard>
    </>
  );
}
