import { endpoint } from "@/server/domain/common";
import { serveUpload } from "@/server/files/service";

export async function GET(
  request: Request,
  context: { params: Promise<{ attachmentId: string }> },
) {
  return endpoint(request, async (user) =>
    serveUpload(user, (await context.params).attachmentId, request, true),
  );
}
