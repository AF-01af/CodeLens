import { createHmac, timingSafeEqual } from "node:crypto";

function secret() {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET must be configured in production");
  return "codelens-local-demo-session-secret";
}

export function createSessionToken(userId: string): string {
  const signature = createHmac("sha256", secret()).update(userId).digest("hex");
  return `${userId}.${signature}`;
}

export function readSessionToken(token: string | undefined): string | null {
  if (!token) return null;
  const separator = token.lastIndexOf(".");
  if (separator < 1) return null;
  const userId = token.slice(0, separator);
  const supplied = Buffer.from(token.slice(separator + 1), "hex");
  const expected = Buffer.from(createHmac("sha256", secret()).update(userId).digest("hex"), "hex");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected) ? userId : null;
}
