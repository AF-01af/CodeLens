// The browser session cookie is the normal identity source. x-user-id remains
// available for local API development and integration walkthroughs.

import { cookies, headers } from "next/headers";
import { readSessionToken } from "./session";

export async function currentUserId(): Promise<string> {
  const h = await headers();
  const cookieStore = await cookies();
  const cookie = cookieStore.get("codelens-user-id")?.value;
  const id = readSessionToken(cookie) ?? (process.env.NODE_ENV !== "production" ?
    (h.get("x-user-id") ?? cookie ?? process.env.DEV_USER_ID) : null);
  if (!id) throw new Error("Authentication required");
  return id;
}
