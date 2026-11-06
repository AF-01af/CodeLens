import { randomInt } from "node:crypto";
import { prisma } from "@project/db";
import { DomainError, notFound } from "./errors";
import type { CreateCourseInput, JoinCourseInput } from "./schemas";
import { requireRole, requireViewer, type Viewer } from "./users";

// No I, L, O, 0 or 1 so codes are easy to read aloud and type.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;
const MAX_CODE_ATTEMPTS = 5;

export function generateJoinCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return code;
}

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

// Small in-memory limiter so join codes cannot be guessed quickly.
// Resets on server restart, which is fine for this project.
const JOIN_WINDOW_MS = 60_000;
const JOIN_MAX_ATTEMPTS = 10;
const joinAttempts = new Map<string, { count: number; resetAt: number }>();

function checkJoinRateLimit(userId: string): void {
  const now = Date.now();
  const entry = joinAttempts.get(userId);
  if (!entry || entry.resetAt <= now) {
    joinAttempts.set(userId, { count: 1, resetAt: now + JOIN_WINDOW_MS });
    return;
  }
  entry.count += 1;
  if (entry.count > JOIN_MAX_ATTEMPTS) {
    throw new DomainError(429, "TOO_MANY_ATTEMPTS", "Too many join attempts, try again in a minute");
  }
}

type CourseRow = {
  id: string;
  name: string;
  joinCode: string;
  professorId: string;
  createdAt: Date;
  _count?: { enrollments: number };
};

// Students never see the join code, only the owning professor does.
const toCourse = (viewer: Viewer, c: CourseRow) => ({
  id: c.id,
  name: c.name,
  professorId: c.professorId,
  createdAt: c.createdAt.toISOString(),
  joinCode: viewer.role === "PROFESSOR" ? c.joinCode : null,
  studentCount: c._count?.enrollments ?? null,
});

async function findOwnedCourse(viewer: Viewer, id: string) {
  const course = await prisma.course.findFirst({ where: { id, professorId: viewer.id } });
  if (!course) throw notFound("Course");
  return course;
}

export async function createCourse(userId: string, input: CreateCourseInput) {
  const viewer = await requireViewer(userId);
  requireRole(viewer, "PROFESSOR");
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    try {
      const course = await prisma.course.create({
        data: { name: input.name, professorId: viewer.id, joinCode: generateJoinCode() },
      });
      return toCourse(viewer, course);
    } catch (error) {
      if (isUniqueConstraintError(error)) continue;
      throw error;
    }
  }
  throw new Error("Could not generate a unique join code");
}

export async function listCourses(userId: string) {
  const viewer = await requireViewer(userId);
  const rows = await prisma.course.findMany({
    where:
      viewer.role === "PROFESSOR"
        ? { professorId: viewer.id }
        : { enrollments: { some: { studentId: viewer.id } } },
    include: { _count: { select: { enrollments: true } } },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((row) => toCourse(viewer, row));
}

// Joining twice is fine and returns the same course.
export async function joinCourse(userId: string, input: JoinCourseInput) {
  const viewer = await requireViewer(userId);
  requireRole(viewer, "STUDENT");
  checkJoinRateLimit(viewer.id);

  const course = await prisma.course.findUnique({ where: { joinCode: input.code } });
  if (!course) throw new DomainError(404, "INVALID_JOIN_CODE", "That join code is not valid");

  try {
    await prisma.courseEnrollment.upsert({
      where: { courseId_studentId: { courseId: course.id, studentId: viewer.id } },
      update: {},
      create: { courseId: course.id, studentId: viewer.id },
    });
  } catch (error) {
    // Two simultaneous joins can race on the unique index; the student is enrolled either way.
    if (!isUniqueConstraintError(error)) throw error;
  }
  return toCourse(viewer, course);
}

export async function listCourseStudents(userId: string, courseId: string) {
  const viewer = await requireViewer(userId);
  requireRole(viewer, "PROFESSOR");
  await findOwnedCourse(viewer, courseId);
  const rows = await prisma.courseEnrollment.findMany({
    where: { courseId },
    include: { student: { select: { id: true, name: true, email: true } } },
    orderBy: { joinedAt: "asc" },
  });
  return rows.map((r) => ({
    id: r.student.id,
    name: r.student.name,
    email: r.student.email,
    joinedAt: r.joinedAt.toISOString(),
  }));
}

// Old code stops working immediately; existing enrollments are untouched.
export async function rotateJoinCode(userId: string, courseId: string) {
  const viewer = await requireViewer(userId);
  requireRole(viewer, "PROFESSOR");
  await findOwnedCourse(viewer, courseId);
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    try {
      const course = await prisma.course.update({
        where: { id: courseId },
        data: { joinCode: generateJoinCode() },
      });
      return toCourse(viewer, course);
    } catch (error) {
      if (isUniqueConstraintError(error)) continue;
      throw error;
    }
  }
  throw new Error("Could not generate a unique join code");
}