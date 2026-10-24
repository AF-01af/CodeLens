import { NextResponse } from "next/server";

const DEMO_USERS = new Set(["demo-user", "student-a", "student-b"]);

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_DEV_IDENTITY) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Not found" } },
      { status: 404 },
    );
  }

  let body: { userId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_JSON", message: "Request body must be JSON" } },
      { status: 400 },
    );
  }

  if (typeof body.userId !== "string" || !DEMO_USERS.has(body.userId)) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Choose a seeded demo account" } },
      { status: 400 },
    );
  }

  const response = NextResponse.json({ userId: body.userId });
  response.cookies.set("codelens-user-id", body.userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}
