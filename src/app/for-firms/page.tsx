import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For firms & teams",
  description:
    "If experts are pasting case files into public chatbots, that is a confidentiality and disclosure problem. Disclosed. gives individual experts a source-linked workflow today and lets founding firms shape the shared controls that come next.",
};

// A forwardable page for the PRACTICE OWNER / managing expert — the person who
// worries about confidentiality, consistency, and disclosure across several
// experts. Honest about what's solo-today vs. firm-roadmap; the call to action
// is a conversation, not a checkout. Mirrors the product's honesty rules.

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="mt-7">
      <h2 className="text-base font-semibold tracking-tight text-slate-900">{heading}</h2>
      <div className="mt-2 space-y-2 text-[0.95rem] leading-relaxed text-slate-700">{children}</div>
    </section>
  );
}

export default function ForFirmsPage() {
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
          <Link href="/" className="text-sm text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline">
            ← Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10 sm:py-12">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-800">For firms &amp; teams</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          One sanctioned tool for your whole practice
        </h1>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-slate-600">
          If you run a practice with more than one expert, the AI question is
          already in your office, whether or not you&apos;ve decided how to
          answer it.
        </p>

        <Section heading="The shadow-AI problem you may already have">
          <p>
            Some of your experts are probably already pasting deposition
            excerpts, medical records, and case notes into a public chatbot to
            speed up a report. That&apos;s case material, often under a
            protective order, leaving your control with no record of what was
            used or how. It&apos;s a confidentiality exposure and a disclosure
            exposure at once, and you&apos;d learn about it on
            cross-examination.
          </p>
        </Section>

        <Section heading="What a practice gets from doing it in the open">
          <p>
            One tool everyone uses the same way: each expert&apos;s own findings
            structured into your standard format, every factual sentence cited to
            a source they supplied, and an automatic AI-Use Disclosure record
            attached to each report. Nothing is originated for them, and each
            expert remains the author of their own report. Instead of hoping no
            one used AI badly, you have a consistent, disclosable record that AI
            was used carefully, or not at all, since there is a no-AI mode.
          </p>
        </Section>

        <Section heading="Where this is today, honestly">
          <p>
            The product works now for an individual expert. Team features are on
            the roadmap, not built yet: shared billing, a firm-tuned template,
            and visibility into usage across your experts. We&apos;re
            onboarding a small number of firms as design partners to shape them.
            If that&apos;s you, the fastest path is a conversation, not a
            checkout.
          </p>
        </Section>

        <div className="reveal mt-7 flex flex-col gap-3 sm:mt-9 sm:flex-row">
          <Link
            href="/#waitlist"
            className="inline-flex items-center justify-center rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-semibold text-white no-underline shadow-sm transition hover:bg-blue-950"
          >
            Talk to us about your team
          </Link>
          <a
            href="/for-counsel"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 no-underline transition hover:bg-slate-50"
          >
            What we tell retaining counsel →
          </a>
        </div>

        <p className="mt-8 border-t border-slate-200 pt-5 text-xs leading-relaxed text-slate-500 sm:mt-10">
          Informational only; not legal advice and not a representation about any
          specific matter. Disclosed. is in early access and is not a law firm.
        </p>
      </main>
    </div>
  );
}
