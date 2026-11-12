import { z } from "zod";
import { endpoint, body, fail, transaction } from "@/server/domain/common";
import { eventBody, writeEvent, deleteDraft } from "@/server/domain/events";
import { workspace } from "@/server/domain/workspace";
import { AuthorizationError } from "@/server/auth/authorization";
type Context = { params: Promise<{ eventId: string }> };
export async function GET(request: Request, context: Context) { return endpoint(request, async (user) => { const {eventId}=await context.params;const s=await transaction((tx)=>workspace(user,tx));const event=s.published[eventId]??s.saved[eventId];if(!event)throw new AuthorizationError(403,"FORBIDDEN");return {event}; }); }
export async function PUT(request: Request, context: Context) { return endpoint(request, async (user) => { const {eventId}=await context.params; const {event}=eventBody.parse(await body(request));if(event.id!==eventId)fail("ID path dan body berbeda.");return writeEvent(user,event,"update"); },"TEACHER"); }
export async function DELETE(request: Request, context: Context) { return endpoint(request, async (user) => {const {eventId}=await context.params;const expected=z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().nonnegative()).parse(new URL(request.url).searchParams.get("revision"));return deleteDraft(user,eventId,expected);},"TEACHER"); }
