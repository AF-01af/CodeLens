-- A student has at most one submission per assignment.
CREATE UNIQUE INDEX "Submission_assignmentId_userId_key" ON "Submission"("assignmentId", "userId");

-- A reviewer is paired with a given submission at most once.
CREATE UNIQUE INDEX "ReviewPairing_submissionId_reviewerId_key" ON "ReviewPairing"("submissionId", "reviewerId");
