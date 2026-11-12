import { z } from "zod";
import { endpoint, body, transaction } from "@/server/domain/common";
import { eventBody, writeEvent } from "@/server/domain/events";
import { workspace } from "@/server/domain/workspace";
export async function GET(request: Request) {
 return endpoint(request, async (user) => { const state = await transaction((tx) => workspace(user, tx)); const p = z.object({ search:z.string().max(240).default(""), status:z.enum(["draft","upcoming","ongoing","ended"]).optional(), sort:z.enum(["title","updated","reference"]).default("updated"), page:z.coerce.number().int().min(1).default(1), pageSize:z.coerce.number().int().min(1).max(100).default(20) }).strict().parse(Object.fromEntries(new URL(request.url).searchParams));
 let events = [...Object.values(state.published), ...Object.values(state.saved)];
 if (p.status) events = events.filter((e) => e.status === p.status);
 const search = p.search.toLowerCase(); events = events.filter((e) => e.title.toLowerCase().includes(search));
 if (p.sort === "title") events.sort((a,b) => a.title.localeCompare(b.title));
 const page = p.page, size = p.pageSize;
 return { events: events.slice((page-1)*size,page*size), total: events.length, page, pageSize: size }; });
}
export async function POST(request: Request) { return endpoint(request, async (user) => writeEvent(user, eventBody.parse(await body(request)).event, "create"), "TEACHER", 201); }
