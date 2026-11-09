"use client";

import { useSyncExternalStore } from "react";
import { managedEvents } from "./event-data";
import { formatEventDate } from "./event-selectors";
import { localDate, newWizardEvent } from "./event-wizard-data";
import { isWibDateTime } from "./event-wizard-validation";
import { initialRubrics } from "./rubric-data";
import type {
  CertificateConfig,
  GuruRubric,
  WizardStep,
  AssessmentChanges,
  TeacherAssessment,
  TeacherFeedback,
  TeacherProfile,
} from "./teacher-types";
import type {
  EventAttachment,
  EventMilestone,
  ManagedEvent,
} from "./event-types";
import { initialTeacherProfile, profileIdentity } from "./profile-data";
import { initialStudentUI, type StudentUIState } from "../siswa/student-types";
import { parseStudentUI, parseLearningExtras } from "../siswa/serialization";
import type { StudentSession } from "./student-types";
import {
  initialStudentReviews,
  parseStudentReviews,
} from "./student-review-state";

export const DRAFT_STORAGE_KEY = "lugina.teacher.event-drafts.v1";
type DraftState = {
  working: Record<string, ManagedEvent>;
  saved: Record<string, ManagedEvent>;
  deleted: string[];
  storageError: string;
  rubrics: Record<string, GuruRubric>;
  published: Record<string, ManagedEvent>;
  learning: AssessmentChanges;
  profile: TeacherProfile;
  studentUI: StudentUIState;
  studentReviews: StudentSession;
};
const initial: DraftState = {
  working: {},
  saved: {},
  deleted: [],
  storageError: "",
  rubrics: Object.fromEntries(initialRubrics.map((r) => [r.id, r])),
  published: {},
  learning: { assessments: {}, feedback: {} },
  profile: initialTeacherProfile,
  studentUI: initialStudentUI,
  studentReviews: initialStudentReviews,
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
    rubricId: string(value.rubricId) || undefined,
    rubric: string(value.rubric) || undefined,
    certificateConfig: parseCertificate(value.certificateConfig),
    wizard: {
      step: ["milestones", "rubric", "certificate", "review", "done"].includes(
        string(wizard.step),
      )
        ? (wizard.step as WizardStep)
        : "information",
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
          rubrics: parseRubrics(stored.rubrics),
          published: restorePublished(stored.published),
          learning: parseLearning(stored.learning),
          profile: parseProfile(stored.profile),
          studentUI: parseStudentUI(stored.studentUI),
          studentReviews: parseStudentReviews(stored.studentReviews),
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
        rubrics: next.rubrics,
        published: next.published,
        learning: next.learning,
        profile: next.profile,
        studentUI: next.studentUI,
        studentReviews: next.studentReviews,
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
export function readEventStore() {
  return getSnapshot();
}
export function saveStudentNote(enrollmentId: string, note: string) {
  const state = getSnapshot();
  return update({
    ...state,
    studentReviews: {
      ...state.studentReviews,
      notes: { ...state.studentReviews.notes, [enrollmentId]: note },
    },
  });
}
export function markStudentReviewed(enrollmentId: string) {
  const state = getSnapshot();
  return update({
    ...state,
    studentReviews: {
      ...state.studentReviews,
      reviews: { ...state.studentReviews.reviews, [enrollmentId]: true },
      reviewedAt: {
        ...state.studentReviews.reviewedAt,
        [enrollmentId]: new Date().toISOString(),
      },
      reviewedResponses: {
        ...state.studentReviews.reviewedResponses,
        [enrollmentId]: Object.values(state.studentUI.surveyResponses).map(
          (r) => r.id,
        ),
      },
    },
  });
}
export function updateStudentDomain(
  change: (
    state: Pick<DraftState, "learning" | "studentUI">,
  ) => Pick<DraftState, "learning" | "studentUI">,
) {
  const state = getSnapshot();
  return update({ ...state, ...change(state) });
}
function parseProfile(value: unknown): TeacherProfile {
  if (
    !isRecord(value) ||
    typeof value.name !== "string" ||
    !value.name.trim() ||
    typeof value.email !== "string" ||
    !/^[^\s@]+@example\.com$/i.test(value.email)
  )
    return initialTeacherProfile;
  return {
    name: value.name.slice(0, 120),
    email: value.email,
    phone: string(value.phone).slice(0, 30),
    role: string(value.role).slice(0, 80),
    avatar:
      typeof value.avatar === "string" &&
      /^data:image\/(jpeg|png);base64,/.test(value.avatar) &&
      value.avatar.length < 400000
        ? value.avatar
        : undefined,
  };
}
export function useTeacherProfile() {
  return profileIdentity(useEventDraftStore().profile);
}
export function saveTeacherProfile(profile: TeacherProfile) {
  const state = getSnapshot();
  return update({ ...state, profile: parseProfile(profile) });
}

function parseLearning(value: unknown): AssessmentChanges {
  const result: AssessmentChanges = { assessments: {}, feedback: {} };
  if (!isRecord(value)) return result;
  Object.assign(result, parseLearningExtras(value));
  if (isRecord(value.assessments))
    for (const [key, v] of Object.entries(value.assessments)) {
      if (
        !isRecord(v) ||
        typeof v.submissionId !== "string" ||
        typeof v.version !== "number" ||
        !isRecord(v.scores)
      )
        continue;
      const scores = Object.fromEntries(
        Object.entries(v.scores).filter(
          (entry): entry is [string, number] =>
            typeof entry[1] === "number" &&
            Number.isInteger(entry[1]) &&
            entry[1] >= 1 &&
            entry[1] <= 5,
        ),
      );
      result.assessments[key] = {
        submissionId: v.submissionId,
        version: v.version,
        scores,
        savedAt: string(v.savedAt),
      };
    }
  if (isRecord(value.feedback))
    for (const [id, items] of Object.entries(value.feedback)) {
      if (!Array.isArray(items)) continue;
      result.feedback[id] = items
        .filter(isRecord)
        .filter(
          (v) =>
            typeof v.id === "string" &&
            typeof v.message === "string" &&
            typeof v.version === "number",
        )
        .map((v) => ({
          id: string(v.id),
          message: string(v.message),
          createdAt: string(v.createdAt),
          revision: v.revision === true,
          deadline: string(v.deadline) || undefined,
          version: Number(v.version),
        }));
    }
  return result;
}
export function saveAssessment(
  assessment: TeacherAssessment,
  rubricId: string,
) {
  const state = getSnapshot(),
    rubric = state.rubrics[rubricId];
  if (
    !rubric ||
    !rubric.criteria.length ||
    !rubric.criteria.every(
      (c) =>
        Number.isInteger(assessment.scores[c.id]) &&
        assessment.scores[c.id] >= c.min &&
        assessment.scores[c.id] <= c.max,
    )
  )
    return false;
  return update({
    ...state,
    rubrics: { ...state.rubrics, [rubricId]: { ...rubric, inUse: true } },
    learning: {
      ...state.learning,
      assessments: {
        ...state.learning.assessments,
        [`${assessment.submissionId}:v${assessment.version}`]: assessment,
      },
    },
  });
}
export function addTeacherFeedback(
  submissionId: string,
  feedback: TeacherFeedback,
) {
  const state = getSnapshot();
  if (!feedback.message.trim()) return false;
  return update({
    ...state,
    learning: {
      ...state.learning,
      feedback: {
        ...state.learning.feedback,
        [submissionId]: [
          ...(state.learning.feedback[submissionId] ?? []),
          feedback,
        ],
      },
    },
  });
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
    (Object.hasOwn(state.published, id) ? state.published[id] : undefined) ??
    managedEvents.find((e) => e.id === id && e.status === "draft")
  );
}
export function changeEventDraft(event: ManagedEvent) {
  const state = getSnapshot();
  if (event.status !== "draft" || Object.hasOwn(state.published, event.id))
    return false;
  return update({ ...state, working: { ...state.working, [event.id]: event } });
}
export function saveEventDraft(event: ManagedEvent) {
  const state = getSnapshot();
  if (Object.hasOwn(state.published, event.id)) return false;
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
export function restoreDeletedEventDraft(event: ManagedEvent) {
  const state = getSnapshot();
  if (event.status !== "draft" || state.published[event.id]) return false;
  return update({
    ...state,
    saved: { ...state.saved, [event.id]: event },
    working: { ...state.working, [event.id]: event },
    deleted: state.deleted.filter((id) => id !== event.id),
  });
}
export function listedEvents(state: DraftState) {
  return [
    ...managedEvents.filter(
      (e) =>
        !state.saved[e.id] &&
        !state.published[e.id] &&
        !state.deleted.includes(e.id),
    ),
    ...Object.values(state.saved).filter((e) => !state.deleted.includes(e.id)),
    ...Object.values(state.published),
  ].map((event) => ({
    ...event,
    rubric: state.rubrics[event.rubricId ?? ""]?.title ?? event.rubric,
  }));
}
export function wizardHref(id: string, step: WizardStep = "information") {
  return `/guru/events/create?draft=${encodeURIComponent(id)}${step !== "information" ? `&step=${step}` : ""}`;
}
export function updateEventDeadline(
  eventId: string,
  milestoneId: string,
  deadline: string,
) {
  const state = getSnapshot(),
    event = listedEvents(state).find(
      (e) => e.id === eventId && e.status !== "draft",
    );
  if (
    !event ||
    !isWibDateTime(deadline) ||
    !event.milestones.some((m) => m.id === milestoneId)
  )
    return false;
  return update({
    ...state,
    published: {
      ...state.published,
      [eventId]: {
        ...event,
        milestones: event.milestones.map((m) =>
          m.id === milestoneId ? { ...m, deadline } : m,
        ),
        updated: localDate(),
      },
    },
  });
}

function parseCertificate(value: unknown): CertificateConfig | undefined {
  if (
    !isRecord(value) ||
    !["details", "template"].includes(string(value.mode)) ||
    !isRecord(value.positions)
  )
    return undefined;
  const positions = {} as CertificateConfig["positions"];
  for (const key of ["student", "event", "date", "score"] as const) {
    const p = value.positions[key];
    if (!isRecord(p) || typeof p.x !== "number" || typeof p.y !== "number")
      return undefined;
    positions[key] = {
      x: Math.max(0, Math.min(100, p.x)),
      y: Math.max(0, Math.min(100, p.y)),
    };
  }
  const file = (v: unknown) =>
    isRecord(v) &&
    typeof v.name === "string" &&
    typeof v.size === "number" &&
    typeof v.type === "string"
      ? { name: v.name, size: v.size, type: v.type }
      : undefined;
  return {
    mode: value.mode as CertificateConfig["mode"],
    threshold: string(value.threshold),
    name: string(value.name),
    organizer: string(value.organizer),
    issuedAt: string(value.issuedAt),
    signer: string(value.signer),
    signerRole: string(value.signerRole),
    description: string(value.description),
    positions,
    logo: file(value.logo),
    signature: file(value.signature),
    template: file(value.template),
  };
}
function parseRubrics(value: unknown): Record<string, GuruRubric> {
  if (!isRecord(value)) return initial.rubrics;
  const result = { ...initial.rubrics };
  for (const [id, item] of Object.entries(value)) {
    if (
      !isRecord(item) ||
      typeof item.title !== "string" ||
      !Array.isArray(item.criteria)
    )
      continue;
    const criteria = item.criteria
      .filter(isRecord)
      .filter(
        (c) =>
          typeof c.id === "string" &&
          typeof c.title === "string" &&
          typeof c.min === "number" &&
          typeof c.max === "number" &&
          c.max >= c.min,
      )
      .map((c) => ({
        id: String(c.id),
        title: String(c.title),
        description: string(c.description),
        min: Number(c.min),
        max: Number(c.max),
        levels: Array.isArray(c.levels)
          ? c.levels.slice(0, 5).map(string)
          : undefined,
      }));
    if (criteria.length)
      result[id] = {
        id,
        title: item.title,
        description: string(item.description),
        updated: string(item.updated),
        inUse: item.inUse === true,
        criteria,
      };
  }
  return result;
}
export function saveRubric(rubric: GuruRubric) {
  const state = getSnapshot();
  if (state.rubrics[rubric.id]?.inUse) return false;
  return update({
    ...state,
    rubrics: { ...state.rubrics, [rubric.id]: rubric },
  });
}
function restorePublished(value: unknown): Record<string, ManagedEvent> {
  if (!isRecord(value)) return {};
  const entries: [string, ManagedEvent][] = [];
  for (const v of Object.values(value)) {
    if (
      !isRecord(v) ||
      !["ongoing", "upcoming", "ended"].includes(string(v.status))
    )
      continue;
    const draft = parseDraft({ ...v, status: "draft" });
    if (draft)
      entries.push([
        draft.id,
        {
          ...draft,
          status: v.status as ManagedEvent["status"],
          certificate: string(v.certificate),
          progress: Number(v.progress) || 0,
        },
      ]);
  }
  return Object.fromEntries(entries);
}
export function publishEvent(event: ManagedEvent) {
  const state = getSnapshot();
  if (Object.hasOwn(state.published, event.id))
    return state.published[event.id];
  const now = new Date()
    .toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" })
    .replace(" ", "T")
    .slice(0, 16);
  const published: ManagedEvent = {
    ...event,
    status:
      event.endAt && event.endAt < now
        ? "ended"
        : event.startAt && event.startAt > now
          ? "upcoming"
          : "ongoing",
    progress: 0,
    updated: localDate(),
    period: `${formatEventDate(event.startAt!, true)} – ${formatEventDate(event.endAt!, true)}`,
    rubric: state.rubrics[event.rubricId ?? ""]?.title,
    certificate: `Nilai akhir ≥ ${event.certificateConfig?.threshold ?? "75"}`,
    wizard: { ...event.wizard!, step: "done" },
  };
  const working = { ...state.working },
    saved = { ...state.saved };
  delete working[event.id];
  delete saved[event.id];
  update({
    ...state,
    working,
    saved,
    published: { ...state.published, [event.id]: published },
    deleted: state.deleted.filter((id) => id !== event.id),
  });
  return published;
}
