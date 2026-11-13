import type { AssessmentRepository, AssessmentRecord } from "./types";
// Internal PostgreSQL read adapter. No FOMO/COMMIT network contract is assumed.
export const databaseAssessmentRepository: AssessmentRepository = {
 async list(_scope, signal) {
  void _scope;
  const collected = new Map<string, AssessmentRecord>();
  for (let page = 1; page <= 1000; page++) {
  signal.throwIfAborted();
  const response = await fetch(`/api/assessment-results?page=${page}&pageSize=100`, { signal, cache: "no-store", credentials: "same-origin" });
  const data = await response.json();
  if (!response.ok || !Array.isArray(data.records)) throw new Error("Hasil asesmen tidak tersedia.");
  const types = { COMPETENCY: "competency", TECHNOSTRESS: "technostress", UI_UX: "uiux" } as const;
  const statuses = { NOT_STARTED: "not_started", IN_PROGRESS: "in_progress", AWAITING_RESULT: "awaiting_result", COMPLETED: "completed" } as const;
  const records: AssessmentRecord[] = data.records.map((r: {id:string;type:keyof typeof types;status:keyof typeof statuses;title:string;studentId:string;eventId:string|null;source:string;scoreValue:string|null;scoreMaximum:string|null;summary:string|null;feedback:string|null;completedAt:string|null}): AssessmentRecord => {
   if (!types[r.type] || !statuses[r.status]) throw new Error("Kontrak hasil asesmen tidak valid.");
   return { id:r.id,type:types[r.type],status:statuses[r.status],title:r.title,studentId:r.studentId,eventId:r.eventId??undefined,
    source:r.source==="DEMO"?"mock":"api",origin:r.source as "DEMO"|"INTERNAL"|"EXTERNAL",completedAt:r.completedAt??undefined,feedback:r.feedback??undefined,
    result:r.summary!==null||r.scoreValue!==null?{summary:r.summary??undefined,score:r.scoreValue!==null&&r.scoreMaximum!==null?{value:Number(r.scoreValue),maximum:Number(r.scoreMaximum)}:undefined}:undefined };
  });
  records.forEach((record) => collected.set(record.id, record));
  if (data.pagination?.hasMore !== true) return [...collected.values()];
  }
  throw new Error("Hasil asesmen melebihi batas pemuatan dashboard.");
 },
};
