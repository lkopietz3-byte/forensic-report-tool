import Link from "next/link";
import type { Metadata } from "next";
import { getArticle } from "../articles";

const article = getArticle("ai-disclosure-in-expert-reports")!;

export const metadata: Metadata = {
  title: article.title,
  description: article.dek,
  alternates: { canonical: "/resources/ai-disclosure-in-expert-reports" },
  openGraph: {
    title: article.title,
    description: article.dek,
    type: "article",
    publishedTime: article.isoDate,
  },
};

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-12 scroll-mt-24 text-2xl font-semibold tracking-tight text-slate-900">
      {children}
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 text-[17px] leading-relaxed text-slate-700">{children}</p>;
}

// JSON-LD so search engines parse this as a dated article (SEO; honest metadata only).
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: article.title,
  description: article.dek,
  datePublished: article.isoDate,
  author: { "@type": "Organization", name: "Disclosed." },
  publisher: { "@type": "Organization", name: "Disclosed." },
};

export default function Article() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
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

      <article className="mx-auto max-w-3xl px-6 py-10 sm:py-12">
        <Link
          href="/resources"
          className="text-sm font-medium text-blue-800 no-underline transition hover:text-blue-950"
        >
          ← Resources
        </Link>

        <div className="mt-4 flex items-center gap-3 text-xs font-medium text-slate-500">
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-blue-800">
            {article.tag}
          </span>
          <span>{article.date}</span>
          <span aria-hidden>·</span>
          <span>{article.readMinutes} min read</span>
        </div>

        <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          {article.title}
        </h1>
        <p className="mt-4 text-pretty text-lg leading-relaxed text-slate-600">
          {article.dek}
        </p>

        <div className="mt-8 border-t border-slate-200 pt-2">
          <P>
            For most of the last two years, the headlines about AI in litigation
            were about lawyers, with briefs citing cases that never existed. The
            story has now moved to the witness stand. In a string of 2025–2026
            decisions, courts have struck expert declarations built on
            AI-fabricated sources, rejected AI-derived analysis an expert
            couldn&apos;t explain, and, in one closely watched order, directed an
            expert to hand opposing counsel the AI prompts behind her work as
            discoverable methodology.
          </P>
          <P>
            None of this means an expert can&apos;t use AI. It means the way you
            use it, and your ability to account for it, is now part of your
            credibility. Here is what the cases actually say, and a practical way
            to stay on the right side of them.
          </P>

          <H2>What has sunk experts who used AI</H2>
          <P>
            The losing pattern is consistent. An AI tool introduced something the
            expert didn&apos;t supply and didn&apos;t catch, and the unverified
            output, not the use of AI as such, is what did the damage.
          </P>
          <P>
            In <em>Kohls v. Ellison</em> (D. Minn., Jan. 10, 2025), the Minnesota
            Attorney General&apos;s office offered a declaration from a Stanford
            misinformation scholar in a challenge to the state&apos;s
            political-deepfake law. The expert had used GPT-4o to expand his notes
            and let it fill in citations; it produced two articles that do not
            exist and misattributed a third. The court struck the entire
            declaration, writing that the fabricated citations &ldquo;shatter[]
            his credibility with this Court.&rdquo; It also noted the irony of a
            misinformation expert failing to verify AI output.
          </P>
          <P>
            A few months later, in <em>Concord Music Group v. Anthropic</em> (N.D.
            Cal., May 2025), a data-scientist&apos;s declaration cited a real
            journal (correct volume, page, year, and link) but with a title and
            authors the AI had invented. The court struck the paragraph and drew
            the line plainly. There is &ldquo;a world of difference between a
            missed citation and a hallucination generated by AI,&rdquo; and even a
            single one &ldquo;undermines the overall credibility&rdquo; of the
            testimony.
          </P>
          <P>
            And in <em>Matter of Weber</em> (N.Y. Surrogate&apos;s Court, 2024), an
            expert used an AI chatbot to &ldquo;check&rdquo; his valuation math but
            could not recall the prompts or explain the tool&apos;s methodology.
            The court found the valuation unreliable and signaled that AI-derived
            evidence may require disclosure and a reliability hearing before it can
            come in at all.
          </P>

          <H2>What has been fine</H2>
          <P>
            The contrast is just as instructive. In <em>Ferlito v. Harbor Freight
            Tools</em> (E.D.N.Y., Apr. 2025), a long-experienced expert drafted his
            report independently and used an AI tool only to{" "}
            <strong>confirm conclusions he had already reached on his own</strong>.
            The court allowed the testimony. The difference wasn&apos;t whether AI
            touched the work. It was that the expert&apos;s own judgment drove the
            opinion, the AI didn&apos;t originate anything, and the expert could
            stand behind every word.
          </P>
          <P>
            That is the safe-harbor pattern the cases keep pointing to: AI as an
            assistant the expert supervises and verifies, never a substitute for
            the expert&apos;s analysis.
          </P>

          <H2>The new frontier: your AI use may be discoverable</H2>
          <P>
            Striking a bad citation is one thing. The more structural shift is in
            discovery. In <em>Conservation Law Foundation v. Shell Oil</em> (D.
            Conn.), a magistrate judge ordered an expert to produce the AI prompts
            she had used to narrow a large document production. The judge held that
            the process was &ldquo;part of that methodology and therefore
            discoverable&rdquo; under Rule 26, and rejected the argument that the
            prompts were protected &ldquo;notes.&rdquo;
          </P>
          <P>
            Two cautions on that ruling. First, it is a magistrate decision that,
            as of this writing, has been objected to under Rule 72(a) and stayed
            pending the district judge&apos;s review. So it is a signal of where
            things are heading, not settled law. Second, the principle behind it
            is not new. An expert&apos;s methodology has always been fair game on
            cross. What is new is the recognition that <em>how you prompted an AI
            tool</em> can be part of that methodology. If that holds, an expert who
            can&apos;t reconstruct what the tool was given and what it produced is
            exposed.
          </P>

          <H2>Why this fits Rule 26 and Rule 702</H2>
          <P>
            None of this is a special &ldquo;AI rule.&rdquo; It is the existing
            framework applied to a new tool. Rule 26(a)(2)(B) already requires a
            report to disclose the <strong>basis and reasons</strong> for each
            opinion and the <strong>facts or data the expert considered</strong>.
            Amended Rule 702 (effective December 2023) requires that the opinion
            rest on <strong>sufficient facts or data</strong> and reflect a{" "}
            <strong>reliable application</strong> of reliable methods, and it puts the
            burden on the party offering it. Outsource part of the analysis to a
            tool you can&apos;t explain or verify, and you put both of those at
            risk. Keep the opinion your own, with the tool in a supporting role you
            can account for, and you don&apos;t.
          </P>

          <H2>A practical checklist for using AI in an expert report</H2>
          <ul className="reveal mt-5 space-y-3">
            {[
              "Stay the author. The opinions, findings, and conclusions are yours. A tool can organize and format what you supplied; it should never originate a fact, a number, an opinion, or a citation.",
              "Verify every citation and figure against the source, by hand. The fastest way to lose a declaration is to let a tool insert a reference you didn't check.",
              "Don't let a tool reach past your evidence. If a sentence can't be tied to something you actually provided, treat it as a gap to resolve, not text to keep.",
              "Keep a methodology record. Note which tool and version you used, on which sections, and what you gave it, at the time and not reconstructed after a motion to compel.",
              "Be ready to produce it. Assume your AI interactions could be discoverable as methodology, and keep them in a form you'd be comfortable handing to opposing counsel.",
              "Tell retaining counsel. Disclosure questions are easier to answer before a deposition than during one.",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <svg className="mt-1 h-4 w-4 shrink-0 text-blue-800" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path fillRule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.79 6.8-6.79a1 1 0 0 1 1.4 0Z" clipRule="evenodd" />
                </svg>
                <span className="text-[17px] leading-relaxed text-slate-700">{item}</span>
              </li>
            ))}
          </ul>

          <H2>Where this is heading</H2>
          <P>
            As of mid-2026 there is still no uniform, expert-specific rule
            mandating AI disclosure; the obligation is being shaped case by case.
            But the direction is hard to miss. The experts who get hurt are the
            ones who let a tool do the thinking and couldn&apos;t account for it.
            The experts who are fine kept their own judgment in the chair and could
            show their work. The safe posture is the same one good experts have
            always had. Own your methodology, and extend that habit to a new tool you
            should expect to explain.
          </P>

          {/* Honest product note */}
          <div className="lift reveal mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:mt-12">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-800">
              How we think about this
            </p>
            <p className="mt-2 text-[17px] leading-relaxed text-slate-700">
              This is the exact problem <strong>Disclosed.</strong> is built
              around. It structures your own findings into a Rule 26(a)(2)(B)
              report, refuses to add a fact or citation that isn&apos;t already in
              your evidence, flags anything ungrounded for your review, and keeps
              an automatic, tamper-evident AI-disclosure record of how the tool was
              used. That is the kind of methodology record these cases are starting
              to ask for. You remain the preparing and signing expert;
              admissibility is, as always, the
              court&apos;s call.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/sample"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-900 px-5 text-sm font-semibold text-white no-underline transition hover:bg-blue-950"
              >
                See a sample report &amp; disclosure appendix →
              </Link>
              <Link
                href="/#waitlist"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 no-underline transition hover:bg-slate-50"
              >
                Request early access
              </Link>
            </div>
          </div>

          <H2>Sources</H2>
          <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
            <li>Kohls v. Ellison, No. 24-cv-3754, 2025 WL 66514 (D. Minn. Jan. 10, 2025).</li>
            <li>Concord Music Group, Inc. v. Anthropic PBC, No. 24-cv-03811, 2025 WL 1482734 (N.D. Cal. May 2025).</li>
            <li>Matter of Weber, 85 Misc. 3d 727 (N.Y. Sur. Ct. 2024).</li>
            <li>Ferlito v. Harbor Freight Tools USA, Inc., No. 20-CV-5615, 2025 WL 1181699 (E.D.N.Y. Apr. 23, 2025).</li>
            <li>Conservation Law Foundation v. Shell Oil Co., No. 3:21-cv-00933 (D. Conn.) (magistrate order on AI prompts, under Rule 72(a) review).</li>
            <li>Fed. R. Civ. P. 26(a)(2)(B); Fed. R. Evid. 702 (as amended Dec. 1, 2023).</li>
          </ul>

          <p className="mt-10 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-relaxed text-amber-900">
            <strong>General information, not legal advice.</strong> Disclosed. is a
            software company, not a law firm. Case descriptions are summaries;
            <em> Conservation Law Foundation v. Shell</em> in particular is a
            non-final order under review and may change. Consult counsel about your
            own matter, and verify any authority against the official reporter
            before relying on it.
          </p>
        </div>
      </article>
    </div>
  );
}
