import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const cookieStore = await cookies();
  if (cookieStore.has("codelens-user-id")) redirect("/");
  return (
    <main className="mx-auto mt-12 max-w-md rounded-xl border border-neutral-200 bg-white p-7 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Peer code review</p>
      <h1 className="mt-2 text-3xl font-bold">CodeLens</h1>
      <p className="mt-2 text-sm text-neutral-600">Log in to your course workspace or create a student account.</p>
      <AuthForm />
      <p className="mt-6 rounded bg-neutral-50 p-3 text-xs text-neutral-600">Local demo professor: username <strong>prof</strong>, password <strong>123</strong></p>
    </main>
  );
}
