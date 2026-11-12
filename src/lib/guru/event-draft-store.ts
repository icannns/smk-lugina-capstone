"use client";
import { useSyncExternalStore } from "react";
import { submissionKey } from "../domain/keys";
import type { WorkspaceSnapshot } from "../domain/contracts";
import type { ManagedEvent } from "./event-types";
import type { WizardStep, GuruRubric, TeacherProfile, TeacherAssessment, TeacherFeedback } from "./teacher-types";
import { newWizardEvent } from "./event-wizard-data";
import { profileIdentity } from "./profile-data";
export const DRAFT_STORAGE_KEY = "lugina.teacher.event-drafts.v1"; // Legacy key, never used as a database fallback.
type State = WorkspaceSnapshot & { status: "loading" | "ready" | "error"; loaded: boolean; pending: number };
const initial: State = { accountId: "", serverTime: "", working: {}, saved: {}, published: {}, rubrics: {}, deleted: [], storageError: "", status: "loading", loaded: false, pending: 0,
 learning: { source: "api", assessments: {}, feedback: {}, submissions: {}, students: [], enrollments: [] }, profile: { name: "", email: "", phone: "", role: "" },
 studentUI: { workDrafts: {}, surveyDrafts: {}, surveyResponses: {}, profiles: {}, certificates: {} }, studentReviews: { notes: {}, reviews: {}, reviewedAt: {}, reviewedResponses: {} } };
let snapshot = initial, generation = 0, requestSequence = 0;
const listeners = new Set<() => void>();
function notify(next: State) { snapshot = next; listeners.forEach((listener) => listener()); }
function subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function useEventDraftStore() { return useSyncExternalStore(subscribe, () => snapshot, () => initial); }
export function readEventStore() { return snapshot; }
export function connectWorkspace(accountId: string) {
 creating = null; creationAttempt = null;
 const token = ++generation; notify({ ...initial, accountId });
 void refreshWorkspace().catch(() => {});
 return () => { if (token === generation) { generation++; notify(initial); } };
}
export async function refreshWorkspace() {
 const accountId = snapshot.accountId, token = generation, sequence = ++requestSequence;
 if (!accountId) return;
 try {
  const response = await fetch("/api/workspace", { cache: "no-store", credentials: "same-origin" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message ?? "Data tidak dapat dimuat.");
  if (data.learning?.source !== "api" || !Array.isArray(data.learning.students) || !Array.isArray(data.learning.enrollments)) throw new Error("Respons data server tidak valid.");
  if (data.accountId !== accountId) throw new Error("Identitas sesi berubah. Muat ulang atau masuk kembali.");
  if (token !== generation || sequence !== requestSequence) return;
  const dict = (value: object) => Object.assign(Object.create(null), value);
  for (const key of ["saved", "published", "rubrics"]) data[key] = dict(data[key]);
  for (const key of ["assessments", "feedback", "submissions"]) data.learning[key] = dict(data.learning[key]);
  for (const key of ["profiles", "workDrafts", "surveyDrafts", "surveyResponses", "certificates"]) data.studentUI[key] = dict(data.studentUI[key]);
  notify({ ...data, working: snapshot.working, status: "ready", loaded: true, pending: snapshot.pending, storageError: "" });
 } catch (error) {
  if (token === generation && sequence === requestSequence) notify({ ...snapshot, status: "error", storageError: error instanceof Error ? error.message : "Layanan tidak tersedia." });
  throw error;
 }
}
export async function mutateDomain<T = Record<string, unknown>>(path: string, method: string, data?: unknown, clearDraftId?: string): Promise<T | null> {
 const token = generation; notify({ ...snapshot, pending: snapshot.pending + 1, storageError: "" });
 try {
  const response = await fetch(path, { method, credentials: "same-origin", headers: { "Content-Type": "application/json" }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error?.message ?? "Penyimpanan gagal.");
  if (token !== generation) return null;
  if (clearDraftId) { const working = { ...snapshot.working }; delete working[clearDraftId]; notify({ ...snapshot, working }); }
  try { await refreshWorkspace(); }
  catch { throw new Error("Perubahan tersimpan di server, tetapi tampilan gagal diperbarui. Muat ulang sebelum mengulang aksi."); }
  return value as T;
 } catch (error) {
  if (token === generation) notify({ ...snapshot, storageError: error instanceof Error ? error.message : "Penyimpanan gagal; tidak ada sukses lokal." });
  return null;
 } finally { if (token === generation) notify({ ...snapshot, pending: Math.max(0, snapshot.pending - 1) }); }
}
export const pathId = (value: string) => encodeURIComponent(value);
export function useTeacherProfile() { return profileIdentity(useEventDraftStore().profile); }
export async function saveTeacherProfile(profile: TeacherProfile) { return Boolean(await mutateDomain("/api/profile", "PUT", { name: profile.name, email: profile.email, phone: profile.phone, role: profile.role, avatar: profile.avatar })); }
let creating: Promise<string | undefined> | null = null;
let creationAttempt: ManagedEvent | null = null;
export function beginEventDraft() {
 if (creating) return creating;
 const event = creationAttempt ?? newWizardEvent(); creationAttempt = event;
 const running = mutateDomain("/api/events", "POST", { event }).then((result) => {
  if (result && creationAttempt === event) creationAttempt = null;
  return result ? event.id : undefined;
 });
 creating = running;
 void running.finally(() => { if (creating === running) creating = null; });
 return creating;
}
export function readEventDraft(state: WorkspaceSnapshot, id: string) { return (Object.hasOwn(state.working,id) ? state.working[id] : undefined) ?? (Object.hasOwn(state.saved,id) ? state.saved[id] : undefined) ?? (Object.hasOwn(state.published,id) ? state.published[id] : undefined); }
export function changeEventDraft(event: ManagedEvent) {
 if (event.status !== "draft" || snapshot.published[event.id]) return false;
 notify({ ...snapshot, working: { ...snapshot.working, [event.id]: event } }); return true;
}
export async function saveEventDraft(event: ManagedEvent) { return Boolean(await mutateDomain(`/api/events/${pathId(event.id)}`, "PUT", { event }, event.id)); }
export async function deleteEventDraft(id: string) {
 const event = snapshot.saved[id] ?? snapshot.working[id]; if (!event) return false;
 return Boolean(await mutateDomain(`/api/events/${pathId(id)}?revision=${event.revision ?? 0}`, "DELETE", undefined, id));
}
export async function restoreDeletedEventDraft(event: ManagedEvent) { return Boolean(await mutateDomain("/api/events", "POST", { event: { ...event, revision: undefined } })); }
export function listedEvents(state: WorkspaceSnapshot) { return [...Object.values(state.saved), ...Object.values(state.published)]; }
export function wizardHref(id: string, step: WizardStep = "information") { return `/guru/events/create?draft=${pathId(id)}${step !== "information" ? `&step=${step}` : ""}`; }
export async function publishEvent(event: ManagedEvent) {
 const result = await mutateDomain(`/api/events/${pathId(event.id)}/publish`, "POST", { event }, event.id);
 return result ? snapshot.published[event.id] : undefined;
}
export async function updateEventDeadline(eventId: string, milestoneId: string, deadline: string) {
 const event = snapshot.published[eventId]; if (!event) return false;
 return Boolean(await mutateDomain(`/api/events/${pathId(eventId)}`, "PUT", { event: { ...event, milestones: event.milestones.map((m) => m.id === milestoneId ? { ...m, deadline } : m) } }));
}
export async function saveRubric(rubric: GuruRubric) { return Boolean(await mutateDomain(snapshot.rubrics[rubric.id] ? `/api/rubrics/${pathId(rubric.id)}` : "/api/rubrics", snapshot.rubrics[rubric.id] ? "PUT" : "POST", rubric)); }
export async function saveAssessment(assessment: TeacherAssessment, _rubricId: string) {
 void _rubricId;
 const old = snapshot.learning.assessments[`${assessment.submissionId}:v${assessment.version}`];
 return Boolean(await mutateDomain(`/api/submissions/${pathId(assessment.submissionId)}/assessment`, "PUT", { version: assessment.version, scores: assessment.scores, expectedRevision: old?.revision ?? 0, requestId: crypto.randomUUID() }));
}
export async function addTeacherFeedback(submissionId: string, feedback: TeacherFeedback) {
 return Boolean(await mutateDomain(`/api/submissions/${pathId(submissionId)}/feedback`, "POST", { id: feedback.id, message: feedback.message, revision: feedback.revision, deadline: feedback.deadline, version: feedback.version }));
}
export async function saveStudentNote(enrollmentId: string, note: string) { return Boolean(await mutateDomain(`/api/enrollments/${pathId(enrollmentId)}/note`, "PUT", { note })); }
export async function markStudentReviewed(enrollmentId: string) {
 const e = snapshot.learning.enrollments?.find((row) => row.id === enrollmentId); if (!e) return false;
 const prefix = submissionKey(e.eventId,e.studentId,"");
 const responseIds = Object.entries(snapshot.studentUI.surveyResponses).filter(([key]) => key.startsWith(prefix)).map(([, value]) => value.id);
 return Boolean(await mutateDomain(`/api/enrollments/${pathId(enrollmentId)}/review`, "POST", { responseIds }));
}
