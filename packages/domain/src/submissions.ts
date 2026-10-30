import { prisma } from "@project/db";
import { DomainError, notFound } from "./errors";
import { findVisibleAssignment } from "./assignments";
import type { CreateSubmissionInput } from "./schemas";
import { MAX_REVIEWERS_PER_SUBMISSION } from "./review-policy";
import { requireRole, requireViewer, type Viewer } from "./users";

type SubmissionRow = {
  id: string;
  assignmentId: string;
  userId: string;
  codeFileContent: string;
  submittedAt: Date;
};

const toSubmission = (s: SubmissionRow) => ({
  id: s.id,
  assignmentId: s.assignmentId,
  studentId: s.userId,
  code: s.codeFileContent,
  submittedAt: s.submittedAt.toISOString(),
});

// A submission is visible to its author, the assignment's professor,
// and any student paired to review it. Everyone else gets 404.
export async function findVisibleSubmission(viewer: Viewer, id: string) {
  const submission = await prisma.submission.findFirst({
    where: {
      id,
      OR: [
        { userId: viewer.id },
        { assignment: { professorId: viewer.id } },
        { pairings: { some: { reviewerId: viewer.id } } },
      ],
    },
    include: { assignment: { select: { professorId: true } } },
  });
  if (!submission) throw notFound("Submission");
  return submission;
}

export async function createSubmission(
  userId: string,
  assignmentId: string,
  input: CreateSubmissionInput,
) {
  const viewer = await requireViewer(userId);
  requireRole(viewer, "STUDENT");
  const assignment = await findVisibleAssignment(viewer, assignmentId);

  if (assignment.dueDate.getTime() < Date.now()) {
    throw new DomainError(409, "ASSIGNMENT_CLOSED", "This assignment is past its due date");
  }
  const existing = await prisma.submission.findUnique({
    where: { assignmentId_userId: { assignmentId, userId: viewer.id } },
  });
  if (existing) {
    throw new DomainError(409, "DUPLICATE_SUBMISSION", "You already submitted this assignment");
  }

  const submission = await prisma.submission.create({
    data: { assignmentId, userId: viewer.id, codeFileContent: input.code },
  });
  return toSubmission(submission);
}

// The professor sees every submission for their assignment; a student sees only their own.
export async function listSubmissions(userId: string, assignmentId: string) {
  const viewer = await requireViewer(userId);
  await findVisibleAssignment(viewer, assignmentId);
  const rows = await prisma.submission.findMany({
    where: { assignmentId, ...(viewer.role === "STUDENT" ? { userId: viewer.id } : {}) },
    orderBy: { submittedAt: "asc" },
  });
  return rows.map(toSubmission);
}

// Students can discover anonymous submissions they have not reviewed yet.
// The author identity and source stay hidden until a review pairing is created.
export async function listReviewCandidates(userId: string, assignmentId: string) {
  const viewer = await requireViewer(userId);
  requireRole(viewer, "STUDENT");
  const assignment = await findVisibleAssignment(viewer, assignmentId);
  const ownSubmission = await prisma.submission.findUnique({
    where: { assignmentId_userId: { assignmentId, userId: viewer.id } },
    select: { id: true },
  });
  if (!ownSubmission) return [];
  if (assignment.dueDate.getTime() <= Date.now()) return [];

  const rows = await prisma.submission.findMany({
    where: {
      assignmentId,
      userId: { not: viewer.id },
      pairings: { none: { reviewerId: viewer.id } },
    },
    select: { id: true, submittedAt: true, _count: { select: { pairings: true } } },
    orderBy: { submittedAt: "asc" },
  });
  return rows
    .filter((row) => row._count.pairings < MAX_REVIEWERS_PER_SUBMISSION)
    .map((row) => ({ id: row.id, submittedAt: row.submittedAt.toISOString() }));
}

export async function getSubmission(userId: string, id: string) {
  const viewer = await requireViewer(userId);
  return toSubmission(await findVisibleSubmission(viewer, id));
}
