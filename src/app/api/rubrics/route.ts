import { endpoint,body,transaction } from "@/server/domain/common";
import { writeRubric } from "@/server/domain/events";
import { workspace } from "@/server/domain/workspace";
export async function GET(request:Request){return endpoint(request,async(user)=>({rubrics:Object.values((await transaction((tx)=>workspace(user,tx))).rubrics)}),"TEACHER");}
export async function POST(request:Request){return endpoint(request,async(user)=>writeRubric(user,await body(request),true),"TEACHER",201);}
