import { endpoint,body,transaction } from "@/server/domain/common";
import { studentWork } from "@/server/domain/learning";
import { workspace } from "@/server/domain/workspace";
export async function POST(request:Request,context:{params:Promise<{eventId:string;milestoneId:string}>}) {return endpoint(request,async(user)=>{const p=await context.params;return studentWork(user,p.eventId,p.milestoneId,await body(request),true);},"STUDENT",201);}
export async function GET(request:Request,context:{params:Promise<{eventId:string;milestoneId:string}>}) {return endpoint(request,async(user)=>{const p=await context.params;const s=await transaction((tx)=>workspace(user,tx));return {submissions:Object.values(s.learning.submissions??{}).filter((item)=>item.eventId===p.eventId&&item.milestoneId===p.milestoneId)};});}
