import { endpoint,body } from "@/server/domain/common";
import { createUiUx } from "@/server/assessments/ui-ux";
export async function POST(request:Request){return endpoint(request,async user=>createUiUx(user,await body(request)),"TEACHER",201);}
