import { z } from "zod";
import { endpoint, body, id, revision, transaction, ownedEvent, fail } from "@/server/domain/common";
import { AuthorizationError } from "@/server/auth/authorization";
export async function PUT(request:Request,context:{params:Promise<{eventId:string;milestoneId:string}>}) {
 return endpoint(request,async(user)=>{const p=await context.params;const input=z.object({surveyReferenceId:id.nullable(),expectedRevision:revision}).strict().parse(await body(request));return transaction(async(tx)=>{
  const event=await ownedEvent(tx,p.eventId,user.teacher!.id);if(event.revision!==input.expectedRevision)fail("Event berubah. Muat ulang.",409,"STALE_REVISION");
  if(!await tx.milestone.findUnique({where:{eventId_id:{eventId:p.eventId,id:p.milestoneId}}}))throw new AuthorizationError(403,"FORBIDDEN");
  const existing=await tx.milestoneSurveyReference.findMany({where:{eventId:p.eventId,milestoneId:p.milestoneId}});
  const responses=await tx.surveyResponseReference.count({where:{eventId:p.eventId,milestoneId:p.milestoneId}});
  if(responses&&(!input.surveyReferenceId||existing.some((b)=>b.surveyReferenceId!==input.surveyReferenceId)))fail("Referensi berisi respons tidak dapat diganti/dilepas.",409,"HISTORY_EXISTS");
  if(input.surveyReferenceId){const ref=await tx.surveyReference.findUnique({where:{id:input.surveyReferenceId}});if(!ref)throw new AuthorizationError(403,"FORBIDDEN");if(ref.source!=="DEMO")fail("Kepemilikan/provider eksternal belum terintegrasi.",501,"PROVIDER_UNAVAILABLE");}
  await tx.event.update({where:{id:event.id},data:{revision:{increment:1}}});
  await tx.milestoneSurveyReference.updateMany({where:{eventId:event.id,milestoneId:p.milestoneId},data:{enabled:false}});
  if(input.surveyReferenceId){const key={eventId:event.id,milestoneId:p.milestoneId,surveyReferenceId:input.surveyReferenceId};await tx.milestoneSurveyReference.upsert({where:{eventId_milestoneId_surveyReferenceId:key},create:key,update:{enabled:true}});}
  return {saved:true};});},"TEACHER");
}
