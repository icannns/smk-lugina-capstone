import { endpoint,body } from "@/server/domain/common";
import { studentWork } from "@/server/domain/learning";
export async function PUT(request:Request,context:{params:Promise<{eventId:string;milestoneId:string}>}) {return endpoint(request,async(user)=>{const p=await context.params;return studentWork(user,p.eventId,p.milestoneId,await body(request),false);},"STUDENT");}
