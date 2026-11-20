import { z } from "zod";

export const UserRole = z.enum(["STUDENT", "PROFESSOR"]);
export type UserRole = z.infer<typeof UserRole>;

export const ReviewStatus = z.enum(["DRAFT", "SUBMITTED"]);
export type ReviewStatus = z.infer<typeof ReviewStatus>;

export const CreateAssignment = z
  .object({
    courseId: z.string().min(1),
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().min(1),
    dueDate: z.coerce.date(),
    reviewDueDate: z.coerce.date().optional(),
  })
  .refine(
    (a) => a.reviewDueDate === undefined || a.reviewDueDate.getTime() > a.dueDate.getTime(),
    { message: "reviewDueDate must be after dueDate", path: ["reviewDueDate"] },
  );
export type CreateAssignmentInput = z.infer<typeof CreateAssignment>;

export const CreateCourse = z.object({
  name: z.string().trim().min(1).max(200),
});
export type CreateCourseInput = z.infer<typeof CreateCourse>;

export const JoinCourse = z.object({
  code: z
    .string()
    .min(1)
    .max(32)
    .transform((s) => s.replace(/[\s-]/g, "").toUpperCase()),
});
export type JoinCourseInput = z.infer<typeof JoinCourse>;

export const CreateSubmission = z.object({
  code: z.string().min(1).max(200_000),
});
export type CreateSubmissionInput = z.infer<typeof CreateSubmission>;

export const CreateReview = z.object({
  content: z.string().trim().min(1).max(20_000),
  status: ReviewStatus.default("SUBMITTED"),
});
export type CreateReviewInput = z.infer<typeof CreateReview>;

export const PatchReview = z
  .object({
    content: z.string().trim().min(1).max(20_000).optional(),
    status: ReviewStatus.optional(),
  })
  .refine((review) => review.content !== undefined || review.status !== undefined, {
    message: "At least one review field must be provided",
  });
export type PatchReviewInput = z.infer<typeof PatchReview>;
