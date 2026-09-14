import Link from "next/link";
import type { Metadata } from "next";
import { VerifyClient } from "./VerifyClient";

export const metadata: Metadata = {
  title: "Verify a disclosure record",
  description:
    "Independently verify a Disclosed. AI-disclosure manifest. The SHA-256 hash chain is recomputed in your browser, with no account and nothing uploaded, to confirm the record of how AI was used was not altered after it was made.",
};

// A manifest can contain report prompts/outputs. It stays in the browser, and
// the dynamic render lets middleware apply the strict nonce CSP to that surface.
export const dynamic = "force-dynamic";

// Public, account-free verification surface — the independent half of the
// tamper-evidence story. Anyone holding a disclosure manifest (the expert,
// retaining counsel, opposing counsel, a court) can confirm here that the record
// of how AI was used was not altered after it was recorded, without trusting us:
// the SHA-256 hash chain is recomputed in their own browser. Copy follows the
// honesty rules — tamper-evident, never "tamper-proof"; admissibility is the
// court's call and is not claimed here.
function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-900">
        {n}
      </span>
      <span className="text-[0.95rem] leading-relaxed text-slate-700">{children}</span>
    </li>
  );
}

export default function VerifyPage() {
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
            className="text-sm text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
          >
            ← Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10 sm:py-12">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-800">
          Independent verification
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Verify a report&apos;s AI-disclosure record
        </h1>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-slate-600">
          Every report built with Disclosed. carries a record of exactly how AI was
          used. For each section, that means the model, the version, the evidence it
          was given, and the prompt and output. The record is a hash chain: change one
          entry and every entry after it stops matching. This page recomputes the chain{" "}
          <strong className="font-semibold text-slate-800">in your browser</strong> from
          a manifest you provide, so you can confirm the record was not altered after
          it was made. You don&apos;t have to take our word for it, and the file never
          leaves your computer.
        </p>

        <VerifyClient />

        <section className="mt-8 border-t border-slate-200 pt-8 sm:mt-12">
          <h2 className="text-base font-semibold tracking-tight text-slate-900">How it works</h2>
          <ol className="reveal mt-3 space-y-3">
            <Step n={1}>
              Each AI-assisted section is recorded as an append-only event: the model
              and version, the evidence units provided to it, and the exact prompt and
              output.
            </Step>
            <Step n={2}>
              Every event is hashed with SHA-256 and linked to the one before it
              (genesis is 64 zeros). Editing, deleting, or inserting any event after
              the fact changes a hash and breaks the chain from that point on.
            </Step>
            <Step n={3}>
              This page recomputes every hash from the manifest&apos;s own contents and
              reports the first break, if there is one. The manifest declares the exact
              algorithm it uses, so the check is reproducible by anyone.
            </Step>
          </ol>
          <p className="mt-5 text-[0.95rem] leading-relaxed text-slate-600">
            A pass is <strong className="font-semibold text-slate-800">tamper-evident</strong>:
            it proves the records shown are internally consistent and unaltered since they
            were hashed. On its own, it is not proof that no one with database write
            access ever rewrote the whole record from its first entry. And whether any
            disclosure satisfies a court&apos;s requirements is always the court&apos;s
            determination.
          </p>
        </section>

        <section className="lift mt-8 rounded-2xl border border-slate-200 bg-white px-5 py-4">
          <p className="text-sm leading-relaxed text-slate-600">
            <strong className="font-semibold text-slate-800">For experts and counsel:</strong>{" "}
            the expert exports a disclosure manifest alongside the report and keeps it with
            the case file. If the expert&apos;s AI use is ever questioned, anyone (including
            opposing counsel) can verify here that the disclosed record is the one that was
            made, unaltered. That is the point. The record is useful because it can be checked,
            not because we ask anyone to trust our label.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Retaining counsel can also make this a step of their own diligence: ask your
            expert for the disclosure manifest and confirm here that it is intact before the
            report is produced in discovery — rather than waiting for opposing counsel to run
            the same check.
          </p>
        </section>
      </main>
    </div>
  );
}
