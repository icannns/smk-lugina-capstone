import "server-only";
import type { Prisma } from "../../generated/prisma/client";
import type { Principal } from "../auth/principal";
import { AuthorizationError } from "../auth/authorization";
import { transaction, fail, type Transaction } from "../domain/common";
import { listQuery, queryInput } from "./validation";

export const resultSelect = {
 id:true,studentId:true,eventId:true,type:true,status:true,title:true,source:true,
 scoreValue:true,scoreMaximum:true,summary:true,feedback:true,completedAt:true,
} satisfies Prisma.ExternalAssessmentReferenceSelect;
export const detailSelect = {...resultSelect,provider:true,externalAssessmentId:true,instrumentVersion:true,revision:true,recordedAt:true} satisfies Prisma.ExternalAssessmentReferenceSelect;
export type Detail = Prisma.ExternalAssessmentReferenceGetPayload<{select:typeof detailSelect}>;
export function resultJson<T extends {scoreValue:{toString():string}|null;scoreMaximum:{toString():string}|null}>(r:T){return {...r,scoreValue:r.scoreValue?.toString()??null,scoreMaximum:r.scoreMaximum?.toString()??null};}
export function detailJson(r:Detail){return {...resultJson(r),completedAt:r.completedAt?.toISOString()??null,recordedAt:r.recordedAt.toISOString()};}
export async function authorizeResult(user:Principal,record:{studentId:string;eventId:string|null},tx:Transaction){
 if(user.role==="STUDENT"){if(record.studentId!==user.student!.id)throw new AuthorizationError(403,"FORBIDDEN");return;}
 if(!record.eventId||!await tx.event.count({where:{id:record.eventId,ownerTeacherId:user.teacher!.id,enrollments:{some:{studentId:record.studentId}}}}))throw new AuthorizationError(403,"FORBIDDEN");
}
export async function listResults(user:Principal,request:Request){
 const q=listQuery.parse(queryInput(request));
 if(user.role==="STUDENT"&&q.studentId&&q.studentId!==user.student!.id)throw new AuthorizationError(403,"FORBIDDEN");
 const where:Prisma.ExternalAssessmentReferenceWhereInput={
  ...(user.role==="STUDENT"?{studentId:user.student!.id}:{enrollment:{event:{ownerTeacherId:user.teacher!.id}},...(q.studentId?{studentId:q.studentId}:{})}),
  ...(q.type?{type:q.type}:{}),...(q.eventId?{eventId:q.eventId}:{}),
 };
 return transaction(async tx=>{const total=await tx.externalAssessmentReference.count({where});const records=await tx.externalAssessmentReference.findMany({where,select:resultSelect,orderBy:[{recordedAt:"desc"},{id:"asc"}],skip:(q.page-1)*q.pageSize,take:q.pageSize});
 return {apiVersion:"1",records:records.map(resultJson),pagination:{page:q.page,pageSize:q.pageSize,total,hasMore:q.page*q.pageSize<total}};});
}
export async function findUiUx(user:Principal,id:string,tx:Transaction){
 const record=await tx.externalAssessmentReference.findUnique({where:{id},select:detailSelect});
 if(!record||record.type!=="UI_UX")fail("Hasil UI/UX tidak ditemukan.",404,"NOT_FOUND");
 await authorizeResult(user,record,tx);return record;
}
