import { NextResponse } from "next/server";
import { prisma } from "@project/db";
import { createSessionToken, hashPassword } from "@project/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const username = typeof body?.username === "string" ? body.username.trim().toLowerCase() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (name.length < 2 || name.length > 100 || !/^[a-z0-9._-]{3,30}$/.test(username) || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8 || password.length > 128) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Enter a name, valid email, username (3–30 characters), and password (8–128 characters)." } }, { status: 400 });
  }
  try {
    const user = await prisma.user.create({
      data: { name, username, email, passwordHash: hashPassword(password), role: "STUDENT" },
    });
    const response = NextResponse.json({ ok: true });
    response.cookies.set("codelens-user-id", createSessionToken(user.id), {
      httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
      path: "/", maxAge: 60 * 60 * 8,
    });
    return response;
  } catch (error) {
    if ((error as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: { code: "ACCOUNT_EXISTS", message: "That username or email is already registered." } }, { status: 409 });
    }
    throw error;
  }
}
