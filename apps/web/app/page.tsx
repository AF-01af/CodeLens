import { ApiStatus } from "@/components/ApiStatus";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 px-6 py-16">
      <header className="space-y-3">
        <p className="text-sm font-medium tracking-wide text-slate-500 uppercase">
          Development skeleton
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
          CodeLens
        </h1>
        <p className="max-w-lg text-lg text-slate-600">
          Peer code review for CS courses — human reviews, AI shadow reviews, and
          comparison tools. Product features are not built yet; this page confirms
          the frontend is running.
        </p>
      </header>

      <section className="space-y-3 border-t border-slate-200 pt-8">
        <h2 className="text-sm font-medium text-slate-500 uppercase">Status</h2>
        <ul className="space-y-2 text-slate-800">
          <li className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Frontend is running
          </li>
          <li>
            <ApiStatus />
          </li>
        </ul>
      </section>
    </main>
  );
}
