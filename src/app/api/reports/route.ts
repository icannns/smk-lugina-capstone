import { endpoint,transaction } from "@/server/domain/common";
import { workspace } from "@/server/domain/workspace";
import { reportRows,emptyReportFilters } from "@/lib/guru/report-selectors";
import { AuthorizationError } from "@/server/auth/authorization";
export async function GET(request:Request){return endpoint(request,async(user)=>{const s=await transaction((tx)=>workspace(user,tx));const p=new URL(request.url).searchParams;const selected=p.get("event");if(selected&&!s.published[selected])throw new AuthorizationError(403,"FORBIDDEN");const filters={...emptyReportFilters,...Object.fromEntries(["student","work","assessment","milestone","survey"].flatMap((key)=>p.has(key)?[[key,p.get(key)!]]:[]))};return {reports:Object.values(s.published).filter((event)=>!selected||event.id===selected).map((event)=>({eventId:event.id,...reportRows(event,s.learning,s.rubrics[event.rubricId??""],filters)}))};},"TEACHER");}
