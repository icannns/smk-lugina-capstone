"use client";

import { useId, useState } from "react";
import { Surface, controlClass } from "../guru/design-ui";
import { DashboardButton } from "../guru/dashboard-ui";
import { AssessmentBadge, AssessmentDetail, AssessmentResultCard, assessmentDate } from "./assessment-ui";
import {
  assessmentLabels, assessmentStatusLabels, assessmentSummary,
  assessmentResultText, filterAssessments, initialAssessmentFilters,
} from "@/lib/assessments/selectors";
import type { AssessmentFilters, AssessmentRecord, AssessmentType } from "@/lib/assessments/types";

const descriptions: Record<AssessmentType, string> = {
  competency: "Catatan hasil dan status pengerjaan uji kompetensi.",
  technostress: "Partisipasi dan ringkasan respons, tanpa interpretasi klinis atau kategori risiko.",
  uiux: "Hasil asesmen UI/UX ini terpisah dari nilai rubrik tugas milestone.",
};

export function AssessmentSection({
  type, records, teacher, names, eventNames,
}: {
  type: AssessmentType;
  records: readonly AssessmentRecord[];
  teacher: boolean;
  names: ReadonlyMap<string, string>;
  eventNames: ReadonlyMap<string, string>;
}) {
  const id = useId(), label = assessmentLabels[type];
  const [filters, setFilters] = useState<AssessmentFilters>(initialAssessmentFilters);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const filtered = filterAssessments(records, filters, names), size = 5;
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const current = Math.min(page, pages);
  const visible = teacher ? filtered.slice((current - 1) * size, current * size) : filtered;
  const summary = assessmentSummary(records);
  const selected = records.find((record) => record.id === selectedId);
  const events = [...new Set(records.map((record) => record.eventId ?? "none"))];
  const eventName = (record: AssessmentRecord) => record.eventId
    ? eventNames.get(record.eventId) ?? "Event belum tersedia"
    : "Tanpa event";
  function update(next: AssessmentFilters) { setFilters(next); setPage(1); }
  return (
    <section aria-labelledby={`${id}-title`} data-assessment-type={type} className="min-w-0">
      <Surface className="h-full !p-4 sm:!p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 basis-52">
            <h3 id={`${id}-title`} className="text-lg font-semibold leading-[26px]">{teacher ? label : `Hasil ${label}`}</h3>
            <p className="mt-1 text-xs leading-[18px] text-secondary">{descriptions[type]}</p>
          </div>
          <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-medium text-primary">Data contoh</span>
        </div>
        {teacher && <>
          <dl className="my-5 grid grid-cols-3 gap-2 sm:gap-4">
            {[["Catatan asesmen", summary.total], ["Hasil tersedia", summary.available], ["Belum tersedia", summary.unavailable]].map(([title, value]) => (
              <div key={title} className="min-w-0 rounded-xl border border-line bg-gray-50 p-3">
                <dt className="break-words text-xs leading-[18px] text-secondary">{title}</dt>
                <dd className="mt-1 text-2xl font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mb-4 grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
            <label className="min-w-0 text-xs text-secondary" htmlFor={`${id}-search`}>Cari siswa atau asesmen
              <input id={`${id}-search`} aria-label={`Cari siswa atau asesmen — ${label}`} type="search" value={filters.search} onChange={(e) => update({ ...filters, search: e.target.value })} placeholder="Nama siswa atau asesmen" className={`${controlClass} mt-1.5`} />
            </label>
            <label className="min-w-0 text-xs text-secondary" htmlFor={`${id}-event`}>Event
              <select id={`${id}-event`} aria-label={`Filter event — ${label}`} value={filters.eventId} onChange={(e) => update({ ...filters, eventId: e.target.value })} className={`${controlClass} mt-1.5`}>
                <option value="all">Semua event</option>
                {events.map((eventId) => <option key={eventId} value={eventId}>{eventId === "none" ? "Tanpa event" : eventNames.get(eventId) ?? "Event belum tersedia"}</option>)}
              </select>
            </label>
            <label className="min-w-0 text-xs text-secondary" htmlFor={`${id}-status`}>Status
              <select id={`${id}-status`} aria-label={`Filter status — ${label}`} value={filters.status} onChange={(e) => update({ ...filters, status: e.target.value as AssessmentFilters["status"] })} className={`${controlClass} mt-1.5`}>
                <option value="all">Semua status</option>
                {Object.entries(assessmentStatusLabels).map(([value, text]) => <option key={value} value={value}>{text}</option>)}
              </select>
            </label>
            <DashboardButton variant="outline" onClick={() => update(initialAssessmentFilters)} className="self-end" aria-label={`Hapus filter — ${label}`}>Hapus filter</DashboardButton>
          </div>
        </>}
        {!visible.length ? <p role="status" className="my-5 rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm leading-6 text-secondary">
          {records.length ? "Tidak ada hasil yang sesuai filter. Ubah pencarian atau hapus filter." : `Belum ada ${label.toLocaleLowerCase("id-ID")} untuk ditampilkan.`}
        </p> : <>
          {teacher && <div className="hidden max-w-full overflow-x-auto rounded-xl border border-line md:block" tabIndex={0} role="region" aria-label={`Tabel hasil ${label}`}>
            <table className="w-full min-w-[720px] text-left text-sm">
              <caption className="sr-only">Catatan {label} contoh per siswa dan event</caption>
              <thead className="border-b border-line bg-gray-50 text-xs text-secondary"><tr>
                {["Siswa / Asesmen", "Event", "Hasil", "Status", "Selesai (WIB)", "Detail"].map((heading) => <th scope="col" key={heading} className="px-3 py-3 font-medium">{heading}</th>)}
              </tr></thead>
              <tbody>{visible.map((record) => <tr key={record.id} className="border-b border-line align-top last:border-0">
                <th scope="row" className="max-w-52 break-words px-3 py-4 font-medium"><span>{names.get(record.studentId) ?? "Siswa contoh"}</span><span className="mt-1 block text-xs font-normal leading-[18px] text-secondary">{record.title}</span></th>
                <td className="max-w-52 break-words px-3 py-4 text-xs leading-[18px] text-secondary">{eventName(record)}</td>
                <td className="max-w-64 break-words px-3 py-4 text-xs leading-[18px]">{assessmentResultText(record)}</td>
                <td className="px-3 py-4"><AssessmentBadge status={record.status} /></td>
                <td className="px-3 py-4 text-xs leading-[18px] text-secondary">{assessmentDate(record.completedAt)}</td>
                <td className="px-3 py-4"><DashboardButton variant="outline" aria-label={`Lihat detail ${record.title} — ${names.get(record.studentId) ?? "Siswa contoh"}`} onClick={() => setSelectedId(record.id)}>Lihat</DashboardButton></td>
              </tr>)}</tbody>
            </table>
          </div>}
          <div className={`mt-4 space-y-3 ${teacher ? "md:hidden" : ""}`}>
            {visible.map((record) => <AssessmentResultCard key={record.id} record={record} name={teacher ? names.get(record.studentId) ?? "Siswa contoh" : undefined} eventName={eventName(record)} onDetail={() => setSelectedId(record.id)} />)}
          </div>
        </>}
        {teacher && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-secondary" role="status" aria-live="polite">
          <p>{filtered.length ? (current - 1) * size + 1 : 0}–{Math.min(current * size, filtered.length)} dari {filtered.length} catatan</p>
          {pages > 1 && <div className="grid w-full grid-cols-2 items-center gap-2 sm:flex sm:w-auto">
            <span className="col-span-2 whitespace-nowrap text-center sm:order-2" aria-label={`Halaman ${current} dari ${pages}`}>{current} / {pages}</span>
            <DashboardButton variant="outline" className="sm:order-1" disabled={current <= 1} aria-label={`Halaman sebelumnya — ${label}`} onClick={() => setPage(current - 1)}>Sebelumnya</DashboardButton>
            <DashboardButton variant="outline" className="sm:order-3" disabled={current >= pages} aria-label={`Halaman berikutnya — ${label}`} onClick={() => setPage(current + 1)}>Berikutnya</DashboardButton>
          </div>}
        </div>}
        {selected && <AssessmentDetail record={selected} studentName={names.get(selected.studentId) ?? "Siswa contoh"} eventName={eventName(selected)} onClose={() => setSelectedId(null)} />}
      </Surface>
    </section>
  );
}
