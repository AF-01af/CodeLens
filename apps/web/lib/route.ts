import { toApiError } from "@project/domain";
import { log } from "@project/log";

export function errorResponse(err: unknown): Response {
  const mapped = toApiError(err);
  if (mapped) return Response.json(mapped.body, { status: mapped.status });
  log.error({ err: String(err) }, "unhandled route error");
  return Response.json(
    { error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
    { status: 500 },
  );
}
