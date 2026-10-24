import { ZodError } from "zod";

export class DomainError extends Error {
  constructor(
    readonly status: 400 | 401 | 403 | 404 | 409,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export const notFound = (what: string) =>
  new DomainError(404, "NOT_FOUND", `${what} was not found`);

export type ApiError = {
  status: number;
  body: { error: { code: string; message: string } };
};

function prismaCode(err: unknown): string | undefined {
  if (typeof err === "object" && err !== null && "code" in err) {
    const code = (err as { code: unknown }).code;
    return typeof code === "string" && code.startsWith("P") ? code : undefined;
  }
  return undefined;
}

// Maps anything thrown by a route into the one error shape from docs/specs/web.md.
// Returns undefined for unexpected errors so the caller can log them and send a 500.
export function toApiError(err: unknown): ApiError | undefined {
  const shape = (status: number, code: string, message: string): ApiError => ({
    status,
    body: { error: { code, message } },
  });

  if (err instanceof DomainError) return shape(err.status, err.code, err.message);
  if (err instanceof ZodError) {
    const message = err.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; ");
    return shape(400, "VALIDATION_ERROR", message);
  }
  if (err instanceof SyntaxError) return shape(400, "INVALID_JSON", "Request body is not valid JSON");

  const code = prismaCode(err);
  if (code === "P2002") return shape(409, "CONFLICT", "That record already exists");
  if (code === "P2025") return shape(404, "NOT_FOUND", "Record was not found");
  return undefined;
}
