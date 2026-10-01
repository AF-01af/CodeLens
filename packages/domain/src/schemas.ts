import { z } from "zod";

export const UserRole = z.enum(["STUDENT", "PROFESSOR"]);
export type UserRole = z.infer<typeof UserRole>;

export const ReviewStatus = z.enum(["DRAFT", "SUBMITTED"]);
export type ReviewStatus = z.infer<typeof ReviewStatus>;

export const CreateAssignment = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1),
  dueDate: z.coerce.date(),
});
export type CreateAssignmentInput = z.infer<typeof CreateAssignment>;

export const CreateSubmission = z.object({
  code: z.string().min(1).max(200_000),
});
export type CreateSubmissionInput = z.infer<typeof CreateSubmission>;

export const CreateReview = z.object({
  content: z.string().trim().min(1).max(20_000),
  status: ReviewStatus.default("SUBMITTED"),
});
export type CreateReviewInput = z.infer<typeof CreateReview>;
