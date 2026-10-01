import { prisma } from "@project/db";
import { DomainError } from "./errors";
import type { UserRole } from "./schemas";

export type Viewer = { id: string; name: string; email: string; role: UserRole };

// Resolves the identity from the auth stub to a real user row.
// An id with no matching user is treated as signed out.
export async function requireViewer(userId: string): Promise<Viewer> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new DomainError(401, "UNAUTHENTICATED", "No user matches the current identity");
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role === "PROFESSOR" ? "PROFESSOR" : "STUDENT",
  };
}

export function requireRole(viewer: Viewer, role: UserRole): void {
  if (viewer.role !== role) {
    throw new DomainError(403, "FORBIDDEN_ROLE", `Only a ${role} can do this`);
  }
}
