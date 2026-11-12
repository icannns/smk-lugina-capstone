import { z } from "zod";
import { endpoint, body, milestoneInput, revision, transaction } from "@/server/domain/common";
import { writeEvent } from "@/server/domain/events";
import { workspace } from "@/server/domain/workspace";
import { AuthorizationError } from "@/server/auth/authorization";
export async function GET(request:Request,context:{params:Promise<{eventId:string}>}){return endpoint(request,async(user)=>{const {eventId}=await context.params;const s=await transaction((tx)=>workspace(user,tx));const e=s.published[eventId]??s.saved[eventId];if(!e)throw new AuthorizationError(403,"FORBIDDEN");return {milestones:e.milestones};});}
export async function PUT(request:Request,context:{params:Promise<{eventId:string}>}){return endpoint(request,async(user)=>{const {eventId}=await context.params;const input=z.object({milestones:z.array(milestoneInput).max(30),expectedRevision:revision}).strict().parse(await body(request));const s=await transaction((tx)=>workspace(user,tx));const e=s.published[eventId]??s.saved[eventId];if(!e)throw new AuthorizationError(403,"FORBIDDEN");return writeEvent(user,{...e,milestones:input.milestones,revision:input.expectedRevision},"update");},"TEACHER");}
