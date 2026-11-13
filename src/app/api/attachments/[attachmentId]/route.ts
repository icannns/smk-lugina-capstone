import { z } from "zod";
import { endpoint, body } from "@/server/domain/common";
import { removeUpload } from "@/server/files/service";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ attachmentId: string }> },
) {
  return endpoint(
    request,
    async (user) => {
      const input = z
        .object({ expectedVersion: z.number().int().nonnegative() })
        .strict()
        .parse(await body(request));
      return removeUpload(
        user,
        (await context.params).attachmentId,
        input.expectedVersion,
      );
    },
    "STUDENT",
  );
}
