import "server-only";
import { createHash } from "node:crypto";
import type { Principal } from "../auth/principal";
import { transaction,fail,ownedEvent,asJson } from "../domain/common";
import { assessmentId,createResultInput,resultPatch,validateResultState,statusOrder,detailQuery,queryInput } from "./validation";
import { detailJson,detailSelect,findUiUx } from "./results";
const hash=(v:unknown)=>createHash("sha256").update(JSON.stringify(v)).digest("hex");
export async function createUiUx(user:Principal,raw:unknown){
 const input=createResultInput.parse(raw);const error=validateResultState(input);if(error)fail(error);
 const data={type:"UI_UX" as const,provider:"bojong-united",source:"INTERNAL" as const,
  studentId:input.studentId,eventId:input.eventId,title:input.title,externalAssessmentId:input.externalAssessmentId,instrumentVersion:input.instrumentVersion,
  status:input.status,scoreValue:input.scoreValue,scoreMaximum:input.scoreMaximum,summary:input.summary,feedback:input.feedback,completedAt:input.completedAt,
 };
 const key=hash([user.teacher!.id,input.idempotencyKey]),fingerprint=hash(data);
 return transaction(async tx=>{
  await ownedEvent(tx,input.eventId,user.teacher!.id);
  if(!await tx.studentProfile.count({where:{id:input.studentId}}))fail("Siswa tidak ditemukan.",404,"NOT_FOUND");
  if(!await tx.enrollment.count({where:{eventId:input.eventId,studentId:input.studentId}}))fail("Siswa belum terdaftar pada event.",409,"ENROLLMENT_REQUIRED");
  const previous=await tx.externalAssessmentReference.findUnique({where:{uiUxCreateKey:key},select:{...detailSelect,uiUxCreateHash:true}});
  if(previous){if(previous.uiUxCreateHash!==fingerprint)fail("Idempotency key sudah dipakai untuk payload lain.",409,"IDEMPOTENCY_CONFLICT");const {uiUxCreateHash:ignored,...record}=previous;void ignored;return {apiVersion:"1",created:false,assessment:detailJson(record)};}
  const record=await tx.externalAssessmentReference.create({data:{...data,completedAt:data.completedAt?new Date(data.completedAt):null,revision:1,uiUxCreateKey:key,uiUxCreateHash:fingerprint},select:detailSelect});
  await tx.uiUxAssessmentRevision.create({data:{assessmentId:record.id,revision:1,changedByTeacherId:user.teacher!.id,snapshot:asJson(detailJson(record))}});
  return {apiVersion:"1",created:true,assessment:detailJson(record)};
 });
}
export async function patchUiUx(user:Principal,recordId:string,raw:unknown){
 assessmentId.parse(recordId);const input=resultPatch.parse(raw);
 return transaction(async tx=>{
  const record=await findUiUx(user,recordId,tx);
  await tx.$queryRaw`SELECT id FROM "ExternalAssessmentReference" WHERE id=${record.id} FOR UPDATE`;
  if(record.source!=="INTERNAL"||record.provider!=="bojong-united")fail("Referensi DEMO/provider eksternal hanya dapat dibaca.",409,"READ_ONLY_SOURCE");
  const {expectedRevision,...patch}=input;
  const before=detailJson(record),after={...before,...patch};
  const error=validateResultState(after);if(error)fail(error);
  const keys=Object.keys(patch) as (keyof typeof patch)[];
  if(keys.every(k=>after[k]===before[k]))return {apiVersion:"1",replay:true,assessment:before};
  if(record.revision!==expectedRevision)fail("Hasil berubah. Baca revision terbaru.",409,"STALE_REVISION");
  if(record.status==="COMPLETED")fail("Hasil selesai dibekukan. Buat hasil baru untuk koreksi.",409,"RESULT_FINAL");
  if(statusOrder[after.status]<statusOrder[record.status])fail("Status tidak boleh mundur.",409,"INVALID_TRANSITION");
  const updated=await tx.externalAssessmentReference.update({where:{id:recordId,revision:expectedRevision},data:{...patch,completedAt:after.completedAt?new Date(after.completedAt):null,revision:{increment:1}},select:detailSelect});
  await tx.uiUxAssessmentRevision.create({data:{assessmentId:recordId,revision:updated.revision,changedByTeacherId:user.teacher!.id,snapshot:asJson(detailJson(updated))}});
  return {apiVersion:"1",replay:false,assessment:detailJson(updated)};
 });
}
export async function readUiUx(user:Principal,recordId:string,request:Request){
 assessmentId.parse(recordId);const q=detailQuery.parse(queryInput(request));
 return transaction(async tx=>{const record=await findUiUx(user,recordId,tx);
  const revisions=q.history==="true"?await tx.uiUxAssessmentRevision.findMany({where:{assessmentId:recordId},orderBy:{revision:"asc"},select:{revision:true,changedAt:true,snapshot:true}}):undefined;
  return {apiVersion:"1",assessment:detailJson(record),...(revisions?{historyAvailable:revisions.length>0,revisions}:{})};
 });
}
