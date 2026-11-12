import { endpoint,body } from "@/server/domain/common";
import { assess } from "@/server/domain/learning";
export async function PUT(request:Request,context:{params:Promise<{submissionId:string}>}){return endpoint(request,async(user)=>assess(user,(await context.params).submissionId,await body(request)),"TEACHER");}
