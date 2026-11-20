"use client";

import { useState } from "react";

export function AiHintPanel({ submissionId }: { submissionId: string }) {
  const [question, setQuestion] = useState("");
  const [hint, setHint] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function ask() {
    setBusy(true);
    setError("");
    setHint("");
    try {
      const response = await fetch(`/api/submissions/${submissionId}/hints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setError(result?.error?.message ?? "Could not get a hint. Try again.");
        return;
      }
      setHint(result.hint);
    } catch {
      setError("Could not reach the hint service. Your review is still saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="space-y-3 rounded-lg border border-violet-200 bg-violet-50 p-4">
      <div>
        <h3 className="font-semibold text-violet-950">AI review hints</h3>
        <p className="text-sm text-violet-900">Hints are AI-generated and may be wrong. Use them as prompts for your own review; they won’t provide a solution.</p>
      </div>
      <label className="grid gap-1 text-sm font-medium text-violet-950">Optional question
        <input value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={500} placeholder="What edge cases should I consider?" className="rounded border border-violet-300 bg-white px-3 py-2" />
      </label>
      <button type="button" disabled={busy} onClick={() => void ask()} className="rounded bg-violet-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{busy ? "Getting hint…" : "Ask for a hint"}</button>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {hint && <div className="whitespace-pre-wrap rounded border border-violet-200 bg-white p-3 text-sm text-neutral-800"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-violet-800">AI-generated suggestion</p>{hint}</div>}
    </aside>
  );
}
