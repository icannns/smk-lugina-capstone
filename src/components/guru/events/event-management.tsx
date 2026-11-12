"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  beginEventDraft,
  deleteEventDraft,
  listedEvents,
  useEventDraftStore,
  wizardHref,
  updateEventDeadline,
} from "@/lib/guru/event-draft-store";
import { eventAssets } from "@/lib/guru/event-assets";
import { eventHref, readEventFilters } from "@/lib/guru/event-selectors";
import type {
  EventFilters,
  EventMilestone,
  ManagedEvent,
} from "@/lib/guru/event-types";
import { DashboardShell } from "../dashboard-shell";
import {
  DashboardDialog,
  type DashboardDialogState,
} from "../dashboard-dialog";
import { EventListing } from "./event-listing";
import { EventDetail } from "./event-detail";
import { EventDialog } from "./event-dialogs";
import { monitoringHref, eventLearning } from "@/lib/guru/learning-selectors";

export function EventManagement() {
  const router = useRouter();
  const draftState = useEventDraftStore();
  const params = useSearchParams();
  const filters = readEventFilters(params);
  const eventId = params.get("event");
  const event = listedEvents(draftState).find(
    (e) => e.id === eventId && e.status !== "draft",
  );
  const deleted = draftState.deleted;
  const [deleteEvent, setDeleteEvent] = useState<ManagedEvent | null>(null);
  const [deadline, setDeadline] = useState<{
    eventId: string;
    milestone: EventMilestone;
  } | null>(null);
  const [action, setAction] = useState<DashboardDialogState | null>(null);
  const [notice, setNotice] = useState("");
  function change(patch: Partial<EventFilters>) {
    window.history.replaceState(null, "", eventHref({ ...filters, ...patch }));
  }
  async function wizard(resume?: ManagedEvent) {
    const id = resume?.id ?? await beginEventDraft();
    if (id) router.push(wizardHref(id, resume?.wizard?.step));
  }
  return (
    <>
      <DashboardShell
        empty
        activePage="events"
        iconOverrides={eventAssets}
        onAction={setAction}
        showSettings={!!deleteEvent}
      >
        <main
          id="events-main"
          tabIndex={-1}
          data-figma-node={
            eventId
              ? "291:18474"
              : filters.tab === "draft"
                ? "291:18128"
                : "291:17842"
          }
          className="mx-auto min-w-0 max-w-[1176px] px-5 py-8 outline-none sm:px-8"
        >
          {draftState.storageError && (
            <p
              role="alert"
              className="mb-4 rounded-control border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
            >
              {draftState.storageError}
            </p>
          )}
          {eventId ? (
            event ? (
              <EventDetail
                event={event}
                learning={eventLearning(
                  event,
                  draftState.learning,
                  draftState.rubrics[event.rubricId ?? ""],
                )}
                filters={filters}
                deadlines={{}}
                onDeadline={(milestone) =>
                  setDeadline({ eventId: event.id, milestone })
                }
                onMonitoring={() => router.push(monitoringHref(event.id))}
              />
            ) : (
              <div className="rounded-2xl border border-line bg-white p-8">
                <h1 className="text-2xl font-semibold">
                  Event tidak ditemukan
                </h1>
                <Link
                  href={eventHref(filters)}
                  className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
                >
                  Kembali ke daftar event
                </Link>
              </div>
            )
          ) : (
            <EventListing
              events={listedEvents(draftState)}
              filters={filters}
              deleted={deleted}
              deleting={deleteEvent?.id ?? null}
              onChange={change}
              onCreate={() => wizard()}
              onResume={wizard}
              onDelete={setDeleteEvent}
            />
          )}
        </main>
      </DashboardShell>
      {deleteEvent && (
        <EventDialog
          kind="delete"
          event={deleteEvent}
          onClose={() => setDeleteEvent(null)}
          onDelete={async () => {
            if (!await deleteEventDraft(deleteEvent.id)) return;
            setDeleteEvent(null);
            setNotice(
              "Draf dihapus dari database.",
            );
            window.history.pushState(
              null,
              "",
              eventHref({ ...filters, tab: "published", page: 1 }),
            );
          }}
        />
      )}
      {deadline && event?.id === deadline.eventId && (
        <EventDialog
          key={`${deadline.eventId}-${deadline.milestone.id}`}
          kind="deadline"
          milestone={deadline.milestone}
          onClose={() => setDeadline(null)}
          onSave={async (value) => {
            if (!await updateEventDeadline(deadline.eventId, deadline.milestone.id, value)) return;
            setDeadline(null);
            setNotice(
              "Deadline diperbarui di server (WIB) dan terhubung ke Monitoring.",
            );
          }}
        />
      )}
      <DashboardDialog
        action={action}
        onClose={() => setAction(null)}
        onDelete={() => setAction(null)}
      />
      {notice && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-30 flex max-w-[calc(100%-40px)] items-start gap-4 rounded-2xl border border-line bg-white p-4 shadow-lg"
        >
          <p className="max-w-sm text-sm leading-5">{notice}</p>
          <button
            type="button"
            aria-label="Tutup pemberitahuan"
            onClick={() => setNotice("")}
            className="text-sm font-medium text-primary"
          >
            Tutup
          </button>
        </div>
      )}
    </>
  );
}
