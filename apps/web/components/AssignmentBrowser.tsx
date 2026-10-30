"use client";

import { useEffect, useState } from "react";
import type {
  listAssignments,
  listMyReviews,
  listReviewCandidates,
  listReviews,
  listSubmissions,
} from "@project/domain";
import { CodeViewer } from "@/components/CodeViewer";
import {
  StartReviewButton,
  SubmissionForm,
} from "@/components/DashboardActions";

type Review = Awaited<ReturnType<typeof listReviews>>[number];
type Submission = Awaited<ReturnType<typeof listSubmissions>>[number];

type AssignmentData = {
  assignment: Awaited<ReturnType<typeof listAssignments>>[number];
  submissions: Array<Submission & { reviews: Review[] }>;
  ownSubmission: Submission | null;
  receivedReviews: Review[];
  candidates: Awaited<ReturnType<typeof listReviewCandidates>>;
  myReviews: Awaited<ReturnType<typeof listMyReviews>>;
};

function dueDateLabel(dueDate: string, overdue: boolean) {
  const formatted = new Date(dueDate).toLocaleString();
  return overdue ? `Overdue · Due ${formatted}` : `Due ${formatted}`;
}

export function AssignmentBrowser({
  assignments,
  professor,
  initialNow,
}: {
  assignments: AssignmentData[];
  professor: boolean;
  initialNow: number;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    assignments[0]?.assignment.id ?? null,
  );
  const [now, setNow] = useState(initialNow);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(timer);
  }, []);

  const selected = assignments.find(({ assignment }) => assignment.id === selectedId);
  const overdue = (dueDate: string) => new Date(dueDate).getTime() <= now;

  return (
    <section className="grid gap-5 md:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="h-fit rounded-lg border border-neutral-200 bg-white p-4 md:sticky md:top-4">
        <h2 className="text-lg font-semibold">
          {professor ? "Your assignments" : "Course assignments"}
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          {professor
            ? "Track submissions and peer reviews."
            : "Choose an assignment to view details or submit your code."}
        </p>
        {assignments.length === 0 ? (
          <p className="mt-4 rounded bg-neutral-50 p-3 text-sm text-neutral-600">
            {professor
              ? "No assignments yet. Create one above to get started."
              : "There are no assignments yet. Check back after your professor posts one."}
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {assignments.map(({ assignment }) => {
              const isSelected = selectedId === assignment.id;
              const isOverdue = overdue(assignment.dueDate);
              return (
                <li key={assignment.id}>
                  <button
                    type="button"
                    aria-expanded={isSelected}
                    onClick={() => setSelectedId(isSelected ? null : assignment.id)}
                    className={`w-full rounded-md border px-3 py-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${
                      isSelected
                        ? "border-blue-700 bg-blue-50"
                        : "border-neutral-200 hover:bg-neutral-50"
                    }`}
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span className="font-medium text-neutral-900">{assignment.title}</span>
                      <span aria-hidden="true" className="text-neutral-500">{isSelected ? "▾" : "▸"}</span>
                    </span>
                    <span className={`mt-1 block text-xs ${isOverdue ? "font-semibold text-red-700" : "text-neutral-600"}`}>
                      {isOverdue ? "Overdue" : `Due ${new Date(assignment.dueDate).toLocaleDateString()}`}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      <div aria-live="polite" className="min-w-0">
        {selected ? (
          <article className="space-y-4 rounded-lg border border-neutral-200 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">{selected.assignment.title}</h3>
                <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700">
                  {selected.assignment.description}
                </p>
              </div>
              <p className={`text-sm ${overdue(selected.assignment.dueDate) ? "font-semibold text-red-700" : "text-neutral-600"}`}>
                {dueDateLabel(selected.assignment.dueDate, overdue(selected.assignment.dueDate))}
              </p>
            </div>

            {professor ? (
              <div className="border-t border-neutral-200 pt-4">
                <h4 className="font-medium">Submissions ({selected.submissions.length})</h4>
                {selected.submissions.length === 0 ? (
                  <p className="mt-2 text-sm text-neutral-600">No code submitted yet.</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {selected.submissions.map((submission) => (
                      <details key={submission.id} className="rounded bg-neutral-50 p-3">
                        <summary className="cursor-pointer text-sm font-medium">
                          Student {submission.studentId} · {submission.reviews.length} review{submission.reviews.length === 1 ? "" : "s"}
                        </summary>
                        <div className="mt-3">
                          <CodeViewer code={submission.code} label="Student submitted code" />
                        </div>
                        <div className="mt-3 space-y-2">
                          {submission.reviews.map((review) => (
                            <blockquote key={review.id} className="border-l-2 border-blue-700 pl-3 text-sm text-neutral-700">
                              {review.content}
                            </blockquote>
                          ))}
                          {submission.reviews.length === 0 && (
                            <p className="text-sm text-neutral-600">No submitted reviews yet.</p>
                          )}
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
                  {selected.ownSubmission ? (
                    <div className="mt-2 space-y-2">
                      <p className="text-sm text-green-700">
                        Submitted · {selected.receivedReviews.length > 0 ? "peer feedback received" : "waiting for peer feedback"}
                      </p>
                      <details className="text-sm">
                        <summary className="cursor-pointer">View your submitted code</summary>
                        <div className="mt-2">
                          <CodeViewer code={selected.ownSubmission.code} label="Your submitted code" />
                        </div>
                      </details>
                      {selected.receivedReviews.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <h5 className="text-sm font-medium">Anonymous peer feedback</h5>
                          {selected.receivedReviews.map((review) => (
                            <blockquote key={review.id} className="rounded bg-blue-50 p-3 text-sm text-neutral-800">
                              {review.content}
                            </blockquote>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <SubmissionForm
                      assignmentId={selected.assignment.id}
                      dueDate={selected.assignment.dueDate}
                      overdue={overdue(selected.assignment.dueDate)}
                    />
                  )}
                </section>

                <section>
                  <h4 className="font-medium">Your peer reviews</h4>
                  {selected.myReviews.length === 0 ? (
                    <p className="mt-2 text-sm text-neutral-600">You have not started a review for this assignment.</p>
                  ) : (
                    <ul className="mt-2 divide-y divide-neutral-200">
                      {selected.myReviews.map((review) => (
                        <li key={review.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                          <span className="text-sm text-neutral-700">
                            Anonymous submission · {review.status === "DRAFT" ? "Draft" : "Submitted"}
                          </span>
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
                  {selected.candidates.length === 0 ? (
                    <p className="mt-2 text-sm text-neutral-600">No unreviewed peer submissions are available yet.</p>
                  ) : (
                    <ul className="mt-2 divide-y divide-neutral-200">
                      {selected.candidates.map((candidate) => (
                        <li key={candidate.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                          <span className="text-sm text-neutral-700">
                            Anonymous submission · received {new Date(candidate.submittedAt).toLocaleDateString()}
                          </span>
                          <StartReviewButton submissionId={candidate.id} />
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            )}
          </article>
        ) : (
          <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-600">
            {assignments.length === 0
              ? "Assignments will appear here when they are available."
              : "Choose an assignment from the list to expand its details."}
          </div>
        )}
      </div>
    </section>
  );
}
