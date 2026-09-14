import Link from "next/link";
import type { ReactNode } from "react";

// Shared chrome for the static legal pages (/terms, /privacy, /disclaimer).
// These are the published early-access notices and use conditions, with an
// explicit attorney-review warning. They must stay consistent with the product
// that is actually running; counsel review remains a launch requirement before
// real matter data or public billing.
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-900 text-sm font-bold text-white">
              D
            </div>
            <span className="text-sm font-semibold tracking-tight">
              Disclosed<span className="text-blue-800">.</span>
            </span>
          </Link>
          <Link
            href="/"
            className="text-sm text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            ← Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {updated}</p>

        <div
          role="note"
          className="mt-6 rounded-xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm leading-relaxed text-amber-900"
        >
          <strong className="font-semibold">Early-access legal notice — attorney review required.</strong>{" "}
          This published notice has not yet been reviewed by Disclosed.&apos;s
          licensed counsel. It describes the rules and data practices in effect
          for this limited preview; it is not legal advice. A counsel-reviewed
          version, the operator&apos;s full legal identity, and the applicable
          jurisdiction terms must be in place before real matter data or public
          billing is accepted.
        </div>

        <div className="legal-prose mt-8 space-y-6 text-[0.95rem] leading-relaxed text-slate-700">
          {children}
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-6 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-semibold text-slate-700">Disclosed.</span>
          <nav aria-label="Legal" className="flex gap-5">
            <a href="/terms" className="hover:text-slate-900">
              Terms
            </a>
            <a href="/privacy" className="hover:text-slate-900">
              Privacy
            </a>
            <a href="/disclaimer" className="hover:text-slate-900">
              Disclaimer
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

export function LegalH2({ children }: { children: ReactNode }) {
  return (
    <h2 className="pt-2 text-lg font-semibold tracking-tight text-slate-900">
      {children}
    </h2>
  );
}
