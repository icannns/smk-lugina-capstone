import { endpoint,body } from "@/server/domain/common";
import { survey } from "@/server/domain/learning";
export async function POST(request:Request,context:{params:Promise<{eventId:string;milestoneId:string}>}){return endpoint(request,async(user)=>{const p=await context.params;return survey(user,p.eventId,p.milestoneId,await body(request),false);},"STUDENT",201);}
export async function PUT(request:Request,context:{params:Promise<{eventId:string;milestoneId:string}>}){return endpoint(request,async(user)=>{const p=await context.params;return survey(user,p.eventId,p.milestoneId,await body(request),true);},"STUDENT");}
