import { currentUserId } from "@project/auth";
import { DomainError, getAssignment, getSubmission, listReviews } from "@project/domain";
import { ReviewForm } from "@/components/ReviewForm";

export const dynamic = "force-dynamic";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await currentUserId();

  let initialReview: {
    id: string;
    content: string;
    status: "DRAFT" | "SUBMITTED";
  } | null = null;
  let code: string | null = null;
  let assignmentTitle: string | null = null;
  let loadError: string | null = null;

  try {
    const submission = await getSubmission(userId, id);
    code = submission.code;
    assignmentTitle = (await getAssignment(userId, submission.assignmentId)).title;
    const reviews = await listReviews(userId, id);
    // match on reviewerId so an author never sees someone else's review text
    const mine = reviews.find((r) => r.reviewerId === userId);
    if (mine) {
      initialReview = {
        id: mine.id,
        content: mine.content,
        status: mine.status as "DRAFT" | "SUBMITTED",
      };
    }
  } catch (err) {
    loadError =
      err instanceof DomainError && err.status === 404
        ? "This review is unavailable. It may have been removed or is not assigned to your account."
        : "Couldn't load the submission. Refresh to try again.";
  }

  return (
    <main className="space-y-4">
      <div>
        <a href="/" className="text-sm text-blue-700 underline">
          Dashboard
        </a>
        <h1 className="mt-2 text-2xl font-bold">Review submission</h1>
        {assignmentTitle && (
          <p className="mt-1 text-sm text-neutral-600">{assignmentTitle}</p>
        )}
      </div>
      {loadError ? (
        <p role="alert" className="text-red-600">
          {loadError}
        </p>
      ) : (
        <div className="space-y-5">
          <section className="space-y-2">
            <h2 className="font-semibold">Anonymous code submission</h2>
            <pre
              tabIndex={0}
              aria-label="Submitted code"
              className="max-h-[32rem] overflow-auto rounded-lg bg-neutral-950 p-4 text-sm text-neutral-100"
            >
              <code>{code}</code>
            </pre>
          </section>
          <section className="space-y-2">
            <h2 className="font-semibold">Your review</h2>
            {initialReview ? (
              <ReviewForm initialReview={initialReview} />
            ) : (
              <p role="alert" className="text-red-600">
                No review started for this submission. Go back to the dashboard
                and choose &quot;Review this submission&quot;.
              </p>
            )}
          </section>
        </div>
      )}
    </main>
  );
}