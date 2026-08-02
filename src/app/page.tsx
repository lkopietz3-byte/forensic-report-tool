import { RULE_26_ELEMENTS } from "@/lib/domain/rule26";
import { isBillingLive } from "@/lib/billing/stripe";
import { Waitlist } from "./_components/Waitlist";
import { MobileNav } from "./_components/MobileNav";
import { TryItDemo } from "./_components/TryItDemo";

const STEPS = [
  {
    n: "01",
    title: "Bring the findings and sources you already trust",
    body: "Add your confirmed findings, source labels, and supporting material. PDFs, Word files, spreadsheets, and scans can be read in your browser and separated into citable evidence items for you to check.",
  },
  {
    n: "02",
    title: "Your findings, structured into the report",
    body: "Your stated findings go into your discipline's standard format, with every Rule 26(a)(2)(B) element in its place. Each factual sentence must carry a source marker you supplied, and you verify that the source actually supports it.",
  },
  {
    n: "03",
    title: "You review, sign, and take the record with you",
    body: "Edit it the way you would any report issued under your name. Then export Word and PDF with the evidence map and AI-Use Disclosure attached.",
  },
];

const GUARDRAILS = [
  {
    title: "Evidence-constrained by design",
    body: "The drafting prompt restricts the model to your supplied findings. Every factual sentence must carry one of your source IDs; missing or unknown citations are flagged and block export. You still verify the meaning and support.",
  },
  {
    title: "Every sentence cites your evidence",
    body: "Every factual sentence has to cite a source you supplied. If a sentence has no such citation, or points to a source that isn't in your file, it gets flagged for your review before the report can be finalized.",
  },
  {
    title: "You prepare, adopt, and sign",
    body: "You review, edit, independently verify, adopt, and sign. The software assists with structure and citations; it does not replace your professional judgment or testify.",
  },
  {
    title: "A clear early-access data boundary",
    body: "The worked example needs no case data. During early access, use fictional or de-identified material only. Anthropic's standard API retention is up to 30 days; zero-data-retention and counsel-reviewed terms are not yet in place.",
  },
];

const TRUST = [
  "Worked example needs no case data",
  "Anyone can independently verify the AI-use record",
  "You prepare, verify, and sign every report",
  "No-AI mode is available from the start",
  "Citation IDs resolve only to sources you provide",
  "First report export is free",
];

const DELIVERABLES = [
  {
    n: "01",
    title: "Editable expert report",
    body: "A Rule 26(a)(2)(B)-organized report in Word and PDF, built from the findings you supplied and ready for your own substantive review.",
  },
  {
    n: "02",
    title: "Sentence-level evidence map",
    body: "Numbered citations connect each factual sentence to a source in your file. Unsupported text stays visible as a gap instead of being quietly filled.",
  },
  {
    n: "03",
    title: "AI-Use Disclosure Appendix",
    body: "A section-by-section record of whether AI was used, which model and version ran, and which evidence it received.",
  },
  {
    n: "04",
    title: "Independent verification file",
    body: "A portable manifest lets anyone recompute the tamper-evident hash chain in their own browser, without an account or an upload.",
  },
];

const AUDIENCES = [
  {
    label: "For experts",
    title: "Less assembly. Full authorship.",
    body: "Take the mechanical structure, citation tracking, and disclosure record off your plate while every fact, number, and opinion remains yours.",
    href: "/for-experts",
    cta: "See the expert program",
  },
  {
    label: "For retaining counsel",
    title: "Know what is behind the report before discovery.",
    body: "Receive a traceable report and a methodology record you can review with the expert before opposing counsel asks how AI touched the work.",
    href: "/for-counsel",
    cta: "Open the counsel explainer",
  },
  {
    label: "For firms",
    title: "Turn informal AI use into a process you can explain.",
    body: "The individual-expert workflow works today. Founding firms help shape the shared templates, controls, and billing needed for a practice-wide rollout.",
    href: "/for-firms",
    cta: "Shape the firm plan",
  },
];

const DISCIPLINE_ROADMAP = [
  {
    status: "Founding pilot",
    statusTone: "live",
    name: "Vocational rehabilitation",
    detail: "Live worked workflow",
    href: "/sample",
  },
  {
    status: "Expert validation",
    statusTone: "preview",
    name: "Forensic engineering",
    detail: "ASTM E3176-24-informed preview",
    href: "/sample?d=engineering",
  },
  {
    status: "Expert validation",
    statusTone: "preview",
    name: "Accident reconstruction",
    detail: "Methods-and-uncertainty preview",
    href: "/sample?d=reconstruction",
  },
] as const;

const PRICING = [
  {
    name: "Founding expert pilot",
    price: "$0",
    unit: "/ first pilot",
    note: "Application · de-identified early access",
    save: "Start here",
    blurb:
      "Run one complete, de-identified report with the founder and tell us where the workflow or discipline template is wrong before real-matter access opens.",
    features: [
      "Full report build and export",
      "Full AI-Disclosure Appendix",
      "Direct onboarding and support",
      "Your feedback shapes the vocational template",
    ],
    cta: "Apply for the founding pilot",
    href: "/for-experts#application",
    plan: null,
    featured: true,
  },
  {
    name: "Pay per report",
    price: "$250",
    unit: "/ report",
    note: "Target post-pilot list price",
    save: "No subscription",
    blurb:
      "When real-matter access opens, buy only when a case needs it. We are validating this price with the founding cohort before treating it as final.",
    features: [
      "First production report free",
      "Planned five-pack: $1,000",
      "Full AI-Disclosure Appendix",
      "Word + PDF of the same report",
    ],
    cta: "Join the founding cohort",
    href: "/for-experts#application",
    plan: "single",
    featured: false,
  },
];

const STATS = [
  {
    stat: "3–5 hrs",
    label: "of write-up a report can eat",
    body: "The separable assembly-and-formatting work. It's the slow part this tool exists to take off your plate.",
  },
  {
    stat: "Rule 26",
    label: "every element covered",
    body: "Each required element accounted for, with citations that resolve back to the evidence you supplied.",
  },
  {
    stat: "Discoverable",
    label: "so build the record while you work",
    body: "Courts are scrutinizing expert AI use. Disclosed. records the model, evidence, and section while the report is assembled instead of asking you to reconstruct it later.",
  },
];

const FAQ = [
  {
    q: "If my AI use is questioned, what's my answer?",
    a: "It's already documented. The AI-Disclosure Appendix is part of your report: every AI-assisted section, the model and version, and the exact evidence the tool was given. If the question comes up through retaining counsel, discovery, or cross-examination, the record exists and travels with the report instead of being reconstructed from memory months later. In Conservation Law Foundation v. Shell (2026), a magistrate ordered production of prompts used in an expert's document-review methodology. That order is stayed under district-court review, so it is a live warning, not settled law.",
  },
  {
    q: "Does using this make my report inadmissible?",
    a: "Admissibility is always the court's call, and no tool can promise it either way. What sank experts in cases like Kohls v. Ellison (2025) was AI that fabricated citations and an expert who didn't catch them. This tool is designed against that exact failure: every citation must resolve to a source you supplied, anything ungrounded is flagged, and export is blocked until you resolve it, with you in the chair as the reviewing author.",
  },
  {
    q: "Who is the author of the report?",
    a: "Federal Rule 26 requires a covered report to be prepared and signed by the witness. You review, edit, independently verify, adopt, and sign the report. The software assists with structure and source linkage; it does not make a legal determination about authorship or replace your professional judgment.",
  },
  {
    q: "Do I have to use AI at all?",
    a: "No. A no-AI mode formats and citation-checks your report with a fixed, rule-based engine. No model writes a word. You get the same structure, the same “every sentence cites your evidence” guardrail, and a disclosure that states plainly that no AI produced any text. Turn on AI assistance only where you want it.",
  },
  {
    q: "What if the tool gets a fact wrong?",
    a: "Every factual sentence must carry a source ID you supplied; a missing or unknown ID blocks export. A valid source marker does not prove that the source actually supports the sentence, so you must compare the output to the source and independently verify every fact, method, and opinion before signing.",
  },
  {
    q: "How is my case data handled?",
    a: "The worked example needs no case data. During early access, use only fictional or properly de-identified material. Original document bytes are read in your browser; confirmed text is sent to our server and, when AI is on, to Anthropic under standard API retention of up to 30 days. We do not yet have zero-data-retention or counsel-reviewed terms for real-matter use.",
  },
];

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-slate-300 bg-white/70 px-3 py-1 text-xs font-medium text-slate-700">
      {children}
    </span>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.79 6.8-6.79a1 1 0 0 1 1.4 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M10 2a1 1 0 0 1 1 1v7.59l2.3-2.3a1 1 0 1 1 1.4 1.42l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.42l2.3 2.3V3a1 1 0 0 1 1-1Z" />
      <path d="M4 14a1 1 0 0 1 1 1v1h10v-1a1 1 0 1 1 2 0v1.5A1.5 1.5 0 0 1 15.5 18h-11A1.5 1.5 0 0 1 3 16.5V15a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

function CiteChip({ n }: { n: number }) {
  return (
    <span className="mx-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded bg-blue-100 px-1 align-super text-[10px] font-semibold text-blue-700">
      {n}
    </span>
  );
}

// A faithful, honest preview of the actual product surface: grounded sentences
// tinted green, blue citation chips that resolve to the supplied evidence, an
// open item the tool refuses to fill, and the tamper-evident disclosure badge.
// Built from the real sample matter — no overclaim, just what the tool does.
function ReportPreview() {
  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 ring-1 ring-slate-900/5">
        <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="ml-2 truncate text-xs font-medium text-slate-400">
            Alvarez v. Brightline, Expert Report (sample)
          </span>
        </div>
        <div className="grid sm:grid-cols-[1fr_230px]">
          <div className="p-6 text-left">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Pre- vs. Post-Injury Earning Capacity
              </h3>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Tamper-evident
              </span>
            </div>
            <div className="mt-4 space-y-2 text-[13px] leading-relaxed text-slate-700">
              <p className="rounded-r border-l-2 border-emerald-300 bg-emerald-50/50 px-3 py-1.5">
                Pre-injury earning capacity averaged $72,400 per year
                <CiteChip n={1} />.
              </p>
              <p className="rounded-r border-l-2 border-emerald-300 bg-emerald-50/50 px-3 py-1.5">
                Post-injury occupations pay $44,000–$52,000 per year
                <CiteChip n={2} />, corroborated by BLS wage data
                <CiteChip n={3} />.
              </p>
              <p className="rounded-r border-l-2 border-amber-300 bg-amber-50/60 px-3 py-1.5 text-amber-900">
                [Expert input needed: the adopted post-injury figure]
              </p>
            </div>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800">
              <CheckIcon className="h-3.5 w-3.5" />
              Every sentence traces to a source you supplied
            </div>
          </div>
          <div className="border-t border-slate-100 bg-slate-50/60 p-5 text-left sm:border-l sm:border-t-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Evidence you supplied
            </p>
            <ul className="mt-3 space-y-2.5 text-xs text-slate-600">
              {[
                [1, "W-2 records, 2019–2022"],
                [2, "Labor market survey, Tbl. 2"],
                [3, "BLS OEWS wage data"],
              ].map(([n, label]) => (
                <li key={n} className="flex items-start gap-2">
                  <span className="mt-px inline-flex h-4 min-w-4 items-center justify-center rounded bg-blue-100 px-1 text-[10px] font-semibold text-blue-700">
                    {n}
                  </span>
                  <span>{label}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[11px] leading-relaxed text-slate-600">
              Citation markers must resolve to this list. You still verify that
              each source actually supports the sentence.
            </p>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-slate-500">
        Straight from the sample export: grounded sentences cited to your
        evidence, with the open items the tool refuses to fill in for you.
      </p>
    </div>
  );
}

const iconProps = {
  className: "h-5 w-5",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const STEP_ICONS = [
  // Upload / case file
  <svg key="0" {...iconProps}>
    <path d="M12 16V4m0 0L8 8m4-4 4 4" />
    <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </svg>,
  // Structure / document with lines
  <svg key="1" {...iconProps}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5M8.5 13h7M8.5 16.5h5" />
  </svg>,
  // Sign / shield-check
  <svg key="2" {...iconProps}>
    <path d="M12 3 5 6v5c0 4 3 7 7 8 4-1 7-4 7-8V6z" />
    <path d="m9 11.5 2 2 4-4" />
  </svg>,
];

const STAT_ICONS = [
  // Clock — time saved
  <svg key="s0" {...iconProps}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5l3.5 2" />
  </svg>,
  // Document-check — Rule 26 coverage
  <svg key="s1" {...iconProps}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
    <path d="m8.5 14 2 2 4-4" />
  </svg>,
  // Balance scale — discoverability / the court
  <svg key="s2" {...iconProps}>
    <path d="M12 3v18M6 21h12M4 7h16" />
    <path d="M7 7l-3 6h6l-3-6ZM17 7l-3 6h6l-3-6Z" />
  </svg>,
];

export default function Home() {
  // When billing is live, pricing CTAs go straight to the in-app purchase flow
  // (auth + checkout live there); otherwise they fall back to the waitlist.
  const billingLive = isBillingLive();
  // FAQ structured data (rich results). Built from the same FAQ array rendered below.
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
  return (
    <div className="bg-slate-50 text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {/* Nav */}
      <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-slate-50/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-900 text-sm font-bold text-white">
              D
            </div>
            <span className="text-sm font-semibold tracking-tight">
              Disclosed<span className="text-blue-800">.</span>
            </span>
          </div>
          <nav
            aria-label="Primary"
            className="hidden items-center gap-6 whitespace-nowrap text-sm text-slate-700 lg:flex"
          >
            <a href="#how" className="transition hover:text-slate-900">
              How it works
            </a>
            <a href="#disclosure" className="transition hover:text-slate-900">
              AI disclosure
            </a>
            <a href="#faq" className="transition hover:text-slate-900">
              FAQ
            </a>
            <a href="#pricing" className="transition hover:text-slate-900">
              Pricing
            </a>
            <a href="/sample" className="transition hover:text-slate-900">
              Sample report
            </a>
            <a href="/resources" className="transition hover:text-slate-900">
              Resources
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <a
              href="/workspace"
              className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-950"
            >
              <span className="hidden sm:inline">Try the worked example</span>
              <span className="sm:hidden">Try it</span>
            </a>
            <MobileNav />
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(30,58,138,0.10),transparent)]"
          />
          <div className="mx-auto max-w-6xl px-6 pb-14 pt-10 sm:pb-20 sm:pt-24">
            <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
              <div className="max-w-xl">
                <div className="mb-5 flex flex-wrap items-center gap-2">
                  <Pill>Rule 26(a)(2)(B)-organized</Pill>
                  <Pill>Evidence-linked</Pill>
                  <Pill>AI-use disclosed</Pill>
                </div>
                <h1 className="text-balance text-[2.55rem] font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem] lg:leading-[1.04]">
                  Structure your findings into a report you can
                  <span className="text-blue-800"> explain line by line</span>
                </h1>
                <p className="mt-6 max-w-xl text-[1.05rem] leading-relaxed text-slate-700 sm:text-lg">
                  Disclosed. turns the findings and sources you confirm into a
                  Rule 26 report, a sentence-level evidence map, and an
                  independently verifiable AI-use record. Its drafting workflow
                  is constrained to your supplied material, and you verify every
                  source relationship and conclusion before signing.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="/workspace"
                    className="inline-flex h-12 items-center justify-center rounded-xl bg-blue-900 px-6 text-base font-semibold text-white shadow-sm transition hover:bg-blue-950"
                  >
                    Try the worked example
                    <span className="ml-2" aria-hidden>→</span>
                  </a>
                  <a
                    href="/sample"
                    className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-base font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
                  >
                    Inspect the full sample
                  </a>
                </div>
                <p className="mt-3 text-sm font-medium text-slate-700">
                  No account or card. Starts with fictional data. Your first
                  report export is free.
                </p>
                <p className="mt-3 max-w-md text-sm text-slate-600">
                  Built first for vocational-rehabilitation &amp; earning-capacity
                  experts. Use sample or de-identified material during early
                  access while final confidentiality terms are under review.
                </p>
              </div>

              {/* The static preview is proof-of-concept; on phones it's ~700px of
                  scroll and the live interactive demo further down covers the same
                  ground, so we show it from lg up. */}
              <div className="hidden lg:block lg:pl-4">
                <ReportPreview />
              </div>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-slate-200/70 pt-8 text-sm text-slate-600">
                <span className="font-medium text-slate-700">Take the sample with you:</span>
                <a
                  href="/api/export/sample/pdf"
                  className="inline-flex items-center gap-1 font-semibold text-blue-800 transition hover:text-blue-950"
                >
                  <DownloadIcon className="h-3.5 w-3.5" />
                  PDF
                </a>
                <span aria-hidden className="text-slate-300">
                  ·
                </span>
                <a
                  href="/api/export/sample"
                  className="inline-flex items-center gap-1 font-semibold text-blue-800 transition hover:text-blue-950"
                >
                  <DownloadIcon className="h-3.5 w-3.5" />
                  Word (.docx)
                </a>
            </div>
          </div>
        </section>

        {/* Trust strip */}
        <section
          aria-label="Our commitments"
          className="border-y border-slate-200 bg-white"
        >
          <ul className="mx-auto grid max-w-6xl gap-3 px-6 py-5 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST.map((t) => (
              <li key={t} className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4 shrink-0 text-blue-800" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* One platform, with discipline depth validated before breadth ships. */}
        <section
          aria-labelledby="disciplines-title"
          className="border-b border-slate-200 bg-slate-50/70"
        >
          <div className="mx-auto grid max-w-6xl gap-5 px-6 py-8 lg:grid-cols-[1fr_2fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-800">
                Discipline roadmap
              </p>
              <h2 id="disciplines-title" className="mt-1 text-xl font-semibold tracking-tight">
                One platform. Each methodology earns its way in.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Vocational rehabilitation is the beachhead. Two adjacent
                disciplines are available as transparent previews—not generic
                templates passed off as finished products.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {DISCIPLINE_ROADMAP.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="group rounded-xl border border-slate-200 bg-white p-4 no-underline shadow-sm transition hover:border-blue-300 hover:shadow-md"
                >
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      item.statusTone === "live"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {item.status}
                  </span>
                  <h3 className="mt-2 text-sm font-semibold text-slate-900">
                    {item.name}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    {item.detail}
                  </p>
                  <span className="mt-3 inline-flex text-xs font-semibold text-blue-800 group-hover:text-blue-950">
                    Inspect <span className="ml-1" aria-hidden>→</span>
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Concrete product outputs — what the buyer takes away from one build. */}
        <section id="deliverables" aria-labelledby="deliverables-title" className="border-b border-slate-200 bg-slate-950 text-white">
          <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-300">
              One build, four deliverables
            </p>
            <div className="mt-2 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
              <h2 id="deliverables-title" className="max-w-2xl text-3xl font-semibold tracking-tight">
                Not just a document. The report and the record behind it.
              </h2>
              <a href="/sample" className="font-semibold text-blue-300 transition hover:text-blue-200">
                Inspect every deliverable in the sample →
              </a>
            </div>
            <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-slate-700 bg-slate-700 sm:grid-cols-2 lg:grid-cols-4">
              {DELIVERABLES.map((item) => (
                <div key={item.n} className="bg-slate-900 p-6">
                  <span className="font-mono text-xs font-semibold text-blue-300">{item.n}</span>
                  <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The shift / why now */}
        <section aria-label="Why now" className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-800">
              Why now
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              The math, and the moment
            </h2>
            <div className="reveal mt-10 grid gap-5 sm:grid-cols-3">
              {STATS.map((s, i) => (
                <div
                  key={s.stat}
                  className="lift relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/70 p-7 shadow-sm"
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-blue-50/70 blur-2xl"
                  />
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-800">
                    {STAT_ICONS[i]}
                  </div>
                  <p className="mt-5 text-4xl font-semibold tracking-tight text-slate-900">
                    {s.stat}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-blue-800">{s.label}</p>
                  <p className="mt-3 text-base leading-relaxed text-slate-600">
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-6xl px-6 py-12 sm:py-20">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight">
              From case file to signed report
            </h2>
            <p className="mt-3 text-base text-slate-700">
              Three steps, built around the rule that matters most in court: your
              findings drive the report, not the model.
            </p>
          </div>
          <div className="reveal mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div
                key={s.n}
                className="lift rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-800">
                    {STEP_ICONS[i]}
                  </span>
                  <span className="text-sm font-semibold text-slate-300">
                    {s.n}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-base leading-relaxed text-slate-700">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
            <a
              href="/intake"
              className="inline-flex items-center gap-1.5 text-base font-semibold text-blue-800 transition hover:text-blue-950"
            >
              Try it with a de-identified document <span aria-hidden>→</span>
            </a>
            <a
              href="/sample"
              className="inline-flex items-center gap-1.5 text-base font-medium text-slate-700 transition hover:text-slate-900"
            >
              or see a finished sample <span aria-hidden>→</span>
            </a>
          </div>
        </section>

        {/* AI-Disclosure Appendix — the moat */}
        <section id="disclosure" className="bg-slate-900 text-slate-100">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-12 sm:py-20 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-300">
                The difference
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                An AI-Disclosure Appendix, generated automatically
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-300">
                In <em>Conservation Law Foundation v. Shell</em> (2026), a federal
                magistrate judge ordered an expert to produce the AI prompts she
                had used to narrow a large document production, treating them as
                discoverable rather than protected notes (the order is now under
                district-court review). In{" "}
                <em>Kohls v. Ellison</em> (2025), an expert declaration was struck
                after AI-hallucinated citations slipped through. The decisions
                are fact-specific, and the Shell order is stayed under review,
                but they make one risk practical: an expert may be asked to
                explain how AI touched the work.
              </p>
              <p className="mt-4 text-base leading-relaxed text-slate-300">
                Every draft sits on top of an append-only audit log. The tool
                turns that log into a disclosure appendix: each AI-assisted
                section, the model and version, and the evidence it was given.
                Nothing else. Whether a given disclosure satisfies a particular
                court is, as ever, the judge&apos;s call.
              </p>
              <p className="mt-4 text-base leading-relaxed text-slate-300">
                And you don&apos;t have to take our word that the record is intact.
                Anyone holding the disclosure file — you, retaining counsel, even
                opposing counsel — can recompute its SHA-256 hash chain right in
                their own browser, with no account and nothing uploaded. The
                record is useful because it can be checked, not because we ask
                anyone to trust our label.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                <a
                  href="/verify"
                  className="inline-flex items-center gap-1.5 text-base font-semibold text-blue-300 transition hover:text-blue-200"
                >
                  Verify a record yourself <span aria-hidden>→</span>
                </a>
                <a
                  href="/sample"
                  className="inline-flex items-center gap-1.5 text-base font-semibold text-blue-300 transition hover:text-blue-200"
                >
                  See a sample disclosure appendix <span aria-hidden>→</span>
                </a>
                <a
                  href="/resources/ai-disclosure-in-expert-reports"
                  className="inline-flex items-center gap-1.5 text-base font-medium text-slate-300 transition hover:text-white"
                >
                  What the 2025–2026 rulings mean <span aria-hidden>→</span>
                </a>
              </div>
            </div>

            {/* Mock appendix card */}
            <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <span className="text-sm font-semibold text-white">
                  Appendix: AI-Use Disclosure
                </span>
                <span className="rounded-full bg-slate-700 px-2.5 py-0.5 text-xs font-medium text-slate-200">
                  Audit log entry
                </span>
              </div>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Section</dt>
                  <dd className="font-medium text-slate-100">
                    Earning-capacity analysis
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Model</dt>
                  <dd className="font-mono text-xs text-slate-200">
                    claude-sonnet-4-5-20250929
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Evidence provided</dt>
                  <dd className="text-right font-medium text-slate-100">
                    Depo p.42 ln.10; Wage survey p.3; Voc. eval p.7
                  </dd>
                </div>
              </dl>
              <div className="mt-4 rounded-lg bg-slate-900/70 p-3 text-xs leading-relaxed text-slate-400">
                &ldquo;The drafting prompt restricted the model to evidence the
                expert supplied, and citation IDs were checked against that
                evidence list. The expert independently verified the source
                support, edited, and adopted all content.&rdquo;
              </div>
            </div>
          </div>
        </section>

        {/* Guardrails / trust */}
        <section id="trust" className="mx-auto max-w-6xl px-6 py-12 sm:py-20">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight">
              Built around the risks that matter
            </h2>
            <p className="mt-3 text-base text-slate-700">
              A fabricated citation, unsupported conclusion, or incomplete
              disclosure can put a case and reputation at risk. Disclosed.
              catches missing and unknown source IDs, preserves the tool-use
              record, and keeps substantive verification with the expert.
            </p>
          </div>
          <div className="reveal mt-12 grid gap-6 sm:grid-cols-2">
            {GUARDRAILS.map((g) => (
              <div
                key={g.title}
                className="lift flex gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-800">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path
                      fillRule="evenodd"
                      d="M9.6 1.8a1 1 0 0 1 .8 0l6 2.6a1 1 0 0 1 .6.92v4.3c0 3.64-2.3 6.9-5.7 8.16a1 1 0 0 1-.7 0C7.2 18.72 4.9 15.46 4.9 11.82V5.32a1 1 0 0 1 .6-.92l6-2.6Zm3.7 6.1a1 1 0 0 0-1.4-1.4L9 9.4 7.7 8.1A1 1 0 1 0 6.3 9.5l2 2a1 1 0 0 0 1.4 0l3.6-3.6Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold">{g.title}</h3>
                  <p className="mt-1.5 text-base leading-relaxed text-slate-700">
                    {g.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Interactive proof of the grounding guardrail — let skeptics test the claim */}
        <section id="try" className="border-y border-slate-200 bg-slate-50/60">
          <div className="mx-auto max-w-6xl px-6 py-12 sm:py-20">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-800">
                See it yourself
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                Try to make it state something you didn&apos;t give it
              </h2>
              <p className="mt-3 text-base text-slate-700">
                Here&apos;s a live case file with exactly three sources. Write any
                sentence. Invent a number, or cite a source that isn&apos;t
                there, and watch the same citation-ID check that gates every
                report export. The check catches missing and unknown source
                markers; you decide whether the cited source truly supports the
                statement.
              </p>
            </div>
            <div className="mt-10">
              <TryItDemo />
            </div>
          </div>
        </section>

        {/* Rule 26 coverage */}
        <section
          aria-label="Rule 26 coverage"
          className="border-y border-slate-200 bg-white"
        >
          <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
              <div className="max-w-xl">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Every Rule 26(a)(2)(B) element, accounted for
                </h2>
                <p className="mt-2 text-base text-slate-700">
                  The export is blocked until each required element is present and
                  every cited source resolves.
                </p>
              </div>
            </div>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {RULE_26_ELEMENTS.map((el) => (
                <li
                  key={el.key}
                  className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                >
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-blue-800" />
                  <span>{el.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Separate value paths for the three buyers around one expert report. */}
        <section id="buyers" className="mx-auto max-w-6xl px-6 py-12 sm:py-20">
          <div className="max-w-3xl">
            <span className="text-xs font-semibold uppercase tracking-wide text-blue-800">
              Value across the matter
            </span>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              One expert report. Three people need confidence in it.
            </h2>
            <p className="mt-3 text-base text-slate-700">
              Disclosed. starts with the expert&apos;s workflow, then makes the
              result easier for retaining counsel to review and for a practice
              owner to standardize.
            </p>
          </div>
          <div className="reveal mt-12 grid gap-6 md:grid-cols-3">
            {AUDIENCES.map((audience) => (
              <a
                key={audience.label}
                href={audience.href}
                className="lift group rounded-2xl border border-slate-200 bg-white p-6 no-underline shadow-sm"
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-blue-800">
                  {audience.label}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-slate-900">
                  {audience.title}
                </h3>
                <p className="mt-2 text-base leading-relaxed text-slate-700">
                  {audience.body}
                </p>
                <span className="mt-5 inline-flex font-semibold text-blue-800 transition group-hover:text-blue-950">
                  {audience.cta} <span className="ml-1" aria-hidden>→</span>
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mx-auto max-w-6xl px-6 py-12 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-800">
              Pricing
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              Start with a pilot. Pay per report when it is ready.
            </h2>
            <p className="mt-3 text-base text-slate-700">
              Early access is for fictional or de-identified work while the final
              confidentiality terms are completed. The founding cohort validates
              the workflow and the price before public billing opens.
            </p>
          </div>

          {/* Value anchor — conditional and honest, without asserting a universal billing rate. */}
          <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-blue-100 bg-blue-50/60 px-5 py-3.5 text-center text-sm leading-relaxed text-slate-700 sm:mt-8 sm:px-6 sm:py-4 sm:text-base">
            If one hour of your report-preparation time is worth{" "}
            <strong className="font-semibold text-slate-900">$250</strong>, the
            single-report option can cover its price in that hour. The editable
            report, evidence map, disclosure appendix, and verification file are
            all included.
          </div>
          <div className="reveal mx-auto mt-8 grid max-w-4xl gap-5 sm:mt-10 md:grid-cols-2 md:gap-6">
            {PRICING.map((tier) => {
              const f = tier.featured;
              return (
                <div
                  key={tier.name}
                  className={
                    f
                      ? "lift relative flex h-full flex-col rounded-2xl border border-blue-900 bg-gradient-to-b from-blue-900 to-blue-950 p-6 text-white shadow-xl ring-1 ring-blue-900/10 sm:p-8"
                      : "lift relative flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
                  }
                >
                  {f && (
                    <span className="absolute -top-3 left-8 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-950 shadow-sm">
                      Recommended start
                    </span>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <h3
                      className={`text-sm font-semibold uppercase tracking-wide ${f ? "text-blue-200" : "text-slate-600"}`}
                    >
                      {tier.name}
                    </h3>
                    {tier.save && (
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${f ? "bg-white/15 text-white" : "bg-blue-50 text-blue-800"}`}
                      >
                        {tier.save}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span
                      className={`text-4xl font-semibold tracking-tight ${f ? "text-white" : "text-slate-900"}`}
                    >
                      {tier.price}
                    </span>
                    <span className={`text-sm ${f ? "text-blue-200" : "text-slate-600"}`}>
                      {tier.unit}
                    </span>
                  </div>
                  <p
                    className={`mt-1.5 text-xs font-medium uppercase tracking-wide ${f ? "text-blue-200/80" : "text-slate-500"}`}
                  >
                    {tier.note}
                  </p>
                  <p
                    className={`mt-2 text-sm leading-relaxed sm:mt-3 sm:text-base ${f ? "text-blue-100" : "text-slate-700"}`}
                  >
                    {tier.blurb}
                  </p>
                  <ul className="mt-4 mb-6 space-y-2 sm:mt-6 sm:mb-8 sm:space-y-3">
                    {tier.features.map((feat) => (
                      <li
                        key={feat}
                        className={`flex items-start gap-2.5 text-sm sm:text-base ${f ? "text-blue-50" : "text-slate-700"}`}
                      >
                        <CheckIcon
                          className={`mt-0.5 h-4 w-4 shrink-0 ${f ? "text-amber-300" : "text-blue-800"}`}
                        />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href={
                      billingLive && tier.plan
                        ? `/workspace?buy=${tier.plan}`
                        : tier.href
                    }
                    className={
                      f
                        ? "mt-auto flex h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-blue-950 transition hover:bg-blue-50"
                        : "mt-auto flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                    }
                  >
                    {billingLive && tier.plan
                      ? "Buy now"
                      : tier.cta}
                  </a>
                </div>
              );
            })}
          </div>
          {/* Firm plan — the multi-expert "contact us" tier (volume pricing) */}
          <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-blue-200 bg-blue-50/60 px-6 py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Firm plan: more than one expert in your practice?
                </p>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">
                  Help shape the firm version: a sanctioned individual workflow
                  today, then shared templates, controls, and billing designed
                  with founding practices. Team features are not live yet.
                </p>
              </div>
              <a
                href="/for-firms"
                className="shrink-0 self-start rounded-xl border border-blue-300 bg-white px-5 py-2.5 text-sm font-semibold text-blue-800 no-underline transition hover:bg-blue-100"
              >
                Talk to us about a firm plan →
              </a>
            </div>
          </div>
          <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-slate-600">
            No annual “unlimited” plan yet. Report volume and support needs will
            determine whether a capped annual bundle makes sense after the pilot.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-center text-xs text-slate-500">
            Per-report prices are a current test, not a promise. Credits do not
            expire and are non-refundable once a report has been exported.
          </p>
        </section>

        {/* FAQ — the cross-examination */}
        <section id="faq" className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-3xl px-6 py-12 sm:py-20">
            <h2 className="text-3xl font-semibold tracking-tight">
              Questions you&apos;ll get on cross-examination
            </h2>
            <p className="mt-3 text-base text-slate-700">
              And the honest answers this tool is built to back up.
            </p>
            <div className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
              {FAQ.map((item) => (
                <details key={item.q} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-1 text-lg font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                    <span>{item.q}</span>
                    <svg
                      className="h-5 w-5 shrink-0 text-slate-400 transition-[rotate] duration-200 group-open:rotate-180"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 8l4 4 4-4" />
                    </svg>
                  </summary>
                  <p className="mt-2 text-base leading-relaxed text-slate-700">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section id="waitlist" className="mx-auto max-w-6xl px-6 py-14 sm:py-24">
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 px-8 py-14 text-center shadow-sm">
            <h2 className="mx-auto max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              See the product first. Then help shape your discipline.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-slate-700">
              Open the complete worked example without an account. If the
              workflow fits, join the founding cohort for template access and a
              direct line into what gets built next.
            </p>
            <a
              href="/workspace"
              className="mt-7 inline-flex h-12 items-center justify-center rounded-xl bg-blue-900 px-7 text-base font-semibold text-white shadow-sm transition hover:bg-blue-950"
            >
              Try the worked example <span className="ml-2" aria-hidden>→</span>
            </a>
            <p className="mt-7 text-sm font-semibold text-slate-800">
              Join the founding cohort
            </p>
            <div className="mt-8 flex flex-col items-center gap-3">
              <Waitlist source="waitlist" />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 text-sm text-slate-600">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-900 text-xs font-bold text-white">
                D
              </div>
              <span className="font-semibold text-slate-800">Disclosed.</span>
            </div>
            <nav
              aria-label="Legal"
              className="flex flex-wrap items-center gap-x-6 gap-y-2"
            >
              <a href="/terms" className="transition hover:text-slate-900">
                Terms
              </a>
              <a href="/privacy" className="transition hover:text-slate-900">
                Privacy
              </a>
              <a href="/disclaimer" className="transition hover:text-slate-900">
                Disclaimer
              </a>
              <a href="/sample" className="transition hover:text-slate-900">
                Sample report
              </a>
              <a href="/resources" className="transition hover:text-slate-900">
                Resources
              </a>
              <a href="/help" className="transition hover:text-slate-900">
                Help
              </a>
              <a href="/verify" className="transition hover:text-slate-900">
                Verify a record
              </a>
              <a href="mailto:hello@disclosed.app" className="transition hover:text-slate-900">
                Contact
              </a>
              <a href="/for-experts" className="transition hover:text-slate-900">
                For experts
              </a>
              <a href="/for-counsel" className="transition hover:text-slate-900">
                For counsel
              </a>
              <a href="/for-firms" className="transition hover:text-slate-900">
                For firms
              </a>
            </nav>
          </div>
          <p className="max-w-3xl text-slate-500">
            Disclosed. is a structuring and formatting tool, not a law firm, and
            nothing here is legal advice. You author, verify, and sign every
            report; admissibility and the sufficiency of any AI disclosure are
            determined by the court, not by this tool.
          </p>
        </div>
      </footer>
    </div>
  );
}
