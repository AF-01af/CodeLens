import { prisma } from "@project/db";
import { notFound } from "./errors";
import type { CreateAssignmentInput } from "./schemas";
import { requireRole, requireViewer, type Viewer } from "./users";

type AssignmentRow = {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  professorId: string;
  createdAt: Date;
};

export const toAssignment = (a: AssignmentRow) => ({
  id: a.id,
  title: a.title,
  description: a.description,
  dueDate: a.dueDate.toISOString(),
  professorId: a.professorId,
  createdAt: a.createdAt.toISOString(),
});

// No courses yet: students see every assignment, professors see their own.
const visibleTo = (viewer: Viewer) =>
  viewer.role === "PROFESSOR" ? { professorId: viewer.id } : {};

export async function createAssignment(userId: string, input: CreateAssignmentInput) {
  const viewer = await requireViewer(userId);
  requireRole(viewer, "PROFESSOR");
  const assignment = await prisma.assignment.create({
    data: { ...input, professorId: viewer.id },
  });
  return toAssignment(assignment);
}

export async function listAssignments(userId: string) {
  const viewer = await requireViewer(userId);
  const rows = await prisma.assignment.findMany({
    where: visibleTo(viewer),
    orderBy: { dueDate: "asc" },
  });
  return rows.map(toAssignment);
}

export async function findVisibleAssignment(viewer: Viewer, id: string) {
  const assignment = await prisma.assignment.findFirst({ where: { id, ...visibleTo(viewer) } });
  if (!assignment) throw notFound("Assignment");
  return assignment;
}

export async function getAssignment(userId: string, id: string) {
  const viewer = await requireViewer(userId);
  return toAssignment(await findVisibleAssignment(viewer, id));
}
