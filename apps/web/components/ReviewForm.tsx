"use client";

import { useState } from "react";

// One variable, so "submitting AND error" can't exist.
type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string }
  | { kind: "done" };

export function ReviewForm({ submissionId }: { submissionId: string }) {
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  // empty vs ready is derived, not stored
  const canSubmit = content.trim().length > 0 && status.kind !== "submitting";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus({ kind: "submitting" });

    try {
      const res = await fetch(`/api/submissions/${submissionId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, status: "SUBMITTED" }),
      });

      if (res.ok) {
        setStatus({ kind: "done" });
        return;
      }

      const body = await res.json().catch(() => null);
      setStatus({
        kind: "error",
        message: body?.error?.message ?? "Something went wrong. Try again.",
      });
    } catch {
      // fetch threw: the network died. Without this, we'd be stuck on "Submitting..."
      setStatus({
        kind: "error",
        message: "Couldn't reach the server. Check your connection and try again.",
      });
    }
  }

  if (status.kind === "done") {
    return <p className="text-green-700">Review submitted. Thanks!</p>;
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label htmlFor="review" className="block text-sm font-medium">
        Your review
      </label>
      <textarea
        id="review"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={20000}
        rows={8}
        className="w-full rounded border border-neutral-300 p-2"
      />
      {status.kind === "error" && (
        <p role="alert" className="text-sm text-red-600">
          {status.message}
        </p>
      )}
      <button
        type="submit"
        disabled={!canSubmit}
        className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {status.kind === "submitting" ? "Submitting..." : "Submit review"}
      </button>
    </form>
  );
}