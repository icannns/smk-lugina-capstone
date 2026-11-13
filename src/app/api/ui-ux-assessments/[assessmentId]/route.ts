import { endpoint,body } from "@/server/domain/common";
import { readUiUx,patchUiUx } from "@/server/assessments/ui-ux";
type Context={params:Promise<{assessmentId:string}>};
export async function GET(request:Request,context:Context){return endpoint(request,async user=>readUiUx(user,(await context.params).assessmentId,request));}
export async function PATCH(request:Request,context:Context){return endpoint(request,async user=>patchUiUx(user,(await context.params).assessmentId,await body(request)),"TEACHER");}
