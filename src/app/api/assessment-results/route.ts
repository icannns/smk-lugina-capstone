import { endpoint } from "@/server/domain/common";
import { listResults } from "@/server/assessments/results";
export async function GET(request:Request){return endpoint(request,user=>listResults(user,request));}
