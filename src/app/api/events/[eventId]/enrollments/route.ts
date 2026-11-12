import { z } from "zod";
import { endpoint, body, transaction, ownedEvent } from "@/server/domain/common";
import { enroll } from "@/server/domain/learning";
import { getDatabase } from "@/server/db";
export async function POST(request:Request,context:{params:Promise<{eventId:string}>}) {return endpoint(request,async(user)=>{z.object({}).strict().parse(await body(request));return enroll(user,(await context.params).eventId);},"STUDENT");}
export async function GET(request:Request,context:{params:Promise<{eventId:string}>}) {return endpoint(request,async(user)=>{const {eventId}=await context.params;if(user.role==="TEACHER")await transaction((tx)=>ownedEvent(tx,eventId,user.teacher!.id));const enrollments=await getDatabase().enrollment.findMany({where:{eventId,...(user.role==="STUDENT"?{studentId:user.student!.id}:{})},select:{id:true,eventId:true,studentId:true,enrolledAt:true,student:{select:{user:{select:{name:true}}}}}});return {enrollments};});}
