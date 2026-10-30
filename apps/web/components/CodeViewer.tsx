"use client";

import { Fragment, useState } from "react";

export function CodeViewer({
  code,
  label = "Code",
}: {
  code: string;
  label?: string;
}) {
  const [readable, setReadable] = useState(false);

  return (
    <section aria-label={label} className="overflow-hidden rounded-lg bg-neutral-950 text-neutral-100">
      <div className="flex items-center justify-between gap-3 border-b border-neutral-700 px-3 py-2">
        <span className="text-xs font-medium text-neutral-300">{label}</span>
        <button
          type="button"
          aria-pressed={readable}
          onClick={() => setReadable((enabled) => !enabled)}
          className="rounded border border-neutral-600 px-2.5 py-1 text-xs text-neutral-100 hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
        >
          {readable ? "Turn readable code mode off" : "Readable code mode"}
        </button>
      </div>
      <pre
        tabIndex={0}
        aria-label={`${label} content`}
        className={`max-h-[32rem] overflow-auto p-4 font-mono ${readable ? "text-sm leading-7" : "text-xs leading-5"}`}
      >
        {readable ? (
          <code className="grid grid-cols-[3ch_minmax(0,1fr)] gap-x-4">
            {code.split("\n").map((line, index) => (
              <Fragment key={index}>
                <span aria-hidden="true" className="select-none text-right text-neutral-500">
                  {index + 1}
                </span>
                <span className="min-w-0 whitespace-pre-wrap break-words">{line || "\u00a0"}</span>
              </Fragment>
            ))}
          </code>
        ) : (
          <code className="whitespace-pre">{code}</code>
        )}
      </pre>
    </section>
  );
}
