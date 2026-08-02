import Link from "next/link";
import type { Metadata } from "next";
import { getArticle } from "../articles";

const article = getArticle("rule-26-expert-report-checklist")!;

export const metadata: Metadata = {
  title: article.title,
  description: article.dek,
  alternates: { canonical: "/resources/rule-26-expert-report-checklist" },
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
          <span className="rounded-md bg-blue-50 px-2.5 py-0.5 text-blue-800">
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
            Federal Rule of Civil Procedure 26(a)(2)(B) lists six things a
            retained expert&apos;s written report must contain. They are not
            aspirational. They are the floor. When a report is missing one of
            them, or addresses it too thinly, opposing counsel has a ready
            motion. Under Rule 37(c)(1), a party that fails to make the required
            disclosure is presumptively barred from using that information or
            witness at trial or on a motion, unless the failure was substantially
            justified or harmless. The burden of showing justification or harmlessness
            falls on the party offering the expert, not on the party objecting.
          </P>
          <P>
            The six elements are well settled. What varies, and what actually
            gets reports struck or testimony limited, is whether each element is
            addressed with enough specificity. This checklist works through each
            one in plain English: what the rule calls for, and what reviewers and
            opposing counsel look for when they read the report.
          </P>

          <H2>The six required elements</H2>

          <h3 className="mt-8 text-xl font-semibold tracking-tight text-slate-900">
            (i) A complete statement of all opinions and the basis and reasons for them
          </h3>
          <P>
            This is the core of the report. The rule requires not just the
            conclusion but the reasoning path: why this opinion, grounded in
            what. &ldquo;Complete&rdquo; is doing real work in that phrase.
            Courts have excluded supplemental opinions offered at trial when they
            were not in the original report, even if the expert could have formed
            them earlier. Here is the practical test. If an opinion the expert
            intends to give at trial isn&apos;t in the report with its basis and
            reasons, it is at risk.
          </P>
          <P>
            Opposing counsel will look for opinions stated as conclusions without
            the underlying reasoning, and for opinions that seem to have appeared
            after the disclosure deadline. Both invite a motion to exclude or
            limit.
          </P>

          <h3 className="mt-8 text-xl font-semibold tracking-tight text-slate-900">
            (ii) The facts or data the expert considered
          </h3>
          <P>
            The report must disclose what the expert actually reviewed and relied
            on. Not a general description of the type of materials an expert in
            this field typically considers, but the specific records, data sets,
            studies, and other materials this expert looked at in forming these
            opinions. If a document was reviewed, it belongs in the list. If the
            expert considered it and set it aside, that too is within the scope of
            &ldquo;considered.&rdquo;
          </P>
          <P>
            The consequence of incompleteness here is exposure on cross: opposing
            counsel can challenge an opinion by showing the expert considered
            materials not listed (suggesting something was concealed) or failed to
            consider materials that were available (suggesting the opinion is
            incomplete). The list is the chain of custody for the expert&apos;s
            reasoning.
          </P>

          <h3 className="mt-8 text-xl font-semibold tracking-tight text-slate-900">
            (iii) Any exhibits used to summarize or support the opinions
          </h3>
          <P>
            Exhibits that will be used at trial to summarize or support the
            opinions must be identified in the report. This includes charts,
            tables, timelines, photographs, and any other visual or documentary
            aids the expert intends to use. The purpose of this requirement is to
            give opposing counsel a fair opportunity to examine and challenge the
            supporting materials before trial, not to encounter them for the
            first time at the witness stand.
          </P>
          <P>
            Exhibits identified in the report are not automatically admitted; they
            still need to clear the usual evidentiary thresholds. But exhibits the
            expert plans to use that are absent from the report are a straightforward
            target for exclusion.
          </P>

          <h3 className="mt-8 text-xl font-semibold tracking-tight text-slate-900">
            (iv) The witness&apos;s qualifications, including all publications in the previous 10 years
          </h3>
          <P>
            The qualifications section must include a list of the witness&apos;s
            publications from the previous ten years. A curriculum vitae attached
            to the report generally satisfies this, but only if the CV itself
            contains that information accurately. An incomplete or outdated CV
            creates a credibility problem that opposing counsel will find, whether
            it omits publications, misstates dates, or lists credentials that have
            lapsed.
          </P>
          <P>
            Relevant qualifications for the opinions at issue should be legible in
            the report itself, not just attached as a background document. A judge
            ruling on a Daubert challenge, or a jury evaluating the expert, benefits
            from understanding why this person is qualified to offer these specific
            opinions.
          </P>

          <h3 className="mt-8 text-xl font-semibold tracking-tight text-slate-900">
            (v) A list of all other cases in which the witness testified in the previous 4 years
          </h3>
          <P>
            The report must include a list of every case in which the expert
            testified (at trial or by deposition) during the previous four years.
            The list should identify the case by name, court, and docket number
            where available, and note whether the testimony was at trial or
            deposition. This section exists to allow opposing counsel to locate
            and review prior testimony, looking for inconsistencies between what
            the expert has said in other matters and what the expert is saying now.
          </P>
          <P>
            A thin or missing prior-testimony section is one of the most commonly
            flagged incompleteness issues. An expert who testifies regularly and
            produces a list of only a handful of cases will face questions about
            what was left off. This section should be thorough and current to the
            report date.
          </P>

          <h3 className="mt-8 text-xl font-semibold tracking-tight text-slate-900">
            (vi) A statement of the compensation to be paid
          </h3>
          <P>
            The report must state the compensation the expert is being paid for
            the study and testimony. This requirement exists because an
            expert&apos;s financial relationship with the retaining party is
            fair game on cross-examination. It bears on potential bias. The
            statement should cover the expert&apos;s rate and, where the
            arrangement is relevant, whether compensation depends on the outcome
            of the litigation (which it generally should not).
          </P>
          <P>
            This element is brief, but its absence is noticed. Opposing counsel
            reviewing a report for Rule 26 completeness will check for it, and a
            missing compensation statement is an easy motion.
          </P>

          <H2>Where reports actually fall short</H2>
          <P>
            The six elements are well known to experienced expert witnesses. The
            gaps that generate motions tend to fall into a smaller set of recurring
            patterns.
          </P>
          <ul className="reveal mt-5 space-y-3">
            {[
              "Opinions stated without the basis shown. The expert gives the conclusion (a range, a finding, a determination), but the report does not walk through the reasoning that produced it. This is the element (i) failure mode, and it is the one most likely to support a Daubert exclusion on top of a Rule 26 objection.",
              "Materials considered but not disclosed. An expert reviews a document, forms a view of it, and the document does not appear in the element (ii) list. Whether or not the expert relied on it in the final opinion, it was considered. And the rule requires disclosure of what was considered, not just what was ultimately cited.",
              "A thin or missing prior-testimony section. The element (v) list covers four years of trial and deposition testimony, across all cases. Experts who testify regularly often underestimate how long that list should be, or omit cases they view as minor or unrelated.",
              "Supplementation handled late. Rule 26(e) requires a party to supplement or correct an expert disclosure in a timely manner. When new information emerges or the expert forms additional opinions, supplementation that comes close to or after the discovery cutoff can be challenged as untimely. And untimely supplements often do not cure the original deficiency for purposes of Rule 37(c)(1).",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <svg className="mt-1 h-4 w-4 shrink-0 text-blue-800" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path fillRule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.79 6.8-6.79a1 1 0 0 1 1.4 0Z" clipRule="evenodd" />
                </svg>
                <span className="text-[17px] leading-relaxed text-slate-700">{item}</span>
              </li>
            ))}
          </ul>

          <H2>Completeness and Rule 702: what they do and don&apos;t do for each other</H2>
          <P>
            Rule 26(a)(2)(B) governs what a report must contain. Federal Rule of
            Evidence 702, as amended effective December 1, 2023, governs whether
            the opinion is reliable enough to reach the jury. They operate at
            different stages (Rule 26 at disclosure, Rule 702 at the admissibility
            hearing), but they are related in a practical way.
          </P>
          <P>
            The 2023 amendments to Rule 702 made explicit what courts had long
            applied: the opinion must rest on sufficient facts or data and reflect a
            reliable application of reliable methods, and the burden is on the party
            offering the expert to establish those requirements by a preponderance
            of the evidence. The court, not the jury, decides whether the expert
            clears the threshold. <em>Daubert v. Merrell Dow Pharmaceuticals,
            Inc.</em>, 509 U.S. 579 (1993), and the cases that followed it, are
            the framework courts use to apply that reliability screen.
          </P>
          <P>
            A complete Rule 26 report supports reliability by making the
            methodology visible: the data that was considered, the reasoning path
            from that data to the opinion, the expert&apos;s qualifications to
            apply the method. Completeness does not guarantee that the opinion will
            survive a Daubert challenge; that depends on the underlying methodology.
            But incompleteness makes a Daubert challenge easier: a report that
            conceals or omits the basis for an opinion gives the court less to
            evaluate, and the burden is on the proponent. Completeness is not
            sufficient for admissibility, but incompleteness is often sufficient
            for exclusion.
          </P>

          {/* Honest product note */}
          <div className="lift mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:mt-12">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-800">
              How we think about this
            </p>
            <p className="mt-2 text-[17px] leading-relaxed text-slate-700">
              This is the structure <strong>Disclosed.</strong> is built around.
              The tool organizes your own findings into a report that tracks every
              Rule 26(a)(2)(B) element: opinions with their basis and reasons,
              materials considered, exhibits, qualifications, prior testimony, and
              compensation. It then flags any element that is missing or thin before
              you export. You supply the substance; the tool handles the structure
              and surfaces the gaps. Admissibility is, as always, the court&apos;s
              determination. We don&apos;t make that call, and neither can any
              software.
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
            <li>Fed. R. Civ. P. 26(a)(2)(B).</li>
            <li>Fed. R. Civ. P. 37(c)(1).</li>
            <li>Fed. R. Evid. 702 (as amended Dec. 1, 2023).</li>
            <li>Daubert v. Merrell Dow Pharmaceuticals, Inc., 509 U.S. 579 (1993).</li>
          </ul>

          <p className="mt-10 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-relaxed text-amber-900">
            <strong>General information, not legal advice.</strong> Disclosed. is a
            software company, not a law firm. This article describes federal procedural
            rules in general terms; rules vary by jurisdiction and local rule, and
            courts interpret and apply them differently. Verify all requirements
            against the official rules and any applicable local rules, and consult
            counsel about your own matter before relying on anything here.
          </p>
        </div>
      </article>
    </div>
  );
}
