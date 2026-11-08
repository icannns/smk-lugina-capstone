"use client";

import { useSyncExternalStore } from "react";
import { managedEvents } from "./event-data";
import { formatEventDate } from "./event-selectors";
import { localDate, newWizardEvent } from "./event-wizard-data";
import { isWibDateTime } from "./event-wizard-validation";
import type {
  EventAttachment,
  EventMilestone,
  ManagedEvent,
} from "./event-types";

export const DRAFT_STORAGE_KEY = "lugina.teacher.event-drafts.v1";
type DraftState = {
  working: Record<string, ManagedEvent>;
  saved: Record<string, ManagedEvent>;
  deleted: string[];
  storageError: string;
};
const initial: DraftState = {
  working: {},
  saved: {},
  deleted: [],
  storageError: "",
};
let snapshot = initial;
let initialized = false;
const listeners = new Set<() => void>();
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const string = (value: unknown) => (typeof value === "string" ? value : "");
function attachments(value: unknown): EventAttachment[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((v) =>
    isRecord(v) &&
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    typeof v.size === "number" &&
    Number.isFinite(v.size) &&
    v.size >= 0
      ? [{ id: v.id, name: v.name, size: v.size, type: string(v.type) }]
      : [],
  );
}
function parseDraft(value: unknown): ManagedEvent | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    !value.id ||
    typeof value.title !== "string" ||
    value.status !== "draft" ||
    value.mode !== "Penyelesaian" ||
    !Array.isArray(value.milestones)
  )
    return null;
  const milestones: EventMilestone[] = [];
  for (const m of value.milestones) {
    if (
      !isRecord(m) ||
      typeof m.id !== "string" ||
      !m.id ||
      typeof m.title !== "string" ||
      milestones.some((x) => x.id === m.id)
    )
      return null;
    milestones.push({
      id: m.id,
      title: m.title,
      instructions: string(m.instructions),
      formats: string(m.formats),
      deadline: isWibDateTime(string(m.deadline)) ? string(m.deadline) : "",
      attachments: attachments(m.attachments),
      surveyActive: m.surveyActive === true,
    });
  }
  const wizard = isRecord(value.wizard) ? value.wizard : {};
  return {
    id: value.id,
    title: value.title,
    status: "draft",
    mode: "Penyelesaian",
    updated: string(value.updated),
    period: string(value.period) || "Belum diatur",
    milestones,
    caseStudyHtml: string(value.caseStudyHtml),
    directionsHtml: string(value.directionsHtml),
    startAt: isWibDateTime(string(value.startAt)) ? string(value.startAt) : "",
    endAt: isWibDateTime(string(value.endAt)) ? string(value.endAt) : "",
    attachments: attachments(value.attachments),
    wizard: {
      step: wizard.step === "milestones" ? "milestones" : "information",
      selectedMilestoneId:
        string(wizard.selectedMilestoneId) || milestones[0]?.id || "",
      modeChosen: wizard.modeChosen === true,
    },
  };
}
function restoreDrafts(value: unknown): Record<string, ManagedEvent> {
  if (!isRecord(value)) throw new Error("Invalid drafts");
  const entries = Object.values(value).map(parseDraft);
  if (entries.some((d) => !d)) throw new Error("Invalid draft");
  return Object.fromEntries(entries.map((d) => [d!.id, d!]));
}
function getSnapshot() {
  if (!initialized && typeof window !== "undefined") {
    initialized = true;
    try {
      const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const stored: unknown = JSON.parse(raw);
        if (
          !isRecord(stored) ||
          stored.version !== 1 ||
          !Array.isArray(stored.deleted) ||
          !stored.deleted.every((x) => typeof x === "string")
        )
          throw new Error("Invalid session");
        snapshot = {
          working: restoreDrafts(stored.working),
          saved: restoreDrafts(stored.saved),
          deleted: stored.deleted,
          storageError: "",
        };
      }
    } catch {
      snapshot = {
        ...initial,
        storageError:
          "Penyimpanan sesi tidak dapat dibaca. Demo tetap dapat digunakan di memori; simpan ulang draf jika diperlukan.",
      };
    }
  }
  return snapshot;
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
function update(next: DraftState) {
  snapshot = { ...next, storageError: "" };
  try {
    sessionStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        working: next.working,
        saved: next.saved,
        deleted: next.deleted,
      }),
    );
  } catch {
    snapshot = {
      ...next,
      storageError:
        "Penyimpanan sesi tidak tersedia atau penuh. Perubahan hanya ada di memori dan dapat hilang saat reload.",
    };
  }
  listeners.forEach((listener) => listener());
  return !snapshot.storageError;
}
export function useEventDraftStore() {
  return useSyncExternalStore(subscribe, getSnapshot, () => initial);
}

export function beginEventDraft() {
  const state = getSnapshot();
  const event = newWizardEvent();
  update({ ...state, working: { ...state.working, [event.id]: event } });
  return event.id;
}
export function readEventDraft(state: DraftState, id: string) {
  if (state.deleted.includes(id)) return undefined;
  return (
    (Object.hasOwn(state.working, id) ? state.working[id] : undefined) ??
    (Object.hasOwn(state.saved, id) ? state.saved[id] : undefined) ??
    managedEvents.find((e) => e.id === id && e.status === "draft")
  );
}
export function changeEventDraft(event: ManagedEvent) {
  const state = getSnapshot();
  if (event.status !== "draft") return false;
  return update({ ...state, working: { ...state.working, [event.id]: event } });
}
export function saveEventDraft(event: ManagedEvent) {
  const state = getSnapshot();
  const period =
    isWibDateTime(event.startAt) && isWibDateTime(event.endAt)
      ? `${formatEventDate(event.startAt, true)} – ${formatEventDate(event.endAt, true)}`
      : "Belum diatur";
  const saved: ManagedEvent = {
    ...event,
    title: event.title.trim(),
    updated: localDate(),
    period,
    status: "draft",
  };
  return update({
    ...state,
    working: { ...state.working, [event.id]: saved },
    saved: { ...state.saved, [event.id]: saved },
    deleted: state.deleted.filter((id) => id !== event.id),
  });
}
export function deleteEventDraft(id: string) {
  const state = getSnapshot();
  const working = { ...state.working };
  const saved = { ...state.saved };
  delete working[id];
  delete saved[id];
  return update({
    ...state,
    working,
    saved,
    deleted: [...new Set([...state.deleted, id])],
  });
}
export function listedEvents(state: DraftState) {
  return [
    ...managedEvents.filter(
      (e) => !state.saved[e.id] && !state.deleted.includes(e.id),
    ),
    ...Object.values(state.saved).filter((e) => !state.deleted.includes(e.id)),
  ];
}
export function wizardHref(
  id: string,
  step: "information" | "milestones" = "information",
) {
  return `/guru/events/create?draft=${encodeURIComponent(id)}${step === "milestones" ? "&step=milestones" : ""}`;
}
