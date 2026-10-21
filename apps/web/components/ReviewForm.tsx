"use client";

// STATE: one `status` variable, so impossible combos can't exist. Each kind is
// one box on the state diagram. Failure kinds carry their own message.
//
// Failures are split by what the user can do:
//   invalid   (400)          fix the text first
//   retryable (network/5xx)  same text, click again
//   blocked   (403/404)      nothing to do here, form removed
//   conflict  (409)          form removed
//
// Drafts live on the server. First save is a POST, later saves are a PATCH
// using `reviewId`. A SUBMITTED review is locked (read-only).
// "empty" vs "ready" is computed from `content`, not stored.
// The catch block covers "network died". The server decides what is valid,
// the client only blocks blank text as a courtesy.

import { useState } from "react";

type SavedReview = {
  id: string;
  content: string;
  status: "DRAFT" | "SUBMITTED";
};

type Status =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "submitting" }
  | { kind: "invalid"; message: string }
  | { kind: "retryable"; message: string }
  | { kind: "blocked"; message: string }
  | { kind: "conflict"; message: string }
  | { kind: "locked" }
  | { kind: "done" };

function failureFor(httpStatus: number, message: string): Status {
  if (httpStatus === 400) return { kind: "invalid", message };
  if (httpStatus >= 500) return { kind: "retryable", message };
  if (httpStatus === 409) return { kind: "conflict", message };
  return { kind: "blocked", message }; // 401, 403, 404, 405, anything else
}

export function ReviewForm({
  submissionId,
  initialReview,
}: {
  submissionId: string;
  initialReview: SavedReview | null;
}) {
  const [content, setContent] = useState(initialReview?.content ?? "");
  const [reviewId, setReviewId] = useState<string | null>(
    initialReview?.id ?? null,
  );
  const [status, setStatus] = useState<Status>(
    initialReview?.status === "SUBMITTED" ? { kind: "locked" } : { kind: "idle" },
  );

  const busy = status.kind === "saving" || status.kind === "submitting";
  const canAct =
    content.trim().length > 0 && !busy && status.kind !== "invalid";
  const canSave = canAct && status.kind !== "saved"; // nothing new to save

  function onChange(value: string) {
    setContent(value);
    if (status.kind === "invalid" || status.kind === "saved") {
      setStatus({ kind: "idle" });
    }
  }

  async function send(target: "DRAFT" | "SUBMITTED") {
    setStatus({ kind: target === "DRAFT" ? "saving" : "submitting" });

    const headers = { "Content-Type": "application/json" };
    const body = JSON.stringify({ content, status: target });

    try {
      const res =
        reviewId === null
          ? await fetch(`/api/submissions/${submissionId}/reviews`, {
              method: "POST",
              headers,
              body,
            })
          : await fetch(`/api/reviews/${reviewId}`, {
              method: "PATCH",
              headers,
              body,
            });

      if (res.ok) {
        const review = await res.json();
        setReviewId(review.id);
        setStatus(target === "DRAFT" ? { kind: "saved" } : { kind: "done" });
        return;
      }

      const err = await res.json().catch(() => null);
      setStatus(
        failureFor(res.status, err?.error?.message ?? "Something went wrong."),
      );
    } catch {
      setStatus({
        kind: "retryable",
        message: "Couldn't reach the server. Check your connection and try again.",
      });
    }
  }

  if (status.kind === "done") {
    return <p className="text-green-700">Review submitted. Thanks!</p>;
  }

  if (status.kind === "blocked" || status.kind === "conflict") {
    return (
      <p role="alert" className="text-red-600">
        {status.message}
      </p>
    );
  }

  if (status.kind === "locked") {
    return (
      <div className="space-y-2">
        <p className="text-sm text-neutral-600">
          You already submitted this review. It can&apos;t be edited.
        </p>
        <p className="whitespace-pre-wrap rounded border border-neutral-300 p-2">
          {content}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canAct) send("SUBMITTED");
      }}
      className="space-y-3"
    >
      <label htmlFor="review" className="block text-sm font-medium">
        Your review
      </label>
      <textarea
        id="review"
        value={content}
        onChange={(e) => onChange(e.target.value)}
        maxLength={20000}
        rows={8}
        className="w-full rounded border border-neutral-300 p-2"
      />
      {(status.kind === "invalid" || status.kind === "retryable") && (
        <p role="alert" className="text-sm text-red-600">
          {status.message}
        </p>
      )}
      {status.kind === "saved" && (
        <p className="text-sm text-green-700">Draft saved.</p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!canSave}
          onClick={() => send("DRAFT")}
          className="rounded border border-blue-600 px-4 py-2 text-blue-600 disabled:opacity-50"
        >
          {status.kind === "saving" ? "Saving..." : "Save draft"}
        </button>
        <button
          type="submit"
          disabled={!canAct}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {status.kind === "submitting" ? "Submitting..." : "Submit review"}
        </button>
      </div>
    </form>
  );
}