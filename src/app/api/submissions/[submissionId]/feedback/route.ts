import { endpoint,body } from "@/server/domain/common";
import { feedback } from "@/server/domain/learning";
export async function POST(request:Request,context:{params:Promise<{submissionId:string}>}){return endpoint(request,async(user)=>feedback(user,(await context.params).submissionId,await body(request)),"TEACHER",201);}
