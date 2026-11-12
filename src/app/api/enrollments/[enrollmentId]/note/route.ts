import { z } from "zod";
import { endpoint,body,transaction,ownedEvent } from "@/server/domain/common";
import { AuthorizationError } from "@/server/auth/authorization";
export async function PUT(request:Request,context:{params:Promise<{enrollmentId:string}>}){return endpoint(request,async(user)=>{const input=z.object({note:z.string().max(5000)}).strict().parse(await body(request));return transaction(async(tx)=>{const {enrollmentId}=await context.params;const e=await tx.enrollment.findUnique({where:{id:enrollmentId}});if(!e)throw new AuthorizationError(403,"FORBIDDEN");await ownedEvent(tx,e.eventId,user.teacher!.id);await tx.enrollment.update({where:{id:e.id},data:{teacherNote:input.note}});return {saved:true};});},"TEACHER");}
