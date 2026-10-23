// Home page. Shows who the dev identity stub says you are; product UI comes later.
import { currentUserId } from "@project/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const userId = await currentUserId();

  return (
    <main className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">CodeLens</h1>
        <p className="text-sm text-neutral-500">
          Signed in as <code className="rounded bg-neutral-100 px-1">{userId}</code> (dev
          identity stub — real auth arrives in Week 8)
        </p>
      </header>

      <section className="rounded-lg border border-neutral-200 bg-neutral-50 p-6">
        <p className="mb-4 text-neutral-600">
          Peer code review for CS courses. The API for assignments, submissions, and reviews
          is live; the review UI is not built yet.
        </p>
        <a
          href="/api/health"
          className="text-blue-600 underline underline-offset-2 hover:text-blue-800"
        >
          Check health &rarr;
        </a>
      </section>
    </main>
  );
}
