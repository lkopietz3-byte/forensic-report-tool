"use client";

import Link from "next/link";

// Segment-level error boundary for the marketing/legal pages.
export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-slate-900">
      <div className="max-w-md text-center">
        <span className="text-sm font-semibold tracking-tight">
          Disclosed<span className="text-blue-800">.</span>
        </span>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">
          Something went wrong on our side
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          This page didn&apos;t load as expected. You can try again, or head
          back to the home page.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="h-11 rounded-xl bg-blue-900 px-5 text-sm font-semibold text-white transition hover:bg-blue-950"
          >
            Try again
          </button>
          <Link
            href="/"
            className="h-11 rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold leading-[44px] text-slate-800 no-underline transition hover:bg-slate-50"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
