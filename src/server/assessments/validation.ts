import { z } from "zod";
import { Prisma } from "../../generated/prisma/client";

export const assessmentId = z.string().min(1).max(191).regex(/^[a-zA-Z0-9:_-]+$/).refine(v => !["constructor", "prototype", "__proto__"].includes(v));
export const resultStatus = z.enum(["NOT_STARTED", "IN_PROGRESS", "AWAITING_RESULT", "COMPLETED"]);
const decimal = z.string().regex(/^(0|[1-9]\d{0,7})(\.\d{1,4})?$/).transform(v => new Prisma.Decimal(v).toString());
const timestamp = z.iso.datetime({offset:true}).transform(v => new Date(v).toISOString());
const mutable = {
  title: z.string().trim().min(1).max(240), status:resultStatus,
  scoreValue:decimal.nullable(), scoreMaximum:decimal.nullable(),
  summary:z.string().trim().max(5000).nullable(), feedback:z.string().trim().max(5000).nullable(),
  completedAt:timestamp.nullable(),
};
export const createResultInput = z.object({
  type:z.literal("UI_UX").optional(), provider:z.literal("bojong-united").optional(), source:z.literal("INTERNAL").optional(),
  studentId:assessmentId, eventId:assessmentId,
  idempotencyKey:z.string().min(8).max(128).regex(/^[a-zA-Z0-9:_-]+$/),
  externalAssessmentId:assessmentId.nullable().default(null), instrumentVersion:z.string().trim().min(1).max(100).nullable().default(null),
  ...mutable, status:resultStatus.default("NOT_STARTED"),
  scoreValue:decimal.nullable().default(null),scoreMaximum:decimal.nullable().default(null),
  summary:mutable.summary.default(null),feedback:mutable.feedback.default(null),completedAt:timestamp.nullable().default(null),
}).strict();
// Explicit object avoids losing TypeScript field types through Object.fromEntries.
export const resultPatch = z.object({expectedRevision:z.number().int().min(1),
 title:mutable.title.optional(),status:mutable.status.optional(),scoreValue:mutable.scoreValue.optional(),scoreMaximum:mutable.scoreMaximum.optional(),summary:mutable.summary.optional(),feedback:mutable.feedback.optional(),completedAt:mutable.completedAt.optional(),
}).strict().refine(v => Object.keys(v).length > 1, "Sertakan perubahan.");
export const listQuery = z.object({type:z.enum(["UI_UX","COMPETENCY","TECHNOSTRESS"]).optional(),studentId:assessmentId.optional(),eventId:assessmentId.optional(),page:z.coerce.number().int().min(1).max(100000).default(1),pageSize:z.coerce.number().int().min(1).max(100).default(100)}).strict();
export const detailQuery = z.object({history:z.enum(["true","false"]).default("false")}).strict();
export function queryInput(request:Request) {
 const params=new URL(request.url).searchParams;
 for(const key of params.keys()) if(params.getAll(key).length!==1) throw new z.ZodError([{code:"custom",path:[key],message:"Parameter duplikat tidak diizinkan."}]);
 return Object.fromEntries(params);
}
export type ResultValues = z.infer<typeof createResultInput>;
export function validateResultState(value:Pick<ResultValues,"status"|"scoreValue"|"scoreMaximum"|"summary"|"completedAt">) {
 if((value.scoreValue===null)!==(value.scoreMaximum===null)) return "Nilai dan maksimum harus diisi berpasangan.";
 if(value.scoreValue!==null&&value.scoreMaximum!==null){const score=new Prisma.Decimal(value.scoreValue),max=new Prisma.Decimal(value.scoreMaximum);if(max.lte(0)||score.gt(max))return "Nilai harus antara nol dan maksimum positif.";}
 if(value.completedAt && Date.parse(value.completedAt)>Date.now())return "Tanggal selesai tidak boleh di masa depan.";
 if(value.status!=="COMPLETED"&&(value.scoreValue!==null||value.completedAt!==null))return "Nilai akhir/tanggal selesai hanya untuk status COMPLETED.";
 if(value.status==="COMPLETED"&&(!value.completedAt||(value.scoreValue===null&&!value.summary?.trim())))return "Hasil selesai memerlukan tanggal serta skor atau ringkasan.";
 return null;
}
export const statusOrder={NOT_STARTED:0,IN_PROGRESS:1,AWAITING_RESULT:2,COMPLETED:3};
