"use client";

import { useEffect, useState } from "react";
import { getApiBaseUrl } from "@/lib/api";

type Status = "checking" | "ok" | "error";

export function ApiStatus() {
  const [status, setStatus] = useState<Status>("checking");
  const [detail, setDetail] = useState<string>("");

  useEffect(() => {
    const baseUrl = getApiBaseUrl();
    const controller = new AbortController();

    async function check() {
      try {
        const response = await fetch(`${baseUrl}/api/health`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const body = (await response.json()) as { status?: string };
        if (body.status !== "ok") {
          throw new Error("Unexpected health payload");
        }
        setStatus("ok");
        setDetail(baseUrl);
      } catch (error) {
        if (controller.signal.aborted) return;
        setStatus("error");
        setDetail(
          error instanceof Error ? error.message : "Could not reach API",
        );
      }
    }

    void check();
    return () => controller.abort();
  }, []);

  if (status === "checking") {
    return (
      <span className="flex items-center gap-2 text-slate-600">
        <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-amber-400" />
        Checking API…
      </span>
    );
  }

  if (status === "ok") {
    return (
      <span className="flex items-center gap-2">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
        API connected ({detail})
      </span>
    );
  }

  return (
    <span className="flex flex-col gap-1">
      <span className="flex items-center gap-2">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-rose-500" />
        API unreachable
      </span>
      <span className="pl-4 text-sm text-slate-500">
        Start Postgres and the Spring Boot API, then refresh. ({detail})
      </span>
    </span>
  );
}
