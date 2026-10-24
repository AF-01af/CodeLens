import { prisma } from "@project/db";
import { DomainError, notFound } from "./errors";
import type { CreateReviewInput, PatchReviewInput } from "./schemas";
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

// Claim a submission by creating an empty draft pairing before revealing code.
// A retry returns the existing draft, while a completed review remains locked.
export async function startReview(userId: string, submissionId: string) {
  const viewer = await requireViewer(userId);
  requireRole(viewer, "STUDENT");

  const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
  if (!submission) throw notFound("Submission");
  if (submission.userId === viewer.id) {
    throw new DomainError(403, "SELF_REVIEW_NOT_ALLOWED", "You cannot review your own submission");
  }

  const existing = await prisma.reviewPairing.findUnique({
    where: { submissionId_reviewerId: { submissionId, reviewerId: viewer.id } },
    include: { review: { include: withPairing } },
  });
  if (existing?.review) {
    if (existing.review.status === "SUBMITTED") {
      throw new DomainError(409, "REVIEW_ALREADY_SUBMITTED", "You already submitted this review");
    }
    return toReview(viewer, existing.review);
  }

  const review = await prisma.$transaction(async (tx) => {
    const pairing = existing ?? await tx.reviewPairing.create({
      data: { assignmentId: submission.assignmentId, submissionId, reviewerId: viewer.id },
    });
    return tx.review.create({
      data: { pairingId: pairing.id, content: "", status: "DRAFT" },
      include: withPairing,
    });
  });
  return toReview(viewer, review);
}

export async function updateReview(userId: string, id: string, input: PatchReviewInput) {
  const viewer = await requireViewer(userId);
  requireRole(viewer, "STUDENT");

  const review = await prisma.review.findFirst({
    where: { id, pairing: { reviewerId: viewer.id } },
    select: { id: true, status: true },
  });
  if (!review) throw notFound("Review");
  if (review.status !== "DRAFT") {
    throw new DomainError(409, "REVIEW_ALREADY_SUBMITTED", "Submitted reviews cannot be changed");
  }

  const updated = await prisma.review.update({
    where: { id: review.id },
    data: {
      ...(input.content === undefined ? {} : { content: input.content }),
      ...(input.status === undefined ? {} : { status: input.status }),
      ...(input.status === "SUBMITTED" ? { submittedAt: new Date() } : {}),
    },
    include: withPairing,
  });
  return toReview(viewer, updated);
}

// A reviewer sees their own review, drafts included. The author and the
// professor only see reviews that have been submitted.
export async function listReviews(userId: string, submissionId: string) {
  const viewer = await requireViewer(userId);
  await findVisibleSubmission(viewer, submissionId);

  const rows = await prisma.review.findMany({
    where: {
      pairing: { submissionId },
      OR: [
        { pairing: { reviewerId: viewer.id } },
        { status: "SUBMITTED", pairing: { submission: { userId: viewer.id } } },
        { status: "SUBMITTED", pairing: { assignment: { professorId: viewer.id } } },
      ],
    },
    include: withPairing,
    orderBy: { createdAt: "asc" },
  });
  return rows.map((r) => toReview(viewer, r));
}

export async function listMyReviews(userId: string, assignmentId: string) {
  const viewer = await requireViewer(userId);
  requireRole(viewer, "STUDENT");

  const rows = await prisma.reviewPairing.findMany({
    where: { assignmentId, reviewerId: viewer.id, review: { isNot: null } },
    include: {
      review: { select: { id: true, status: true } },
      submission: { select: { submittedAt: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((row) => ({
    id: row.review!.id,
    submissionId: row.submissionId,
    status: row.review!.status as "DRAFT" | "SUBMITTED",
    submissionDate: row.submission.submittedAt.toISOString(),
  }));
}

export async function getReview(userId: string, id: string) {
  const viewer = await requireViewer(userId);
  const review = await prisma.review.findFirst({
    where: {
      id,
      OR: [
        { pairing: { reviewerId: viewer.id } },
        { status: "SUBMITTED", pairing: { submission: { userId: viewer.id } } },
        { status: "SUBMITTED", pairing: { assignment: { professorId: viewer.id } } },
      ],
    },
    include: withPairing,
  });
  if (!review) throw notFound("Review");
  return toReview(viewer, review);
}
