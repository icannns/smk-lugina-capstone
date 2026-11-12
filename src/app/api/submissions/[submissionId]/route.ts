import { endpoint,transaction } from "@/server/domain/common";
import { workspace } from "@/server/domain/workspace";
import { AuthorizationError } from "@/server/auth/authorization";
export async function GET(request:Request,context:{params:Promise<{submissionId:string}>}){return endpoint(request,async(user)=>{const {submissionId}=await context.params;const s=await transaction((tx)=>workspace(user,tx));const submission=s.learning.submissions?.[submissionId];if(!submission)throw new AuthorizationError(403,"FORBIDDEN");return {submission,assessments:Object.values(s.learning.assessments).filter((a)=>a.submissionId===submissionId),feedback:s.learning.feedback[submissionId]??[]};});}
