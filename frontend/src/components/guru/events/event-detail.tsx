import Link from "next/link";
import { eventEnrollments } from "@/lib/guru/event-data";
import { eventHref, formatEventDate } from "@/lib/guru/event-selectors";
import type {
  EventFilters,
  EventMilestone,
  ManagedEvent,
} from "@/lib/guru/event-types";
import { EventBadge, EventIcon, EventSurface } from "./event-ui";

export function EventDetail({
  event,
  filters,
  deadlines,
  onDeadline,
  onMonitoring,
}: {
  event: ManagedEvent;
  filters: EventFilters;
  deadlines: Record<string, string>;
  onDeadline: (milestone: EventMilestone) => void;
  onMonitoring: () => void;
}) {
  const participants = eventEnrollments.filter(
    (e) => e.eventId === event.id,
  ).length;
  const total = participants * event.milestones.length;
  const progress = event.progress ?? 0;
  const percent = total ? Math.round((progress / total) * 100) : 0;
  const canonical = event.id === "kantin";
  return (
    <>
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 text-[13px] leading-[19.5px]"
      >
        <Link
          href={eventHref(filters)}
          className="shrink-0 text-secondary hover:underline"
        >
          Create Event
        </Link>
        <EventIcon name="breadcrumb" />
        <span className="truncate font-medium">{event.title}</span>
      </nav>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[30px] font-semibold leading-[37.5px] tracking-[-0.75px]">
            {event.title}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <EventBadge status={event.status} />
            <p className="text-sm leading-5 text-secondary">{event.period}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onMonitoring}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-control bg-white px-4 text-sm font-medium hover:bg-primary-soft"
        >
          <EventIcon name="monitoring" />
          Monitoring
        </button>
      </div>
      {canonical && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#fffbeb] p-4 text-sm leading-5 text-[#7b3306] shadow-[0_0_0_1px_#fee685]">
          <EventIcon name="notice-lock" />
          <p>
            Sudah ada {progress} pengumpulan. Urutan &amp; jumlah milestone
            serta rubrik terkunci. Arahan dan deadline masih bisa diubah.
          </p>
        </div>
      )}
      <div className="mt-6 grid items-start gap-6 min-[1360px]:grid-cols-[minmax(0,2.067fr)_minmax(0,1fr)]">
        <EventSurface
          className={`p-6 ${canonical ? "min-[1360px]:min-h-[556px]" : ""}`}
        >
          <h2 className="text-base font-semibold leading-6">Milestone</h2>
          {!canonical && (
            <p className="mt-2 text-xs leading-5 text-secondary">
              Sejumlah detail milestone belum tersedia pada acuan fase ini.
              Hanya informasi contoh yang tersedia ditampilkan.
            </p>
          )}
          <ol className="mt-4 flex flex-col gap-3">
            {event.milestones.map((m, i) => {
              const deadline = deadlines[`${event.id}-${m.id}`] ?? m.deadline;
              return (
                <li
                  key={m.id}
                  className={`rounded-2xl p-4 shadow-[0_0_0_1px_#e5e7eb] ${canonical ? (i === 0 ? "min-h-[109px]" : "min-h-[105px]") : ""}`}
                >
                  <div className="relative flex flex-wrap items-center justify-between gap-x-2 gap-y-1 sm:min-h-6 sm:pr-[142px]">
                    <h3 className="text-base font-medium leading-6">
                      {i + 1}. {m.title || m.id}
                    </h3>
                    {deadline && (
                      <button
                        type="button"
                        onClick={() => onDeadline({ ...m, deadline })}
                        aria-label={`Ubah deadline ${m.title || m.id}`}
                        className="inline-flex h-8 shrink-0 items-center justify-center gap-2 rounded-control px-3 text-[13px] font-medium leading-[19.5px] text-secondary hover:bg-gray-50 sm:absolute sm:right-0 sm:-top-1"
                      >
                        <EventIcon name="edit" />
                        Ubah deadline
                      </button>
                    )}
                  </div>
                  {m.instructions && (
                    <p className="mt-1 text-sm leading-5 text-secondary">
                      {m.instructions}
                    </p>
                  )}
                  {deadline && (
                    <p className="mt-2 text-xs leading-4 text-secondary">
                      Deadline {formatEventDate(deadline, true)} · Format:{" "}
                      {m.formats} · Form Survei:{" "}
                      {m.surveyActive ? "Aktif" : "Tidak aktif"}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        </EventSurface>
        <div className="flex min-w-0 flex-col gap-6">
          <EventSurface className="p-6">
            <h2 className="text-sm font-semibold leading-5">Ringkasan</h2>
            <dl className="mt-3 flex flex-col gap-3 text-sm leading-5">
              <div className="flex flex-wrap justify-between gap-x-3">
                <dt className="text-secondary">Mode</dt>
                <dd className="inline-flex items-center gap-1 font-medium">
                  {canonical && <EventIcon name="summary-lock" />}
                  {event.mode}
                </dd>
              </div>
              <div className="flex flex-wrap justify-between gap-x-3">
                <dt className="text-secondary">Peserta</dt>
                <dd className="font-medium">
                  {participants} siswa (Enroll Mandiri)
                </dd>
              </div>
              <div className="flex flex-wrap justify-between gap-x-3">
                <dt className="text-secondary">Rubrik</dt>
                <dd className="inline-flex items-center gap-1 font-medium">
                  {canonical && <EventIcon name="summary-lock" />}
                  {event.rubric ?? "Belum tersedia pada acuan"}
                </dd>
              </div>
              <div className="flex flex-wrap justify-between gap-x-3">
                <dt className="text-secondary">Sertifikat</dt>
                <dd className="font-medium">
                  {event.certificate ?? "Belum tersedia pada acuan"}
                </dd>
              </div>
            </dl>
          </EventSurface>
          <EventSurface className="p-6">
            <div className="flex flex-wrap justify-between gap-x-2 text-xs leading-4">
              <span className="text-secondary">Progres</span>
              <p className="font-medium">
                {progress} dari {total} pengumpulan
                <span className="font-normal text-secondary">
                  {" "}
                  · {percent}%
                </span>
              </p>
            </div>
            <div
              role="progressbar"
              aria-label={`Progres ${event.title}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100"
            >
              <div
                className="h-full rounded-full bg-linear-to-r from-[#3b82f6] to-[#0d9488]"
                style={{ width: `${percent}%` }}
              />
            </div>
          </EventSurface>
        </div>
      </div>
    </>
  );
}
