"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function AuthForm() {
  const router = useRouter();
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const payload = Object.fromEntries(data.entries());
    try {
      const response = await fetch(`/api/auth/${registering ? "register" : "login"}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { setError(result.error?.message ?? result.error ?? "Could not sign in."); return; }
      router.replace("/");
      router.refresh();
    } catch {
      setError("Could not reach CodeLens. Try again.");
    } finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="mt-6 grid gap-4">
      {registering && <label className="grid gap-1 text-sm font-medium">Full name<input required name="name" minLength={2} maxLength={100} autoComplete="name" className="rounded border border-neutral-300 px-3 py-2" /></label>}
      {registering && <label className="grid gap-1 text-sm font-medium">Email<input required name="email" type="email" autoComplete="email" className="rounded border border-neutral-300 px-3 py-2" /></label>}
      <label className="grid gap-1 text-sm font-medium">Username<input required name="username" minLength={3} maxLength={30} autoComplete="username" className="rounded border border-neutral-300 px-3 py-2" /></label>
      <label className="grid gap-1 text-sm font-medium">Password<input required name="password" type="password" minLength={registering ? 8 : 1} maxLength={128} autoComplete={registering ? "new-password" : "current-password"} className="rounded border border-neutral-300 px-3 py-2" /></label>
      <button disabled={busy} className="rounded bg-blue-700 px-4 py-2 font-medium text-white disabled:opacity-50">{busy ? "Please wait…" : registering ? "Create student account" : "Log in"}</button>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button type="button" className="text-sm text-blue-800 underline" onClick={() => { setRegistering(!registering); setError(""); }}>
        {registering ? "Already have an account? Log in" : "New student? Create an account"}
      </button>
    </form>
  );
}

export function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }
  return <button onClick={logout} className="rounded border border-neutral-300 px-3 py-2 text-sm">Log out</button>;
}
