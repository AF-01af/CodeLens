"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

function errorMessage(payload: any, fallback: string) {
  return payload?.error?.message ?? fallback;
}

export function IdentitySwitcher({ userId }: { userId: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState(userId);
  const [error, setError] = useState("");

  async function switchIdentity(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const response = await fetch("/api/dev/identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selected }),
      });
      if (!response.ok) {
        setError(errorMessage(await response.json().catch(() => null), "Could not switch account."));
        return;
      }
      router.refresh();
    } catch {
      setError("Could not reach the server. Try again.");
    }
  }

  return (
    <form onSubmit={switchIdentity} className="flex flex-wrap items-end gap-2">
      <label className="grid gap-1 text-sm text-neutral-600">
        Demo account
        <select
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
          className="rounded border border-neutral-300 bg-white px-3 py-2 text-neutral-900"
        >
          <option value="demo-user">Professor</option>
          <option value="student-a">Student A</option>
          <option value="student-b">Student B</option>
        </select>
      </label>
      <button className="rounded bg-neutral-900 px-3 py-2 text-sm text-white" type="submit">
        Switch
      </button>
      {error && <p role="alert" className="w-full text-sm text-red-700">{error}</p>}
    </form>
  );
}

export function CreateAssignmentForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true);
    setMessage("");
    const form = new FormData(formElement);
    const dueDate = new Date(String(form.get("dueDate")));
    try {
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.get("title"),
          description: form.get("description"),
          dueDate: dueDate.toISOString(),
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(errorMessage(payload, "Could not create the assignment."));
        return;
      }
      formElement.reset();
      setMessage("Assignment created.");
      router.refresh();
    } catch {
      setMessage("Could not reach the server. Your assignment details are still here; try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-lg border border-neutral-200 p-4">
      <h2 className="font-semibold">Create an assignment</h2>
      <label className="grid gap-1 text-sm">Title<input required name="title" maxLength={200} className="rounded border border-neutral-300 px-3 py-2" /></label>
      <label className="grid gap-1 text-sm">Instructions<textarea required name="description" rows={3} className="rounded border border-neutral-300 px-3 py-2" /></label>
      <label className="grid gap-1 text-sm">Due date<input required name="dueDate" type="datetime-local" className="rounded border border-neutral-300 px-3 py-2" /></label>
      <button disabled={busy} className="w-fit rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50" type="submit">{busy ? "Creating…" : "Create assignment"}</button>
      {message && <p aria-live="polite" className="text-sm text-neutral-700">{message}</p>}
    </form>
  );
}

export function SubmissionForm({
  assignmentId,
  dueDate,
  overdue: initiallyOverdue,
}: {
  assignmentId: string;
  dueDate: string;
  overdue: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [deadlinePassed, setDeadlinePassed] = useState(initiallyOverdue);

  useEffect(() => {
    if (initiallyOverdue) {
      setDeadlinePassed(true);
      return;
    }
    let timer: number;
    const checkDeadline = () => {
      const remaining = new Date(dueDate).getTime() - Date.now();
      if (remaining <= 0) {
        setDeadlinePassed(true);
        return;
      }
      timer = window.setTimeout(checkDeadline, Math.min(remaining, 2_000_000_000));
    };
    checkDeadline();
    return () => window.clearTimeout(timer);
  }, [dueDate, initiallyOverdue]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (deadlinePassed) {
      setMessage("This assignment is overdue. Submissions are closed.");
      return;
    }
    const formElement = event.currentTarget;
    setBusy(true);
    setMessage("");
    const form = new FormData(formElement);
    try {
      const response = await fetch(`/api/assignments/${assignmentId}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: form.get("code") }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        if (payload?.error?.code === "ASSIGNMENT_CLOSED") {
          setDeadlinePassed(true);
          setMessage("This assignment is overdue. Submissions are closed.");
          return;
        }
        setMessage(errorMessage(payload, "Could not submit your code."));
        return;
      }
      formElement.reset();
      setMessage("Code submitted.");
      router.refresh();
    } catch {
      setMessage("Could not reach the server. Your code is still here; try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 grid gap-3 rounded-lg bg-neutral-50 p-4">
      <label className="grid gap-1 text-sm font-medium">Paste your code<textarea required name="code" maxLength={200000} rows={8} readOnly={deadlinePassed} className="rounded border border-neutral-300 bg-white p-3 font-mono text-sm read-only:bg-neutral-100" /></label>
      <button disabled={busy || deadlinePassed} className="w-fit rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50" type="submit">{deadlinePassed ? "Submission closed" : busy ? "Submitting…" : "Submit code"}</button>
      {deadlinePassed && <p role="status" className="text-sm font-medium text-red-700">This assignment is overdue. Submissions are closed.</p>}
      {message && !deadlinePassed && <p aria-live="polite" className="text-sm text-neutral-700">{message}</p>}
    </form>
  );
}

export function StartReviewButton({ submissionId }: { submissionId: string }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/submissions/${submissionId}/reviews/start`, { method: "POST" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(errorMessage(payload, "Could not open this review."));
        setBusy(false);
        return;
      }
      window.location.assign(`/submissions/${submissionId}/review`);
    } catch {
      setMessage("Could not reach the server. Try again.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={start} disabled={busy} className="rounded bg-blue-700 px-4 py-2 text-sm text-white disabled:opacity-50">
        {busy ? "Opening…" : "Review this submission"}
      </button>
      {message && <p role="alert" className="text-sm text-red-700">{message}</p>}
    </div>
  );
}
