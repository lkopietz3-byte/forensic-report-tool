import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For retaining counsel",
  description:
    "A one-page explainer your expert can forward before using Disclosed. on a matter: what the tool does and does not do, the AI-disclosure record it produces, confidentiality, and who remains the author.",
};

// A forwardable, printable one-pager written for the RETAINING ATTORNEY — the
// artifact an expert hands counsel before using the tool on a matter. Plain,
// literally-true language; every claim mirrors the product's honesty rules
// (structures, never originates; admissibility is the court's call; the chain is
// tamper-evident, not tamper-proof).

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="mt-7">
      <h2 className="text-base font-semibold tracking-tight text-slate-900">{heading}</h2>
      <div className="mt-2 space-y-2 text-[0.95rem] leading-relaxed text-slate-700">{children}</div>
    </section>
  );
}

export default function ForCounselPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white print:hidden">
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
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-800">For retaining counsel</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          What this tool does in your expert&apos;s workflow
        </h1>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-slate-600">
          Your expert may use Disclosed. to assemble their Rule 26(a)(2)(B)
          report. This page explains, in plain terms, what the tool does and does
          not do, so you know what stands behind the report and the disclosure
          record attached to it. It is informational, not legal advice.
        </p>

        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 text-[0.95rem] leading-relaxed text-slate-700">
          <p>
            Courts are starting to treat your expert&apos;s AI use as your
            discovery problem too. In <em>Conservation Law Foundation v. Shell</em>{" "}
            (2026) a magistrate ordered an expert to produce the AI prompts behind
            her work (the order is stayed under district-court review); in{" "}
            <em>Kohls v. Ellison</em> (2025) a declaration was struck after
            AI-hallucinated citations slipped through. When your expert uses
            Disclosed., the record of how AI was used is built as the report is
            written and travels with it — so it is in the file before opposing
            counsel or the court asks, rather than reconstructed under cross.
          </p>
        </div>

        <Section heading="It organizes the expert's own findings. It does not originate them.">
          <p>
            The tool works only from the evidence the expert supplies, and does
            not reach outside it for facts, figures, or citations. Every factual
            sentence must carry a citation to a source the expert provided, and
            export is blocked on any sentence that cannot be tied to one. That
            check confirms a sentence points to a real supplied source. It does
            not confirm the source proves the statement, so verifying that the
            evidence actually supports each sentence, and that any calculation or
            inference is sound, stays with the expert (Fed. R. Evid. 702). The
            expert reviews, edits, independently verifies, adopts, and signs.
          </p>
        </Section>

        <Section heading="Every report carries an AI-Use Disclosure record">
          <p>
            If any section was assisted by an AI model, the report includes an
            appendix that discloses each AI-assisted section, the model and
            version used, and the exact evidence the tool was given for it. The
            record is generated automatically from a tamper-evident log (each
            entry is cryptographically linked to the one before it, so a later
            edit or deletion can be detected). If a section used no AI, the
            disclosure says so.
          </p>
          <p>
            This is intended to put a methodology record in the file in advance,
            rather than reconstructing it from memory if the expert&apos;s AI use
            is later examined in discovery or on cross.
          </p>
          <p>
            That record can be checked independently. If the expert provides the
            disclosure manifest, anyone (including opposing counsel) can confirm
            it was not altered after it was made at{" "}
            <a
              href="/verify"
              className="font-medium text-blue-800 underline-offset-2 hover:underline"
            >
              disclosed.app/verify
            </a>
            : the hash chain is recomputed in the browser, with no account and
            nothing uploaded.
          </p>
        </Section>

        <Section heading="Confidentiality">
          <p>
            During early access, the product is limited to its fictional worked
            example and properly de-identified material. Original document bytes
            are read in the browser; confirmed text is sent to the Disclosed.
            server and, when AI is enabled, to Anthropic under standard API
            retention of up to 30 days. Zero-data-retention and final
            counsel-reviewed terms are not yet in place, so the expert should not
            submit a real matter, privileged material, protected health
            information, or material under a protective order.
          </p>
        </Section>

        <Section heading="On admissibility">
          <p>
            Admissibility and the sufficiency of any disclosure are always the
            court&apos;s determination. The tool is designed to support a
            defensible methodology and to disclose AI use; it does not and cannot
            guarantee that a report is admissible or that a particular disclosure
            satisfies a particular court.
          </p>
        </Section>

        <Section heading="Setting the expectation with your experts">
          <p>
            If you want AI use disclosed on your matters, it helps to say so up
            front. You&apos;re welcome to forward this page to any expert you
            retain, or to use a line like this in your engagement letter:
          </p>
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 italic text-slate-700">
            &ldquo;If you use any AI assistance in preparing your report on this
            matter, I&apos;ll want a disclosure record of how it was used.
            Disclosed. produces one automatically, and it can be independently
            verified.&rdquo;
          </p>
          <p>
            <a
              href="/for-experts"
              className="font-medium text-blue-800 underline-offset-2 hover:underline"
            >
              Send your expert the overview →
            </a>
          </p>
        </Section>

        <Section heading="Questions">
          <p>
            Reach us through the same contact your expert used, or via the address
            we use to reply to a waitlist request. We&apos;re glad to walk through
            the disclosure format with you before it appears in a filed report.
          </p>
        </Section>

        <p className="mt-10 border-t border-slate-200 pt-5 text-xs leading-relaxed text-slate-500">
          Informational only; not legal advice and not a representation about any
          specific matter. Disclosed. is in early access and is not a law firm.
        </p>
      </main>
    </div>
  );
}
