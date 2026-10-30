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
} from "@/components/DashboardActions";
import { AssignmentBrowser } from "@/components/AssignmentBrowser";

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
      <AssignmentBrowser assignments={content} professor={professor} initialNow={Date.now()} />
    </main>
  );
}
