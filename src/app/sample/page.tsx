import Link from "next/link";
import type { Metadata } from "next";
import { buildSampleReport, getSampleDefinition, SAMPLE_DEFINITIONS, type SampleSection } from "@/lib/domain/sample";
import { buildCoverageChecklist, findLooseEnds } from "@/lib/domain/coverage";

export const metadata: Metadata = {
  title: "See what Disclosed. produces",
  description:
    "Tour a worked forensic report, its sentence-level evidence map, AI-Use Disclosure Appendix, and independently verifiable record.",
};

const CITATION_RE = /\[\[E:([a-zA-Z0-9_-]+)\]\]/g;
const PLACEHOLDER_RE = /\[Expert input needed:[^\]]*\]/g;
const TOKEN_RE = /\[\[E:[a-zA-Z0-9_-]+\]\]|\[Expert input needed:[^\]]*\]/g;

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M10 2a1 1 0 0 1 1 1v7.59l2.3-2.3a1 1 0 1 1 1.4 1.42l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.42l2.3 2.3V3a1 1 0 0 1 1-1Z" />
      <path d="M4 14a1 1 0 0 1 1 1v1h10v-1a1 1 0 1 1 2 0v1.5A1.5 1.5 0 0 1 15.5 18h-11A1.5 1.5 0 0 1 3 16.5V15a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

function SourceChip({ id, n }: { id: string; n: number }) {
  return (
    <a
      href={`#${id}`}
      title="Jump to source"
      className="mx-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded bg-blue-100 px-1 align-super text-[10px] font-semibold text-blue-700 no-underline transition hover:bg-blue-200"
    >
      {n}
    </a>
  );
}

function renderProse(
  text: string,
  exhibitNumber: Map<string, number>,
): React.ReactNode[] {
  const lines = text.split("\n");
  return lines.map((line, li) => {
    const nodes: React.ReactNode[] = [];
    let last = 0;
    let key = 0;
    for (const m of line.matchAll(TOKEN_RE)) {
      const idx = m.index ?? 0;
      if (idx > last) nodes.push(line.slice(last, idx));
      const token = m[0];
      const citeMatch = new RegExp(CITATION_RE).exec(token);
      if (citeMatch) {
        const id = citeMatch[1];
        nodes.push(
          <SourceChip key={`c${li}-${key++}`} id={id} n={exhibitNumber.get(id) ?? 0} />,
        );
      } else if (PLACEHOLDER_RE.test(token)) {
        nodes.push(
          <mark
            key={`p${li}-${key++}`}
            className="rounded bg-amber-100 px-1.5 py-0.5 text-sm text-amber-900"
          >
            {token}
          </mark>,
        );
      }
      last = idx + token.length;
    }
    if (last < line.length) nodes.push(line.slice(last));
    return (
      <span key={li} className="block">
        {nodes}
      </span>
    );
  });
}

function GroundingBadge({ section }: { section: SampleSection }) {
  const { grounding, fedEvidenceIds } = section;
  if (fedEvidenceIds.length === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
        Profile content
      </span>
    );
  }
  if (!grounding.isClean) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Needs review
      </span>
    );
  }
  if (grounding.placeholderSentences.length > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Awaiting your input
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Cited to your evidence
    </span>
  );
}

function ReportSectionDetails({
  section,
  exhibitNumber,
  open = false,
}: {
  section: SampleSection;
  exhibitNumber: Map<string, number>;
  open?: boolean;
}) {
  return (
    <details
      open={open}
      className="group rounded-xl border border-slate-200 bg-white open:border-blue-200 open:bg-blue-50/20"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:hidden">
        <span className="min-w-0 text-sm font-semibold text-slate-900">
          {section.title}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <GroundingBadge section={section} />
          <span
            aria-hidden
            className="text-xs text-slate-400 transition-transform group-open:rotate-180"
          >
            ↓
          </span>
        </span>
      </summary>
      <div className="space-y-1.5 border-t border-slate-100 px-4 py-4 text-sm leading-relaxed text-slate-700">
        {renderProse(section.draftText, exhibitNumber)}
      </div>
    </details>
  );
}

export default async function SamplePage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const { d } = await searchParams;
  const def = getSampleDefinition(d);
  const applicationDiscipline =
    def.kind === "engineering"
      ? "forensic_engineering"
      : def.kind === "reconstruction"
        ? "accident_reconstruction"
        : "vocational_rehabilitation";
  const applicationHref = `/for-experts?discipline=${applicationDiscipline}#application`;
  const report = buildSampleReport(def);
  const { meta, profile, evidence, sections, appendix, rule26, exhibitNumber, exhibits } =
    report;

  // Private, ephemeral loose-ends check — computed here for display only. It is
  // NOT persisted, NOT part of the report, and NOT recorded in the AI-Disclosure
  // appendix (that separation is deliberate; see src/lib/domain/coverage.ts).
  const coverage = findLooseEnds({
    sections: sections.map((s) => ({
      key: s.key,
      title: s.title,
      draftText: s.draftText,
      citedEvidenceIds: s.grounding.citedEvidenceIds,
      ungroundedFlags: s.grounding.ungroundedSentences,
    })),
    evidence,
    template: def.template,
  });

  // Challenge-readiness checklist — curated neutral coverage questions per the
  // discipline methodology, with conservative "not detected" hints. Also private
  // and ephemeral; never persisted or exported.
  const checklist = buildCoverageChecklist(
    def.template,
    sections.map((s) => s.draftText).join("\n"),
  );
  const sectionsAwaitingInput = sections.filter(
    (s) =>
      s.grounding.placeholderSentences.length > 0 ||
      s.draftText.includes("[Expert input needed:"),
  ).length;
  const citedSections = sections.filter(
    (s) => s.fedEvidenceIds.length > 0 && s.grounding.isClean,
  ).length;
  const featuredTitles = new Set([
    "Summary of Opinions",
    "Labor Market Survey",
    "Pre-Injury vs. Post-Injury Earning Capacity",
    "Opinions",
  ]);
  const featuredSections = sections.filter((s) => featuredTitles.has(s.title));
  const remainingSections = sections.filter((s) => !featuredTitles.has(s.title));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Nav */}
      <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-slate-50/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-900 text-sm font-bold text-white">
              D
            </div>
            <span className="text-sm font-semibold tracking-tight">
              Disclosed<span className="text-blue-800">.</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <a
              href={`/api/export/sample/pdf?d=${def.kind}`}
              className="hidden items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 no-underline transition hover:bg-slate-50 sm:inline-flex"
            >
              <DownloadIcon className="h-4 w-4" />
              Download as PDF
            </a>
            <Link
              href={def.preview ? applicationHref : "/workspace"}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white no-underline transition hover:bg-slate-800"
            >
              {def.preview ? "Help validate it" : "Try the workflow"}
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10 sm:py-12">
        {/* Discipline switcher */}
        <div className="mb-8 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Discipline:</span>
          {SAMPLE_DEFINITIONS.map((s) => {
            const active = s.kind === def.kind;
            return (
              <a
                key={s.kind}
                href={s.kind === "vocational" ? "/sample" : `/sample?d=${s.kind}`}
                className={
                  active
                    ? "inline-flex items-center gap-1.5 rounded-md bg-blue-900 px-3.5 py-1.5 text-sm font-semibold text-white no-underline"
                    : "inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 no-underline transition hover:bg-slate-50"
                }
              >
                {s.label}
                {s.preview && (
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${active ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"}`}
                  >
                    preview
                  </span>
                )}
              </a>
            );
          })}
        </div>

        {/* Preview banner for not-yet-finalized disciplines */}
        {def.preview && (
          <div className="mb-8 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm leading-relaxed text-amber-900">
            <strong className="font-semibold">Template preview—not a live discipline.</strong>{" "}
            This outline is informed by {def.template.standardRef} and runs
            through the real evidence-map and AI-disclosure pipeline. It still
            needs practicing-expert validation before report building opens for{" "}
            {def.meta.discipline}.{" "}
            <a href={applicationHref} className="font-semibold underline">
              Help validate this template →
            </a>
          </div>
        )}

        <div id="outcome" className="max-w-3xl scroll-mt-24">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-800">
            A two-minute product tour · {def.meta.discipline}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            See the finished report—and the proof behind every line
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
            Disclosed. turns the expert&apos;s confirmed findings into one
            connected package: the report, its sentence-level evidence map, the
            AI-use disclosure, and a record anyone can independently verify.
            Open only the detail you want to inspect.
          </p>
          <p className="mt-3 text-xs text-slate-500">
            Fictional matter for demonstration. No real party, expert, or data.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href={`/api/export/sample/pdf?d=${def.kind}`}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-900 px-5 text-sm font-semibold text-white no-underline shadow-sm transition hover:bg-blue-950"
            >
              <DownloadIcon className="h-4 w-4" />
              Download this sample as PDF
            </a>
            <a
              href={`/api/export/sample?d=${def.kind}`}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 no-underline transition hover:bg-slate-50"
            >
              <DownloadIcon className="h-4 w-4" />
              or Word (.docx)
            </a>
            {def.preview ? (
              <Link
                href={applicationHref}
                className="text-sm font-semibold text-blue-800 underline-offset-2 hover:underline"
              >
                Apply to shape this discipline →
              </Link>
            ) : (
              <Link
                href="/workspace"
                className="text-sm font-semibold text-blue-800 underline-offset-2 hover:underline"
              >
                Try it with the worked example →
              </Link>
            )}
          </div>
        </div>

        <section className="mt-8 overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl">
          <div className="border-b border-white/10 px-5 py-5 sm:px-7">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">
              What Disclosed. produced
            </p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="text-2xl font-semibold tracking-tight">
                One workflow. Four connected deliverables.
              </h2>
              <span className="text-xs text-slate-400">
                Generated together—not reconstructed later
              </span>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                n: "01",
                title: "The report",
                value: `${sections.length} structured sections`,
                body: "Rule 26(a)(2)(B)-organized and editable before the expert signs.",
                href: "#report",
              },
              {
                n: "02",
                title: "The evidence map",
                value: `${evidence.length} supplied sources`,
                body: "Numbered citations connect factual sentences to the record supplied.",
                href: "#report",
              },
              {
                n: "03",
                title: "The AI-use record",
                value: `${appendix.entries.length} logged events`,
                body: "Model, version, section, and evidence captured while the report is built.",
                href: "#disclosure",
              },
              {
                n: "04",
                title: "Independent verification",
                value: "Portable manifest",
                body: "Anyone holding the file can recompute its tamper-evident chain.",
                href: "#verification",
              },
            ].map((item) => (
              <a
                key={item.n}
                href={item.href}
                className="group border-b border-white/10 px-5 py-5 text-white no-underline last:border-b-0 sm:border-r sm:[&:nth-child(2)]:border-r-0 lg:border-b-0 lg:[&:nth-child(2)]:border-r"
              >
                <span className="text-[11px] font-semibold text-blue-300">{item.n}</span>
                <h3 className="mt-3 text-sm font-semibold">{item.title}</h3>
                <p className="mt-1 text-lg font-semibold tracking-tight">{item.value}</p>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">{item.body}</p>
                <span className="mt-3 inline-block text-xs font-semibold text-blue-300 transition group-hover:text-blue-200">
                  Inspect →
                </span>
              </a>
            ))}
          </div>
        </section>

        <nav
          aria-label="Sample tour"
          className="sticky top-[65px] z-[9] mt-5 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white/95 p-1.5 shadow-sm backdrop-blur"
        >
          {[
            ["Outcome", "#outcome"],
            ["Report + evidence", "#report"],
            ["Private review", "#review"],
            ["AI-use record", "#disclosure"],
            ["Verification", "#verification"],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="shrink-0 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 no-underline transition hover:bg-slate-100 hover:text-slate-950"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Rule 26 status banner */}
        <div
          className={`mt-8 flex items-center gap-3 rounded-xl border px-5 py-3 text-sm ${
            rule26.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          <span className="font-semibold">
            Rule 26(a)(2)(B): {rule26.ok ? "all elements present" : `${rule26.issues.length} item(s) to resolve`}
          </span>
          {!rule26.ok && (
            <span className="text-amber-700">
              {rule26.issues.map((i) => i.reason).join(", ")}
            </span>
          )}
        </div>

        <div
          id="report"
          className="reveal mt-8 grid scroll-mt-28 gap-6 sm:gap-8 lg:grid-cols-[1fr_320px]"
        >
          {/* Report body */}
          <article className="lift rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="border-b border-slate-200 pb-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-800">
                Deliverable 1 + 2
              </p>
              <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">Report + evidence map</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Open a section to inspect its text and source links.
                  </p>
                </div>
                <span className="text-xs font-medium text-emerald-700">
                  {citedSections} evidence-linked sections
                </span>
              </div>
              <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-slate-500">Matter</dt>
                  <dd className="font-medium">{meta.matter}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Retaining counsel</dt>
                  <dd className="font-medium">{meta.retainingCounsel}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Expert</dt>
                  <dd className="font-medium">{profile.fullName}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Role</dt>
                  <dd className="font-medium">{meta.expertRole}</dd>
                </div>
              </dl>
            </div>

            <div className="mt-4 space-y-2">
              {featuredSections.map((s, index) => (
                <ReportSectionDetails
                  key={s.key}
                  section={s}
                  exhibitNumber={exhibitNumber}
                  open={index === 0}
                />
              ))}
              <details className="group rounded-xl border border-dashed border-slate-300 bg-slate-50 open:bg-white">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:hidden">
                  <span>
                    <span className="block text-sm font-semibold text-slate-800">
                      Browse the other {remainingSections.length} report sections
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      Profile, methodology, factual background, bases, and exhibits
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className="shrink-0 text-slate-400 transition-transform group-open:rotate-180"
                  >
                    ↓
                  </span>
                </summary>
                <div className="space-y-2 border-t border-slate-200 p-2">
                  {remainingSections.map((s) => (
                    <ReportSectionDetails
                      key={s.key}
                      section={s}
                      exhibitNumber={exhibitNumber}
                    />
                  ))}
                </div>
              </details>
            </div>
          </article>

          {/* Evidence panel */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="lift rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                The source boundary
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                These {evidence.length} records are the complete universe the
                sample can cite. The report cannot reach outside this list.
              </p>
              <ol className="mt-4 space-y-3">
                {evidence.map((u) => (
                  <li
                    key={u.id}
                    id={u.id}
                    className="flex gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm scroll-mt-24 target:border-blue-300 target:bg-blue-50"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-blue-100 text-xs font-semibold text-blue-700">
                      {exhibitNumber.get(u.id)}
                    </span>
                    <div className="min-w-0">
                      <p title={u.content} className="line-clamp-2 font-medium text-slate-800">
                        {u.content}
                      </p>
                      <p title={u.location} className="truncate text-xs text-slate-500">
                        {u.location}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-xs text-slate-500">
                Click any numbered chip in an open report section to jump to its source.
              </p>
            </div>
          </aside>
        </div>

        {/* Coverage check — private, ephemeral, never part of the report */}
        <section id="review" className="mt-8 scroll-mt-28 sm:mt-12">
          <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                    Private review
                  </p>
                  <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
                    Never saved
                  </span>
                </div>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
                  What still needs the expert?
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
                  Disclosed. separates actual open inputs from optional
                  methodology prompts, so the expert sees the next decision
                  instead of a wall of checklist text.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
              <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200">
                <p className="text-xl font-semibold text-slate-900">{coverage.sectionsChecked}</p>
                <p className="text-xs text-slate-500">sections checked</p>
              </div>
              <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200">
                <p className="text-xl font-semibold text-slate-900">{coverage.evidenceChecked}</p>
                <p className="text-xs text-slate-500">records traced</p>
              </div>
              <div className="rounded-xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200">
                <p className="text-xl font-semibold text-amber-950">{sectionsAwaitingInput}</p>
                <p className="text-xs text-amber-800">sections awaiting expert input</p>
              </div>
            </div>

            {coverage.inputsAllRelied && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Every supplied record is used in an analysis section.
              </div>
            )}

            {coverage.items.length > 0 ? (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  Open items to resolve
                </h3>
                <ul className="mt-2 space-y-2">
                  {coverage.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start gap-3 rounded-xl border border-amber-200 bg-white px-4 py-3"
                    >
                      <span className="mt-0.5 shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                        {item.category === "unused_evidence"
                          ? "Unused"
                          : item.category === "listed_not_relied"
                            ? "Listed only"
                            : item.category === "open_input"
                              ? "Your input"
                              : "No citation"}
                      </span>
                      <span className="text-sm text-slate-700">{item.question}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
                Nothing flagged: no loose ends in the supplied inputs.
              </div>
            )}

            <details className="group mt-4 rounded-xl border border-indigo-200 bg-white">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:hidden">
                <span>
                  <span className="block text-sm font-semibold text-slate-900">
                    Optional methodology review
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    {checklist.total} neutral prompts across {checklist.groups.length} topics
                    {checklist.notDetected > 0
                      ? ` · ${checklist.notDetected} phrases were not detected`
                      : ""}
                  </span>
                </span>
                <span
                  aria-hidden
                  className="shrink-0 text-slate-400 transition-transform group-open:rotate-180"
                >
                  ↓
                </span>
              </summary>
              <div className="border-t border-slate-100 px-4 py-4">
                <p className="text-xs leading-relaxed text-slate-500">
                  These are prompts, not failed checks. The tool asks about
                  completeness; the expert decides what applies and what to conclude.
                </p>
                <div className="mt-3 space-y-2">
                  {checklist.groups.map((g) => (
                    <details
                      key={g.sectionKey}
                      className="group/topic rounded-lg border border-slate-200"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-2.5 marker:hidden">
                        <span className="text-sm font-medium text-slate-800">
                          {g.sectionTitle}
                        </span>
                        <span className="shrink-0 text-xs text-slate-500">
                          {g.questions.length} {g.questions.length === 1 ? "prompt" : "prompts"} ↓
                        </span>
                      </summary>
                      <ul className="space-y-2 border-t border-slate-100 px-3.5 py-3">
                        {g.questions.map((q, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span
                              className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                                q.detected === false
                                  ? "bg-amber-500"
                                  : q.detected === true
                                    ? "bg-emerald-500"
                                    : "bg-slate-300"
                              }`}
                            />
                            <span className="text-slate-700">
                              {q.q}
                              {q.detected === false && (
                                <span className="ml-1.5 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                                  not detected
                                </span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  ))}
                </div>
              </div>
            </details>

            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              Nothing in this review is logged, exported, or recorded in the
              AI-Disclosure Appendix.
            </p>
          </div>
        </section>

        {/* Structured tables are a vocational sample feature today. Document
            exhibits in preview disciplines remain listed in the report body;
            do not render a confusing "0 exhibits" section. */}
        {exhibits.length > 0 && (
          <section className="mt-8 sm:mt-12">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-800">
                  Supporting detail
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight">
                  {exhibits.length} structured report exhibits
                </h2>
              </div>
              <span className="text-xs text-slate-500">
                Included in the exported report
              </span>
            </div>
            <div className="reveal mt-4 space-y-2">
              {exhibits.map((ex) => (
                <details
                  key={ex.label}
                  className="group lift overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm open:border-blue-200"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 marker:hidden">
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">
                        <span className="text-blue-700">{ex.label}</span> — {ex.title}
                      </span>
                      {ex.caption && (
                        <span className="mt-1 block text-xs text-slate-500">{ex.caption}</span>
                      )}
                    </span>
                    <span
                      aria-hidden
                      className="shrink-0 text-slate-400 transition-transform group-open:rotate-180"
                    >
                      ↓
                    </span>
                  </summary>
                  <div className="border-t border-slate-100">
                    <h3 className="sr-only">
                      <span className="text-blue-700">{ex.label}</span> — {ex.title}
                    </h3>
                    <div className="overflow-x-auto px-5 py-1">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wide text-slate-600">
                            {ex.columns.map((c) => (
                              <th key={c} className="py-2 pr-4 font-medium">
                                {c}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {ex.rows.map((row, ri) => (
                            <tr
                              key={ri}
                              className="border-b border-slate-100 align-top last:border-0"
                            >
                              {row.map((cell, ci) => (
                                <td
                                  key={ci}
                                  className={`py-2.5 pr-4 ${ci === 0 ? "font-medium text-slate-600" : "text-slate-700"}`}
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {ex.footnote && (
                      <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-600">
                        {ex.footnote}
                      </p>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* AI-Disclosure Appendix */}
        <section
          id="disclosure"
          className="mt-8 scroll-mt-28 rounded-2xl border border-slate-700 bg-slate-900 p-5 text-slate-100 shadow-xl sm:mt-12 sm:p-8"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-700 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">
                Deliverable 3
              </p>
              <h2 className="mt-1 text-xl font-semibold text-white">
                The AI-use record is built while the report is built
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-slate-400">
                No reconstruction from memory: each assisted section carries the
                model, version, and evidence it received.
              </p>
            </div>
            <span className="rounded-md bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
              Generated automatically
            </span>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-300">
            {appendix.statement}
          </p>

          <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3">
              <p className="text-xl font-semibold">{appendix.entries.length}</p>
              <p className="text-xs text-slate-400">logged section events</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3">
              <p className="text-sm font-semibold">{appendix.models.length}</p>
              <p className="mt-1 text-xs text-slate-400">
                {appendix.models.length === 1 ? "model/version recorded" : "models/versions recorded"}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3">
              <p className="text-sm font-semibold text-emerald-300">Travels with the report</p>
              <p className="mt-1 text-xs text-emerald-100/70">as its disclosure appendix</p>
            </div>
          </div>

          <details className="group mt-4 rounded-xl border border-slate-700 bg-slate-950/40">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:hidden">
              <span>
                <span className="block text-sm font-semibold text-white">
                  Inspect the full disclosure log
                </span>
                <span className="mt-0.5 block text-xs text-slate-400">
                  {appendix.entries.length} events · {appendix.models.join(", ")}
                </span>
              </span>
              <span
                aria-hidden
                className="shrink-0 text-slate-500 transition-transform group-open:rotate-180"
              >
                ↓
              </span>
            </summary>
            <div className="overflow-x-auto border-t border-slate-700 px-4 pb-2">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="py-3 pr-4 font-medium">Section</th>
                    <th className="py-3 pr-4 font-medium">Model · version</th>
                    <th className="py-3 font-medium">Evidence provided</th>
                  </tr>
                </thead>
                <tbody>
                  {appendix.entries.map((e, i) => (
                    <tr key={i} className="border-b border-slate-800 align-top">
                      <td className="py-3 pr-4 font-medium text-slate-100">
                        {e.sectionKey.replace(/_/g, " ")}
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs text-slate-300">
                        {e.model} · {e.modelVersion}
                      </td>
                      <td className="py-3 text-slate-300">
                        {e.evidenceSources.map((s) => s.location).join("; ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
          <p className="mt-4 text-xs text-slate-500">
            Profile sections authored directly by the expert make no AI calls,
            so they do not appear in the disclosure log.
          </p>
        </section>

        <div
          id="verification"
          className="lift mt-8 scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-800">
            Deliverable 4
          </p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
            The record does not require trust in our label
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            The sample&apos;s AI-disclosure record is a SHA-256 hash chain: alter a
            single entry and every entry after it stops matching. Recompute it in
            your own browser, with no account and no upload. The verifier includes
            a doctored copy so you can watch the check fail.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <a
              href="/verify"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-900 px-6 text-sm font-semibold text-white no-underline transition hover:bg-blue-800"
            >
              Verify the record yourself →
            </a>
            <a
              href="/sample-disclosure-manifest.json"
              download
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-800 no-underline transition hover:bg-slate-50"
            >
              <DownloadIcon className="h-4 w-4" />
              Download the disclosure manifest
            </a>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:mt-12 sm:flex-row">
          <Link
            href={def.preview ? applicationHref : "/workspace"}
            className="inline-flex h-12 items-center justify-center rounded-xl bg-blue-900 px-7 text-sm font-semibold text-white no-underline shadow-sm transition hover:bg-blue-950"
          >
            {def.preview ? "Help validate this discipline" : "Try the worked example"}
          </Link>
          <a
            href={`/api/export/sample/pdf?d=${def.kind}`}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-7 text-sm font-semibold text-slate-800 no-underline shadow-sm transition hover:bg-slate-50"
          >
            <DownloadIcon className="h-4 w-4" />
            Download as PDF
          </a>
          <a
            href={`/api/export/sample?d=${def.kind}`}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-7 text-sm font-semibold text-slate-800 no-underline shadow-sm transition hover:bg-slate-50"
          >
            <DownloadIcon className="h-4 w-4" />
            Word (.docx)
          </a>
        </div>
      </div>
    </div>
  );
}
