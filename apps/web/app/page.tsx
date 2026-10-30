import { currentUserId } from "@project/auth";
import {
  listAssignments,
  listReviewCandidates,
  listMyReviews,
  listReviews,
  listSubmissions,
  requireViewer,
} from "@project/domain";
import {
  CreateAssignmentForm,
  IdentitySwitcher,
  StartReviewButton,
  SubmissionForm,
} from "@/components/DashboardActions";
import { CodeViewer } from "@/components/CodeViewer";

export const dynamic = "force-dynamic";

export default async function Home() {
  const userId = await currentUserId();
  const viewer = await requireViewer(userId);
  const assignments = await listAssignments(userId);
  const professor = viewer.role === "PROFESSOR";

  const content = await Promise.all(assignments.map(async (assignment) => {
    if (professor) {
      const submissions = await listSubmissions(userId, assignment.id);
      const withReviews = await Promise.all(submissions.map(async (submission) => ({
        ...submission,
        reviews: await listReviews(userId, submission.id),
      })));
      return { assignment, submissions: withReviews, ownSubmission: null, receivedReviews: [], candidates: [], myReviews: [] };
    }

    const [ownSubmissions, candidates, myReviews] = await Promise.all([
      listSubmissions(userId, assignment.id),
      listReviewCandidates(userId, assignment.id),
      listMyReviews(userId, assignment.id),
    ]);
    const ownSubmission = ownSubmissions[0] ?? null;
    const receivedReviews = ownSubmission ? await listReviews(userId, ownSubmission.id) : [];
    return { assignment, submissions: [], ownSubmission, receivedReviews, candidates, myReviews };
  }));

  return (
    <main className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-5 border-b border-neutral-200 pb-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Peer code review</p>
          <h1 className="mt-1 text-3xl font-bold">CodeLens</h1>
          <p className="mt-2 text-sm text-neutral-600">Signed in as {viewer.name} · {viewer.role.toLowerCase()}</p>
        </div>
        <IdentitySwitcher userId={userId} />
      </header>

      {professor && <CreateAssignmentForm />}

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">{professor ? "Your assignments" : "Course assignments"}</h2>
          <p className="mt-1 text-sm text-neutral-600">
            {professor ? "Track submissions and submitted peer reviews." : "Submit your code, review a classmate, and read feedback on your work."}
          </p>
        </div>

        {content.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 p-6 text-sm text-neutral-600">
            {professor ? "No assignments yet. Create one above to get started." : "There are no assignments yet. Check back after your professor posts one."}
          </div>
        ) : (
          <div className="space-y-5">
            {content.map(({ assignment, submissions, ownSubmission, receivedReviews, candidates, myReviews }) => (
              <article key={assignment.id} className="space-y-4 rounded-lg border border-neutral-200 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{assignment.title}</h3>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700">{assignment.description}</p>
                  </div>
                  <p className="text-sm text-neutral-600">Due {new Date(assignment.dueDate).toLocaleString()}</p>
                </div>

                {professor ? (
                  <div className="border-t border-neutral-200 pt-4">
                    <h4 className="font-medium">Submissions ({submissions.length})</h4>
                    {submissions.length === 0 ? <p className="mt-2 text-sm text-neutral-600">No code submitted yet.</p> : (
                      <div className="mt-3 space-y-3">
                        {submissions.map((submission) => (
                          <details key={submission.id} className="rounded bg-neutral-50 p-3">
                            <summary className="cursor-pointer text-sm font-medium">Student {submission.studentId} · {submission.reviews.length} review{submission.reviews.length === 1 ? "" : "s"}</summary>
                            <div className="mt-3"><CodeViewer code={submission.code} label="Student submitted code" /></div>
                            <div className="mt-3 space-y-2">
                              {submission.reviews.map((review) => (
                                <blockquote key={review.id} className="border-l-2 border-blue-700 pl-3 text-sm text-neutral-700">{review.content}</blockquote>
                              ))}
                              {submission.reviews.length === 0 && <p className="text-sm text-neutral-600">No submitted reviews yet.</p>}
                            </div>
                          </details>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-5 border-t border-neutral-200 pt-4">
                    <section>
                      <h4 className="font-medium">Your submission</h4>
                      {ownSubmission ? (
                        <div className="mt-2 space-y-2">
                          <p className="text-sm text-green-700">
                            Submitted · {receivedReviews.length > 0 ? "peer feedback received" : "waiting for peer feedback"}
                          </p>
                          <details className="text-sm">
                            <summary className="cursor-pointer">View your submitted code</summary>
                            <div className="mt-2"><CodeViewer code={ownSubmission.code} label="Your submitted code" /></div>
                          </details>
                          {receivedReviews.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <h5 className="text-sm font-medium">Anonymous peer feedback</h5>
                              {receivedReviews.map((review) => <blockquote key={review.id} className="rounded bg-blue-50 p-3 text-sm text-neutral-800">{review.content}</blockquote>)}
                            </div>
                          )}
                        </div>
                      ) : <SubmissionForm assignmentId={assignment.id} />}
                    </section>

                    <section>
                      <h4 className="font-medium">Your peer reviews</h4>
                      {myReviews.length === 0 ? (
                        <p className="mt-2 text-sm text-neutral-600">You have not started a review for this assignment.</p>
                      ) : (
                        <ul className="mt-2 divide-y divide-neutral-200">
                          {myReviews.map((review) => (
                            <li key={review.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                              <span className="text-sm text-neutral-700">Anonymous submission · {review.status === "DRAFT" ? "Draft" : "Submitted"}</span>
                              <a className="rounded border border-neutral-300 px-3 py-2 text-sm underline" href={`/submissions/${review.submissionId}/review`}>
                                {review.status === "DRAFT" ? "Resume review" : "View review"}
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>

                    <section>
                      <h4 className="font-medium">Review a classmate</h4>
                      {candidates.length === 0 ? (
                        <p className="mt-2 text-sm text-neutral-600">No unreviewed peer submissions are available yet.</p>
                      ) : (
                        <ul className="mt-2 divide-y divide-neutral-200">
                          {candidates.map((candidate) => (
                            <li key={candidate.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                              <span className="text-sm text-neutral-700">Anonymous submission · received {new Date(candidate.submittedAt).toLocaleDateString()}</span>
                              <StartReviewButton submissionId={candidate.id} />
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
