import { prisma } from "@project/db";
import { DomainError, notFound } from "./errors";
import type { CreateReviewInput, PatchReviewInput } from "./schemas";
import { findVisibleAssignment } from "./assignments";
import { findVisibleSubmission } from "./submissions";
import { MAX_REVIEWERS_PER_SUBMISSION } from "./review-policy";
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

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

function alreadySubmitted(): DomainError {
  return new DomainError(409, "REVIEW_ALREADY_SUBMITTED", "You already submitted this review");
}

function reviewerLimitReached(): DomainError {
  return new DomainError(409, "REVIEW_LIMIT_REACHED", "This submission already has the maximum number of reviewers");
}

async function getReviewableSubmission(viewer: Viewer, submissionId: string) {
  const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
  if (!submission) throw notFound("Submission");

  // Apply the same assignment-visibility policy used by candidate listing and
  // other reads. Today that policy makes assignments visible to all students.
  const assignment = await findVisibleAssignment(viewer, submission.assignmentId);
  if (submission.userId === viewer.id) {
    throw new DomainError(403, "SELF_REVIEW_NOT_ALLOWED", "You cannot review your own submission");
  }
  const reviewerSubmission = await prisma.submission.findUnique({
    where: { assignmentId_userId: { assignmentId: submission.assignmentId, userId: viewer.id } },
    select: { id: true },
  });
  // There is no enrollment model yet. A student's own assignment submission
  // is the available proof that they participate in this assignment.
  if (!reviewerSubmission) throw notFound("Submission");
  if (assignment.dueDate.getTime() <= Date.now()) {
    throw new DomainError(409, "ASSIGNMENT_CLOSED", "The review deadline for this assignment has passed");
  }

  return submission;
}

// No automatic pairing yet: students choose from eligible candidates. Locking
// the submission row serializes claims so the reviewer cap and idempotent
// start behavior hold even when requests arrive at the same time.
export async function createReview(userId: string, submissionId: string, input: CreateReviewInput) {
  const viewer = await requireViewer(userId);
  requireRole(viewer, "STUDENT");
  const submission = await getReviewableSubmission(viewer, submissionId);

  try {
    const review = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Submission" WHERE "id" = ${submissionId} FOR UPDATE`;

      const existing = await tx.reviewPairing.findUnique({
        where: { submissionId_reviewerId: { submissionId, reviewerId: viewer.id } },
      });
      if (existing) {
        throw new DomainError(409, "DUPLICATE_REVIEW", "You already reviewed this submission");
      }

      const reviewerCount = await tx.reviewPairing.count({ where: { submissionId } });
      if (reviewerCount >= MAX_REVIEWERS_PER_SUBMISSION) throw reviewerLimitReached();

      const pairing = await tx.reviewPairing.create({
        data: { assignmentId: submission.assignmentId, submissionId, reviewerId: viewer.id },
      });
      return tx.review.create({
        data: { pairingId: pairing.id, content: input.content, status: input.status },
        include: withPairing,
      });
    });
    return toReview(viewer, review);
  } catch (error) {
    // A second concurrent createReview may observe the unique index before its
    // preflight query. Keep the public duplicate-review response stable.
    if (isUniqueConstraintError(error)) {
      throw new DomainError(409, "DUPLICATE_REVIEW", "You already reviewed this submission");
    }
    throw error;
  }
}

// Claim a submission by creating an empty draft pairing before revealing code.
// A retry returns the existing draft, while a completed review remains locked.
export async function startReview(userId: string, submissionId: string) {
  const viewer = await requireViewer(userId);
  requireRole(viewer, "STUDENT");
  const submission = await getReviewableSubmission(viewer, submissionId);

  try {
    const review = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Submission" WHERE "id" = ${submissionId} FOR UPDATE`;

      const existing = await tx.reviewPairing.findUnique({
        where: { submissionId_reviewerId: { submissionId, reviewerId: viewer.id } },
        include: { review: { include: withPairing } },
      });
      if (existing?.review) {
        if (existing.review.status === "SUBMITTED") throw alreadySubmitted();
        return existing.review;
      }

      // A legacy/incomplete pairing already reserves one reviewer slot.
      if (!existing) {
        const reviewerCount = await tx.reviewPairing.count({ where: { submissionId } });
        if (reviewerCount >= MAX_REVIEWERS_PER_SUBMISSION) throw reviewerLimitReached();
      }

      const pairing = existing ?? await tx.reviewPairing.create({
        data: { assignmentId: submission.assignmentId, submissionId, reviewerId: viewer.id },
      });
      return tx.review.create({
        data: { pairingId: pairing.id, content: "", status: "DRAFT" },
        include: withPairing,
      });
    });
    return toReview(viewer, review);
  } catch (error) {
    // If the same reviewer raced us before the row lock was acquired (for
    // example against an older writer), treat an existing draft as a retry.
    if (isUniqueConstraintError(error)) {
      const existing = await prisma.reviewPairing.findUnique({
        where: { submissionId_reviewerId: { submissionId, reviewerId: viewer.id } },
        include: { review: { include: withPairing } },
      });
      if (existing?.review) {
        if (existing.review.status === "SUBMITTED") throw alreadySubmitted();
        return toReview(viewer, existing.review);
      }
    }
    throw error;
  }
}

export async function updateReview(userId: string, id: string, input: PatchReviewInput) {
  const viewer = await requireViewer(userId);
  requireRole(viewer, "STUDENT");

  const review = await prisma.review.findFirst({
    where: { id, pairing: { reviewerId: viewer.id } },
    select: {
      id: true,
      status: true,
      pairing: { select: { assignment: { select: { dueDate: true } } } },
    },
  });
  if (!review) throw notFound("Review");
  if (review.status !== "DRAFT") {
    throw new DomainError(409, "REVIEW_ALREADY_SUBMITTED", "Submitted reviews cannot be changed");
  }
  if (review.pairing.assignment.dueDate.getTime() <= Date.now()) {
    throw new DomainError(409, "ASSIGNMENT_CLOSED", "The review deadline for this assignment has passed");
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
