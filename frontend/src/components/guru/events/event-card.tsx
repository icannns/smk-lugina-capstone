import Link from "next/link";
import { eventHref, formatEventDate } from "@/lib/guru/event-selectors";
import type { EventFilters, ManagedEvent } from "@/lib/guru/event-types";
import { DashboardButton } from "../dashboard-ui";
import { EventBadge, EventIcon, EventSurface } from "./event-ui";

export function ManagedEventCard({
  event,
  filters,
  deleting,
  onResume,
  onDelete,
}: {
  event: ManagedEvent;
  filters: EventFilters;
  deleting: boolean;
  onResume: () => void;
  onDelete: () => void;
}) {
  const draft = event.status === "draft";
  const title = event.title || "Draf tanpa judul";
  return (
    <article aria-label={title}>
      <EventSurface className="flex h-full min-h-[254px] flex-col gap-4 p-6">
        <EventBadge status={event.status} />
        <h2 className="text-base font-semibold leading-[22px]">
          {title}
        </h2>
        <dl className="grid grid-cols-2 gap-x-2 gap-y-2 text-xs leading-4 min-[380px]:grid-cols-3">
          {[
            ["Milestone", event.milestones.length],
            ["Mode", event.mode],
            ["Diperbarui", formatEventDate(event.updated)],
            ["Periode", event.period],
          ].map(([label, value], index) => (
            <div key={label} className={index === 3 ? "col-span-full" : "min-w-0"}>
              <dt className="text-secondary">{label}</dt>
              <dd className="mt-0.5 font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        {draft ? (
          <div className="mt-auto flex flex-wrap gap-2.5">
            <DashboardButton
              className={`${deleting ? "min-w-0 flex-1" : "w-[173px] max-w-full"} bg-primary-soft px-2 text-[#1447e6]`}
              onClick={onResume}
            >
              {deleting && <EventIcon name="resume" />}Lanjutkan Draf
            </DashboardButton>
            <DashboardButton
              variant="danger"
              className="w-28 rounded-lg px-2 text-[13px] font-semibold"
              onClick={onDelete}
            >
              Hapus Draf
            </DashboardButton>
          </div>
        ) : (
          <Link
            href={eventHref(filters, event.id)}
            className="mt-auto flex h-10 items-center justify-center rounded-control text-sm font-medium hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-primary"
          >
            Lihat Detail<span className="sr-only"> {event.title}</span>
          </Link>
        )}
      </EventSurface>
    </article>
  );
}
