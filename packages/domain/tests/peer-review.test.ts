import { beforeAll, describe, expect, it } from "vitest";

// Real Postgres engine in-process (PGlite) with the real migrations applied.
process.env.PGLITE_DATA_DIR = "memory://";
delete process.env.DATABASE_URL;

type Domain = typeof import("../src/index");
let d: Domain;

const PROF = "prof";
const OTHER_PROF = "other-prof";
const A = "student-a";
const B = "student-b";
const future = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

async function expectError(promise: Promise<unknown>, status: number, code: string) {
  const err = await promise.then(
    () => undefined,
    (e: unknown) => e,
  );
  expect(err, `expected ${status} ${code}`).toBeDefined();
  expect(d.toApiError(err)).toMatchObject({ status, body: { error: { code } } });
}

async function newAssignment(dueDate = future()) {
  return d.createAssignment(PROF, { title: "Linked list", description: "Implement it.", dueDate });
}

beforeAll(async () => {
  const { prisma } = await import("@project/db");
  d = await import("../src/index");
  await prisma.user.createMany({
    data: [
      { id: PROF, name: "Prof", email: "prof@test.dev", role: "PROFESSOR" },
      { id: OTHER_PROF, name: "Other", email: "other@test.dev", role: "PROFESSOR" },
      { id: A, name: "A", email: "a@test.dev", role: "STUDENT" },
      { id: B, name: "B", email: "b@test.dev", role: "STUDENT" },
    ],
  });
}, 30_000);

describe("assignments", () => {
  it("a professor creates an assignment they own", async () => {
    const a = await newAssignment();
    expect(a.professorId).toBe(PROF);
    expect(await d.getAssignment(PROF, a.id)).toMatchObject({ id: a.id, title: "Linked list" });
  });

  it("a student cannot create an assignment", async () => {
    await expectError(
      d.createAssignment(A, { title: "x", description: "y", dueDate: future() }),
      403,
      "FORBIDDEN_ROLE",
    );
  });

  it("another professor's assignment is 404, not 403", async () => {
    const a = await newAssignment();
    await expectError(d.getAssignment(OTHER_PROF, a.id), 404, "NOT_FOUND");
  });

  it("an unknown identity is 401", async () => {
    await expectError(d.listAssignments("nobody"), 401, "UNAUTHENTICATED");
  });

  it("an invalid body is a 400 validation error", () => {
    const result = d.CreateAssignment.safeParse({ title: "", description: "d", dueDate: "soon" });
    expect(result.success).toBe(false);
    expect(d.toApiError(result.error)).toMatchObject({
      status: 400,
      body: { error: { code: "VALIDATION_ERROR" } },
    });
  });
});

describe("submissions", () => {
  it("a student submits once; a second submission is 409", async () => {
    const a = await newAssignment();
    const s = await d.createSubmission(A, a.id, { code: "class LinkedList {}" });
    expect(s).toMatchObject({ assignmentId: a.id, studentId: A, code: "class LinkedList {}" });
    await expectError(d.createSubmission(A, a.id, { code: "again" }), 409, "DUPLICATE_SUBMISSION");
  });

  it("submitting after the due date is 409", async () => {
    const a = await newAssignment(new Date(Date.now() - 60_000));
    await expectError(d.createSubmission(A, a.id, { code: "late" }), 409, "ASSIGNMENT_CLOSED");
  });

  it("a professor cannot submit", async () => {
    const a = await newAssignment();
    await expectError(d.createSubmission(PROF, a.id, { code: "x" }), 403, "FORBIDDEN_ROLE");
  });

  it("students only list their own submissions; the professor lists all", async () => {
    const a = await newAssignment();
    await d.createSubmission(A, a.id, { code: "a" });
    await d.createSubmission(B, a.id, { code: "b" });
    expect((await d.listSubmissions(A, a.id)).map((s) => s.studentId)).toEqual([A]);
    expect(await d.listSubmissions(PROF, a.id)).toHaveLength(2);
  });

  it("a missing submission is 404", async () => {
    await expectError(d.getSubmission(PROF, "does-not-exist"), 404, "NOT_FOUND");
  });
});

describe("reviews", () => {
  it("full flow: B reviews A's submission, anonymously to A", async () => {
    const a = await newAssignment();
    const s = await d.createSubmission(A, a.id, { code: "class LinkedList {}" });

    await expectError(d.getSubmission(B, s.id), 404, "NOT_FOUND");

    const r = await d.createReview(B, s.id, { content: "Null head not handled.", status: "SUBMITTED" });
    expect(r).toMatchObject({ submissionId: s.id, reviewerId: B, status: "SUBMITTED" });
    expect(r.submittedAt).not.toBeNull();

    expect(await d.getSubmission(B, s.id)).toMatchObject({ id: s.id });

    const forAuthor = await d.listReviews(A, s.id);
    expect(forAuthor).toHaveLength(1);
    expect(forAuthor[0].reviewerId).toBeNull();

    const forProfessor = await d.listReviews(PROF, s.id);
    expect(forProfessor[0].reviewerId).toBe(B);

    expect(await d.getReview(A, r.id)).toMatchObject({ id: r.id, reviewerId: null });
    await expectError(d.getReview(OTHER_PROF, r.id), 404, "NOT_FOUND");
  });

  it("a student cannot review their own submission", async () => {
    const a = await newAssignment();
    const s = await d.createSubmission(A, a.id, { code: "x" });
    await expectError(
      d.createReview(A, s.id, { content: "Looks great!", status: "SUBMITTED" }),
      403,
      "SELF_REVIEW_NOT_ALLOWED",
    );
  });

  it("reviewing the same submission twice is 409", async () => {
    const a = await newAssignment();
    const s = await d.createSubmission(A, a.id, { code: "x" });
    await d.createReview(B, s.id, { content: "First", status: "DRAFT" });
    await expectError(
      d.createReview(B, s.id, { content: "Second", status: "SUBMITTED" }),
      409,
      "DUPLICATE_REVIEW",
    );
  });

  it("a professor cannot write a peer review", async () => {
    const a = await newAssignment();
    const s = await d.createSubmission(A, a.id, { code: "x" });
    await expectError(
      d.createReview(PROF, s.id, { content: "x", status: "SUBMITTED" }),
      403,
      "FORBIDDEN_ROLE",
    );
  });
});
