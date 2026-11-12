import { endpoint,body,fail,transaction } from "@/server/domain/common";
import { writeRubric } from "@/server/domain/events";
import { workspace } from "@/server/domain/workspace";
import { AuthorizationError } from "@/server/auth/authorization";
export async function GET(request:Request,context:{params:Promise<{rubricId:string}>}){return endpoint(request,async(user)=>{const {rubricId}=await context.params;const s=await transaction((tx)=>workspace(user,tx));const rubric=s.rubrics[rubricId];if(!rubric)throw new AuthorizationError(403,"FORBIDDEN");return {rubric};},"TEACHER");}
export async function PUT(request:Request,context:{params:Promise<{rubricId:string}>}){return endpoint(request,async(user)=>{const {rubricId}=await context.params;const raw=await body(request);if(!raw||typeof raw!=="object"||!("id"in raw)||raw.id!==rubricId)fail("ID path dan body berbeda.");return writeRubric(user,raw,false);},"TEACHER");}
