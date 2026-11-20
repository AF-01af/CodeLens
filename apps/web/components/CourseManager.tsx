"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { listCourses } from "@project/domain";

type Course = Awaited<ReturnType<typeof listCourses>>[number];

export function CourseManager({ courses, professor }: { courses: Course[]; professor: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function post(path: string, data: object) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const result = await response.json().catch(() => null);
      if (!response.ok) { setMessage(result?.error?.message ?? "Could not update your courses. Try again."); return false; }
      setMessage("Course updated.");
      router.refresh();
      return true;
    } catch {
      setMessage("Could not reach the server. Try again.");
      return false;
    } finally { setBusy(false); }
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    if (await post("/api/courses", { name: form.get("name") })) formElement.reset();
  }

  async function join(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    if (await post("/api/courses/join", { code: form.get("code") })) formElement.reset();
  }

  return (
    <section className="space-y-4 rounded-lg border border-neutral-200 bg-white p-5">
      <div><h2 className="text-lg font-semibold">Courses</h2><p className="text-sm text-neutral-600">{professor ? "Create a course and share its join code with students." : "Join your class with the code from your professor."}</p></div>
      {professor ? (
        <form onSubmit={create} className="flex flex-wrap gap-2"><input required name="name" maxLength={200} placeholder="Course name" className="min-w-48 flex-1 rounded border border-neutral-300 px-3 py-2" /><button disabled={busy} className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50">Create course</button></form>
      ) : (
        <form onSubmit={join} className="flex flex-wrap gap-2"><input required name="code" maxLength={32} placeholder="Join code" className="min-w-48 flex-1 rounded border border-neutral-300 px-3 py-2 uppercase" /><button disabled={busy} className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50">Join course</button></form>
      )}
      {message && <p role="status" aria-live="polite" className="text-sm text-neutral-700">{message}</p>}
      {courses.length === 0 ? <p className="text-sm text-neutral-600">{professor ? "No courses yet. Create one to get a join code." : "You have not joined a course yet."}</p> : (
        <ul className="divide-y divide-neutral-200">{courses.map((course) => <li key={course.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-medium">{course.name}</p>{professor && <p className="text-xs text-neutral-600">Join code: <span className="font-mono font-semibold">{course.joinCode}</span> · {course.studentCount} students</p>}</div>{professor && <button type="button" disabled={busy} onClick={() => void post(`/api/courses/${course.id}/students/join-code/rotate`, {})} className="rounded border border-neutral-300 px-3 py-2 text-sm disabled:opacity-50">Rotate code</button>}</li>)}</ul>
      )}
    </section>
  );
}
