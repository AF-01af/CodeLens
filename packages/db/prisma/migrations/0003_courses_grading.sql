-- Courses and enrollment
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "joinCode" TEXT NOT NULL,
    "professorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CourseEnrollment" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseEnrollment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Course_joinCode_key" ON "Course"("joinCode");
CREATE UNIQUE INDEX "CourseEnrollment_courseId_studentId_key" ON "CourseEnrollment"("courseId", "studentId");

-- Assignments belong to a course and have a separate review deadline
ALTER TABLE "Assignment" ADD COLUMN "courseId" TEXT, ADD COLUMN "reviewDueDate" TIMESTAMP(3);

-- Backfill existing rows: one legacy course per professor, enroll anyone who submitted
INSERT INTO "Course" ("id", "name", "joinCode", "professorId", "updatedAt")
SELECT 'legacy-' || "professorId", 'Legacy course', upper(substr(md5("professorId"), 1, 8)), "professorId", CURRENT_TIMESTAMP
FROM "Assignment"
GROUP BY "professorId";

UPDATE "Assignment" SET "courseId" = 'legacy-' || "professorId", "reviewDueDate" = "dueDate";

INSERT INTO "CourseEnrollment" ("id", "courseId", "studentId")
SELECT gen_random_uuid()::text, a."courseId", s."userId"
FROM "Submission" s
JOIN "Assignment" a ON a."id" = s."assignmentId"
GROUP BY a."courseId", s."userId";

ALTER TABLE "Assignment" ALTER COLUMN "courseId" SET NOT NULL, ALTER COLUMN "reviewDueDate" SET NOT NULL;

-- Grades: feedback and release gate for the code grade
ALTER TABLE "Grade" ADD COLUMN "feedback" TEXT, ADD COLUMN "releasedAt" TIMESTAMP(3);

-- Grades for review quality
CREATE TABLE "ReviewGrade" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "feedback" TEXT,
    "releasedAt" TIMESTAMP(3),
    "professorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewGrade_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReviewGrade_reviewId_key" ON "ReviewGrade"("reviewId");

-- Foreign keys
ALTER TABLE "Course" ADD CONSTRAINT "Course_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CourseEnrollment" ADD CONSTRAINT "CourseEnrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CourseEnrollment" ADD CONSTRAINT "CourseEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReviewGrade" ADD CONSTRAINT "ReviewGrade_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReviewGrade" ADD CONSTRAINT "ReviewGrade_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
