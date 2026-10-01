import { prisma } from "@project/db";
import { DomainError, notFound } from "./errors";
import type { CreateReviewInput } from "./schemas";
import { findVisibleSubmission } from "./submissions";
import { requireRole, requireViewer, type Viewer } from "./users";

type ReviewWithPairing = {
  id: string;
  content: string;
  status: string;
  submittedAt: Date;
  createdAt: Date;
  pairing: { submissionId: string; reviewerId: string; submission: { userId: string } };
};

// Peer review is anonymous: the author of the submission never sees who reviewed it.
const toReview = (viewer: Viewer, r: ReviewWithPairing) => ({
  id: r.id,
  submissionId: r.pairing.submissionId,
  reviewerId: r.pairing.submission.userId === viewer.id ? null : r.pairing.reviewerId,
  content: r.content,
  status: r.status,
  submittedAt: r.status === "SUBMITTED" ? r.submittedAt.toISOString() : null,
  createdAt: r.createdAt.toISOString(),
});

const withPairing = {
  pairing: {
    select: { submissionId: true, reviewerId: true, submission: { select: { userId: true } } },
  },
} as const;

// No automatic pairing yet: any student other than the author can review a
// submission, and writing the review creates the pairing in the same transaction.
export async function createReview(userId: string, submissionId: string, input: CreateReviewInput) {
  const viewer = await requireViewer(userId);
  requireRole(viewer, "STUDENT");

  const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
  if (!submission) throw notFound("Submission");
  if (submission.userId === viewer.id) {
    throw new DomainError(403, "SELF_REVIEW_NOT_ALLOWED", "You cannot review your own submission");
  }
  const existing = await prisma.reviewPairing.findUnique({
    where: { submissionId_reviewerId: { submissionId, reviewerId: viewer.id } },
  });
  if (existing) {
    throw new DomainError(409, "DUPLICATE_REVIEW", "You already reviewed this submission");
  }

  const review = await prisma.$transaction(async (tx) => {
    const pairing = await tx.reviewPairing.create({
      data: { assignmentId: submission.assignmentId, submissionId, reviewerId: viewer.id },
    });
    return tx.review.create({
      data: { pairingId: pairing.id, content: input.content, status: input.status },
      include: withPairing,
    });
  });
  return toReview(viewer, review);
}

// The author and the professor see every review; a reviewer sees only their own.
export async function listReviews(userId: string, submissionId: string) {
  const viewer = await requireViewer(userId);
  const submission = await findVisibleSubmission(viewer, submissionId);
  const seesAll =
    submission.userId === viewer.id || submission.assignment.professorId === viewer.id;

  const rows = await prisma.review.findMany({
    where: { pairing: { submissionId, ...(seesAll ? {} : { reviewerId: viewer.id }) } },
    include: withPairing,
    orderBy: { createdAt: "asc" },
  });
  return rows.map((r) => toReview(viewer, r));
}

export async function getReview(userId: string, id: string) {
  const viewer = await requireViewer(userId);
  const review = await prisma.review.findFirst({
    where: {
      id,
      OR: [
        { pairing: { reviewerId: viewer.id } },
        { pairing: { submission: { userId: viewer.id } } },
        { pairing: { assignment: { professorId: viewer.id } } },
      ],
    },
    include: withPairing,
  });
  if (!review) throw notFound("Review");
  return toReview(viewer, review);
}
