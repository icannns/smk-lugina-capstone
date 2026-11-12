import { endpoint, body, fail } from "@/server/domain/common";
import { eventBody, writeEvent } from "@/server/domain/events";
export async function POST(request: Request, context: {params:Promise<{eventId:string}>}) {return endpoint(request,async(user)=>{const {eventId}=await context.params;const {event}=eventBody.parse(await body(request));if(event.id!==eventId)fail("ID path dan body berbeda.");return writeEvent(user,event,"publish");},"TEACHER");}
