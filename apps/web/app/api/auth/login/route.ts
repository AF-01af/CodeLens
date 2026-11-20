import { NextResponse } from "next/server";
import { prisma } from "@project/db";
import { createSessionToken, verifyPassword } from "@project/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!username || !password) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Enter your username and password." } }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user?.passwordHash || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: { code: "INVALID_CREDENTIALS", message: "Incorrect username or password." } }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set("codelens-user-id", createSessionToken(user.id), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: "/", maxAge: 60 * 60 * 8,
  });
  return response;
}
