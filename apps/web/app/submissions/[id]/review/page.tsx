import { currentUserId } from "@project/auth";
import { DomainError, listReviews } from "@project/domain";
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
  let loadError: string | null = null;

  try {
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
    // 404 = a new reviewer can't see the submission yet. Not a failure.
    if (!(err instanceof DomainError && err.status === 404)) {
      loadError = "Couldn't load your review. Refresh to try again.";
    }
  }

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-bold">Review submission</h1>
      {loadError ? (
        <p role="alert" className="text-red-600">
          {loadError}
        </p>
      ) : (
        <ReviewForm submissionId={id} initialReview={initialReview} />
      )}
    </main>
  );
}