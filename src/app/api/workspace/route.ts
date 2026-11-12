import { endpoint, transaction } from "@/server/domain/common";
import { workspace } from "@/server/domain/workspace";
export async function GET(request: Request) { return endpoint(request, (user) => transaction((tx) => workspace(user, tx))); }
