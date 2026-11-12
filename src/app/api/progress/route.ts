import { endpoint,transaction } from "@/server/domain/common";
import { workspace } from "@/server/domain/workspace";
import { eventLearning } from "@/lib/guru/learning-selectors";
export async function GET(request:Request){return endpoint(request,async(user)=>{const s=await transaction((tx)=>workspace(user,tx));return {events:Object.values(s.published).filter((e)=>user.role==="TEACHER"||s.learning.enrollments!.some((n)=>n.eventId===e.id)).map((event)=>({eventId:event.id,...eventLearning(event,s.learning,s.rubrics[event.rubricId??""])}))};});}
