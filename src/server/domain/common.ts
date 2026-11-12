import "server-only";
import { getDatabase } from "../db";
import { requirePrincipal, AuthorizationError } from "../auth/authorization";
import { privateJson, sameOrigin } from "../auth/http";
import { z } from "zod";
import sanitizeHtml from "sanitize-html";
import { isWibDateTime } from "../../lib/guru/event-wizard-validation";
import type { Prisma } from "../../generated/prisma/client";
export type Transaction = Prisma.TransactionClient;
export class DomainError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
export function fail(message: string, status = 400, code = "INVALID_INPUT"): never { throw new DomainError(status, code, message); }
function serializationConflict(error: unknown, depth = 0): boolean {
  if (!error || typeof error !== "object" || depth > 6) return false;
  const failure = error as Record<string, unknown>;
  if ([failure.code, failure.originalCode, failure.sqlState].some((code) => ["P2034", "40001", "40P01"].includes(String(code)))) return true;
  return Object.values(failure).some((nested) => serializationConflict(nested, depth + 1));
}
export async function transaction<T>(work: (tx: Transaction) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try { return await getDatabase().$transaction(work, { isolationLevel: "Serializable", timeout: 20000 }); }
    catch (error) {
      if (attempt < 3 && serializationConflict(error)) continue;
      throw error;
    }
  }
}
export async function endpoint(request: Request, work: (user: Awaited<ReturnType<typeof requirePrincipal>>) => Promise<unknown>, role?: "TEACHER" | "STUDENT", status = 200) {
  try {
    const user = await requirePrincipal(role);
    if (!["GET", "HEAD"].includes(request.method) && !sameOrigin(request)) throw new AuthorizationError(403, "FORBIDDEN");
    return privateJson(await work(user), status);
  } catch (error) {
    if (error instanceof AuthorizationError) return privateJson({ error: { code: error.code, message: error.status === 401 ? "Silakan masuk kembali." : "Akses tidak diizinkan." } }, error.status);
    if (error instanceof DomainError) return privateJson({ error: { code: error.code, message: error.message } }, error.status);
    if (error instanceof z.ZodError) return privateJson({ error: { code: "INVALID_INPUT", message: "Data permintaan tidak valid.", fields: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })) } }, 400);
    if (serializationConflict(error)) return privateJson({ error: { code: "CONFLICT", message: "Penulisan bersamaan belum selesai. Muat ulang dan coba lagi." } }, 409);
    if (error && typeof error === "object" && "code" in error && ["P2002", "P2003", "P2004", "P2034"].includes(String(error.code)))
      return privateJson({ error: { code: "CONFLICT", message: "Data berubah atau masih digunakan. Muat ulang sebelum mencoba lagi." } }, 409);
    return privateJson({ error: { code: "UNAVAILABLE", message: "Layanan sementara tidak tersedia. Tidak ada fallback data contoh." } }, 503);
  }
}
export async function body(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.startsWith("application/json")) fail("Gunakan application/json.", 415);
  const reader = request.body?.getReader(); if (!reader) fail("Body wajib diisi.");
  const chunks: Uint8Array[] = []; let size = 0;
  for (;;) { const { done, value } = await reader.read(); if (done) break; size += value.length;
    if (size > 1024 * 1024) { await reader.cancel(); fail("Permintaan terlalu besar.", 413); } chunks.push(value); }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { fail("JSON tidak valid."); }
}
export function cleanHtml(value = "") {
  return sanitizeHtml(value, { allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "s", "ul", "ol", "li", "h1", "h2", "h3", "blockquote", "a"],
    allowedAttributes: { a: ["href", "title"] }, allowedSchemes: ["http", "https"], allowProtocolRelative: false });
}
export function asJson(value: unknown) { return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue; }
export function wib(value: Date | null | undefined) { return value ? value.toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" }).replace(" ", "T").slice(0, 16) : ""; }
export function date(value?: string) { return value ? new Date(value + (value.length === 16 ? ":00+07:00" : "+07:00")) : null; }
export const id = z.string().min(1).max(191).regex(/^[a-zA-Z0-9:_-]+$/).refine((value) => !["__proto__", "constructor", "prototype"].includes(value), "ID dicadangkan.");
export const revision = z.number().int().nonnegative();
export const file = z.object({ id, name: z.string().min(1).max(255), type: z.string().max(150), size: z.number().int().min(0).max(10 * 1024 * 1024) }).strict();
const fileMeta = file.omit({ id: true });
const position = z.object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) }).strict();
export const certificate = z.object({ mode: z.enum(["details", "template"]), threshold: z.string().max(10), name: z.string().max(240), organizer: z.string().max(240), issuedAt: z.string().max(10).refine((value) => !value || isWibDateTime(`${value}T00:00`), "Tanggal dokumen tidak valid."), signer: z.string().max(120), signerRole: z.string().max(120), description: z.string().max(5000), logo: fileMeta.optional(), signature: fileMeta.optional(), template: fileMeta.optional(), positions: z.object({ student: position, event: position, date: position, score: position }).strict() }).strict();
const localDate = z.string().max(19).refine((value) => !value || isWibDateTime(value), "Tanggal WIB tidak valid.");
export const milestoneInput = z.object({ id, title: z.string().max(240), instructions: z.string().max(50000).optional(), deadline: localDate.optional(), formats: z.string().max(150).optional(), surveyActive: z.boolean().optional(), attachments: z.array(file).max(10).optional() }).strict();
export const eventInput = z.object({ id, revision: revision.optional(), teacherName: z.string().max(120).optional(), participantCount: z.number().int().nonnegative().optional(), title: z.string().max(240), status: z.enum(["draft", "upcoming", "ongoing", "ended"]), mode: z.literal("Penyelesaian"), updated: z.string().max(40), period: z.string().max(300), milestones: z.array(milestoneInput).max(30), progress: z.number().optional(), rubric: z.string().max(240).optional(), certificate: z.string().max(240).optional(), rubricId: id.optional(), certificateConfig: certificate.optional(), caseStudyHtml: z.string().max(100000).optional(), directionsHtml: z.string().max(100000).optional(), startAt: localDate.optional(), endAt: localDate.optional(), attachments: z.array(file).max(10).optional(), wizard: z.object({ step: z.enum(["information", "milestones", "rubric", "certificate", "review", "done"]), selectedMilestoneId: z.string().max(191), modeChosen: z.boolean() }).strict().optional() }).strict();
export const rubricInput = z.object({ id, title: z.string().trim().min(1).max(240), description: z.string().max(5000), updated: z.string().max(40), inUse: z.boolean(), criteria: z.array(z.object({ id, title: z.string().trim().min(1).max(240), description: z.string().max(5000), min: z.number().int().min(0).max(100), max: z.number().int().min(0).max(100), levels: z.array(z.string().max(3000)).max(101).optional() }).strict().refine((c) => c.max >= c.min)).min(1).max(30) }).strict();
export const workInput = z.object({ files: z.array(file).max(5), text: z.string().max(50000), link: z.string().max(2000).refine((value) => !value || /^https?:\/\//i.test(value) && URL.canParse(value)) }).strict();
export const surveyInput = z.object({ first: z.number().int().min(1).max(5), second: z.number().int().min(1).max(5), reflection: z.string().max(5000) }).strict();
export async function ownedEvent(tx: Transaction, eventId: string, teacherId: string) {
  const event = await tx.event.findFirst({ where: { id: eventId, ownerTeacherId: teacherId } });
  if (!event) throw new AuthorizationError(403, "FORBIDDEN"); return event;
}
export async function enrolled(tx: Transaction, eventId: string, studentId: string) {
  const row = await tx.enrollment.findUnique({ where: { eventId_studentId: { eventId, studentId } } });
  if (!row) throw new AuthorizationError(403, "FORBIDDEN"); return row;
}

export function timestamp(value: Date) { return new Date(value.getTime() + 7 * 3600000).toISOString().replace("Z", ""); }
