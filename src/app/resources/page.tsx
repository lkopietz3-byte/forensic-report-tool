import Link from "next/link";
import type { Metadata } from "next";
import { ARTICLES } from "./articles";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "Plain-English guidance for forensic expert witnesses on AI disclosure, Rule 26 reports, and defensible methodology.",
  alternates: { canonical: "/resources" },
};

export default function Resources() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-slate-50/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-900 text-sm font-bold text-white">
              D
            </span>
            <span className="text-sm font-semibold tracking-tight text-slate-900">
              Disclosed.
            </span>
          </Link>
          <Link
            href="/#waitlist"
            className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white no-underline transition hover:bg-blue-950"
          >
            Request early access
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10 sm:py-14">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-800">
          Resources
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          AI, disclosure, and Rule 26 expert reports
        </h1>
        <p className="mt-3 max-w-2xl text-pretty text-lg leading-relaxed text-slate-600">
          Practical, plain-English guidance for forensic experts and the lawyers
          who retain them. It's written to be accurate and useful, not to sell
          you anything.
        </p>

        <ul className="reveal mt-8 space-y-5 sm:mt-10">
          {ARTICLES.map((a) => (
            <li key={a.slug}>
              <Link
                href={`/resources/${a.slug}`}
                className="lift group block rounded-2xl border border-slate-200 bg-white p-6 no-underline shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-blue-800">
                    {a.tag}
                  </span>
                  <span>{a.date}</span>
                  <span aria-hidden>·</span>
                  <span>{a.readMinutes} min read</span>
                </div>
                <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">
                  {a.title}
                </h2>
                <p className="mt-2 text-base leading-relaxed text-slate-600">
                  {a.dek}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-800">
                  Read
                  <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                    →
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-sm text-slate-500 sm:mt-10">
          More on the way. Want a specific topic covered?{" "}
          <Link href="/#waitlist" className="font-medium text-blue-800 underline">
            Tell us
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
