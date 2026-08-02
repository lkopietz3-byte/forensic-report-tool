import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help & FAQ",
  description:
    "Answers to common questions about how Disclosed. structures forensic expert reports, the AI-Disclosure Appendix, evidence grounding, export formats, and data handling.",
  alternates: { canonical: "/help" },
};

// ---------------------------------------------------------------------------
// FAQ data — transcribed faithfully from docs/gtm/12-help-center-faq.md
// ---------------------------------------------------------------------------

const GROUPS: {
  id: string;
  heading: string;
  items: { q: string; a: string }[];
}[] = [
  {
    id: "getting-started",
    heading: "Getting started",
    items: [
      {
        q: "What does Disclosed. actually do?",
        a: "The tool takes the findings, evidence, and notes you supply and structures them into a Rule 26(a)(2)(B)-organized report. Every factual sentence is tied to a source you provided. It also keeps an automatic, append-only record of how AI was used during that structuring, which becomes an AI-Disclosure Appendix in your export. You review, edit, and sign the result. Authorship and professional responsibility stay with you throughout.",
      },
      {
        q: "Who is the tool built for?",
        a: "Forensic expert witnesses in federal civil matters who need a Rule 26(a)(2)(B)-organized report and a clear record of any AI use they can produce if asked. The first working template covers vocational rehabilitation and earning-capacity opinions. Engineering and accident reconstruction templates are in preview; join the waitlist to help shape the format for your discipline.",
      },
      {
        q: "What do I need to get started?",
        a: "A case caption, your name and credentials, and at least one evidence item. That can be a pasted excerpt, a document you load (PDF, Word, Excel, or scanned image), or a note you type in. The tool parses the document in your browser, so the file itself never leaves your computer.",
      },
      {
        q: "Do I need an account?",
        a: "No account is required to build and preview a report. An account (free, with magic-link sign-in) lets you save reports and reopen them later. The first report export is free; later exports use report credits once public billing opens.",
      },
      {
        q: "How do I try it before committing to anything?",
        a: 'Go to /workspace, click "Load a worked example," hit "Build & preview," then download the Word or PDF. No card, no sign-in required for the preview. The sample export at /sample shows a finished report with its AI-Disclosure Appendix so you can see what travels with the document.',
      },
      {
        q: "What file types can I bring in as evidence?",
        a: 'PDF, Word (.docx), Excel (.xlsx), HTML, plain-text formats (.txt, .md, .csv, .tsv, .json, .xml), and images or scanned PDFs (read by OCR in your browser, no server involved). OCR output is flagged "Read by OCR — check against the original" so you review it before it becomes evidence. RTF and legacy .doc are not supported. A mis-read is worse than no read.',
      },
    ],
  },
  {
    id: "evidence-and-grounding",
    heading: "Evidence and grounding",
    items: [
      {
        q: 'What is "closed-world grounding" and why does it matter?',
        a: "Every factual sentence must carry a citation marker pointing to evidence you supplied, and missing or unknown IDs block export. The drafting path has no web or research tools and the model is instructed to use only supplied material. A valid marker proves linkage, not that the source actually supports the sentence, so you still compare each sentence to its source and verify every figure and opinion.",
      },
      {
        q: "What do the green, amber, and red colors in the editor mean?",
        a: "As you type or edit a section, each sentence is grounded in real time against the evidence you've added. Green means the sentence cites at least one source you supplied and that source is in your evidence list. Amber means the sentence contains an [Expert input needed: …] placeholder or hasn't been cited yet; the tool is waiting for your input. Red means the sentence makes a factual claim but has no citation, or cites an ID that isn't in your evidence list. Red or uncited sentences block export; you resolve them by adding the missing evidence or revising the sentence.",
      },
      {
        q: "Why did the tool flag my sentence even though I know the source?",
        a: "Grounding is about what's in your evidence list, not what you know. If you added the source but used a citation ID that doesn't match the one in your list, the system treats it as unresolved. Check that the [[E:id]] marker in your sentence matches exactly the ID shown for that evidence item. You can click the citation chip in the Sources panel to insert the correct marker at your cursor.",
      },
      {
        q: 'What does "[Expert input needed: …]" mean?',
        a: "It means the tool reached a point in the structure where an opinion or figure is expected (a post-injury earning range, an adopted TSA conclusion) and nothing in your evidence resolved it. The placeholder names the gap precisely so you know what to supply. The tool does not fill these in. That's your professional judgment. Export is blocked until every placeholder is resolved or the section is removed.",
      },
      {
        q: "Can I add an evidence item by typing it in rather than uploading a document?",
        a: 'Yes. Every evidence item has a "content" field you can type into directly. Enter the material, note the source and page in the "Source / location" field, and assign it to the appropriate section. It\'s treated identically to extracted text; any sentence that cites it must use its assigned ID.',
      },
    ],
  },
  {
    id: "ai-disclosure-record",
    heading: "The AI-Disclosure record",
    items: [
      {
        q: "What is in the AI-Disclosure Appendix?",
        a: "For each AI-assisted section: the section name, the model name and version that processed it, and the exact list of evidence items the model was given, and nothing it was not given. The appendix also carries a statement that the expert reviewed, verified, edited, and adopted all content, and that no AI-produced text entered the report without that review. In no-AI mode the appendix states plainly that no model produced any text.",
      },
      {
        q: 'What does "tamper-evident" mean, and what are its limits?',
        a: "The audit log is append-only and hash-chained: each entry includes a cryptographic hash of the previous entry, so the chain can be verified from the beginning on every load. If the chain has been altered after the fact, verification fails and the workspace reports it. \"Tamper-evident\" means tampering is detectable, not that it's impossible. The tool cannot physically prevent someone with direct database access from altering a record. What it can do, and does, is make the alteration visible. That is the honest framing: the record makes tampering evident; it does not make tampering impossible.",
      },
      {
        q: "Can the Appendix be removed from the export?",
        a: "The AI-Disclosure Appendix is part of every export by design. Suppressing it would defeat the product's core purpose. If you use no-AI mode, the appendix still appears and states that no AI produced any text, which is itself a disclosure.",
      },
      {
        q: "What is no-AI mode and when would I use it?",
        a: "No-AI mode assembles and formats your report using a fixed, rule-based engine with no language model involved. Every sentence still has to cite evidence you supplied; the closed-world grounding and the export gate are unchanged. The AI-Disclosure Appendix then states deterministic-structurer (no-ai-v1) as the method, an accurate record that no model wrote anything. Use it when you want the structure and citation checking without any AI text in the chain, or when your retaining agreement or firm policy requires it.",
      },
    ],
  },
  {
    id: "editing-and-citations",
    heading: "Editing and citations",
    items: [
      {
        q: "Can I edit the structured text after the tool produces it?",
        a: 'Yes, and the system expects it. Click "Edit" on any section to open a text editor pre-loaded with the structured draft. Make your changes. When you save, the tool re-grounds the section against your evidence: any sentence you added or changed is checked the same way as the original. An uncited factual addition blocks export just as it would in the original pass.',
      },
      {
        q: "How do I add a citation while editing?",
        a: 'In the section editor, click "Cite" next to any evidence item in the Sources panel. The citation marker ([[E:id]]) inserts at your cursor position, not at the end of the text, so you can place it at the exact sentence you\'re supporting. You can also type the marker directly if you know the ID.',
      },
      {
        q: "What happens if I cite the same source in multiple sections?",
        a: "That's fine and expected. The same evidence item can support sentences in different sections; the grounding check is per-sentence, not per-section. The disclosure appendix records each section's evidence list separately, so the record reflects exactly which sources were behind which section.",
      },
      {
        q: "Can I reorder my evidence items?",
        a: "Yes. Each evidence row has up and down arrows to change its position in the list. The narrative order of sections generally follows the order in which evidence appears, so reordering items lets you adjust the flow without re-entering everything.",
      },
    ],
  },
  {
    id: "exporting",
    heading: "Exporting",
    items: [
      {
        q: "What export formats are available?",
        a: "Word (.docx) and PDF. Both formats are generated from the same report in the same export call; there's no separate charge for the second format.",
      },
      {
        q: 'What is "court formatting"?',
        a: "The export applies continuous line numbers in the left margin, Century Schoolbook typeface (the federal standard for expert reports), and a cover block with your name, credentials, matter caption, and retaining counsel. These are formatting choices; they do not constitute a guarantee of compliance with any particular court's local rules. Verify your court's requirements. (General information, not legal advice.)",
      },
      {
        q: "What happens to figures (photos or diagrams I attached to evidence)?",
        a: "An evidence item that has an image attached renders as a numbered figure in a Figures section after the report body. It's cited by evidence ID like any other source; the grounding rules are unchanged. Two current limits: (1) images are not stored when you save a report. They stay in the current session and embed when you export, but you'll need to re-attach them if you reopen the saved report later. (2) The exporter accepts PNG only at this time. JPEG support is on the roadmap.",
      },
      {
        q: "Why did export fail with an error about ungrounded sentences?",
        a: "The export gate is hard: if any factual sentence in the report lacks a citation to an evidence item you supplied, or cites an ID that isn't in your list, the export returns an error and shows you which sentences are blocked. This is intentional. Resolve the flagged sentences by supplying the missing source, revising the claim, or removing the sentence, then export again.",
      },
    ],
  },
  {
    id: "confidentiality-and-data",
    heading: "Confidentiality and data",
    items: [
      {
        q: "Can I use a real matter during early access?",
        a: "Not yet. Use the fictional worked example or properly de-identified material only. Anthropic's standard API retention can be up to 30 days; zero-data-retention and counsel-reviewed terms for real-matter use are not yet in place. Do not submit protected health information, privileged material, personal identifiers, trade secrets, or material under a protective order.",
      },
      {
        q: "Does the tool upload my evidence files to a server?",
        a: 'The original document bytes are parsed in your browser and are not uploaded by the document reader. The text you review and confirm (after you click "Pull items") is sent to the Disclosed. server for structuring. When AI is on it is also sent to Anthropic; no-AI mode does not send it to a model provider.',
      },
      {
        q: "Does Disclosed. train its models on my case data?",
        a: "Disclosed. does not use customer content to train or fine-tune models, and does not opt into Anthropic training. Anthropic states that standard commercial API inputs and outputs are deleted within 30 days, subject to its stated usage-policy and legal exceptions. We do not yet have zero-data-retention or a Business Associate Agreement, so early access is limited to fictional or properly de-identified material.",
      },
      {
        q: "What is stored when I save a report versus when I don't?",
        a: "If you don't save, Disclosed. does not persist the report to your account. Confirmed text is still processed by the server for the request and, when AI is on, by Anthropic under its standard retention. If you save (requires an account), your evidence text, section assignments, expert edits, formatting choices, and audit chain are written to your account. Images attached to evidence items are not stored on save. You remain responsible for determining whether cloud processing is permitted.",
      },
    ],
  },
  {
    id: "billing-and-credits",
    heading: "Billing and credits",
    items: [
      {
        q: "How does pricing work?",
        a: "The founding, de-identified pilot is free. The post-pilot price being tested is $250 for a single report, with a planned five-report pack at $1,000. We are deliberately not selling an unlimited annual plan until the founding cohort establishes real report volume and support needs.",
      },
      {
        q: "Do report credits expire?",
        a: "The planned per-report credits do not expire. Word, PDF, and re-downloads of the same report version use one credit together; a materially revised version uses another credit. Credits are non-refundable once a report has been exported.",
      },
    ],
  },
  {
    id: "trust-and-limits",
    heading: "Trust and limits",
    items: [
      {
        q: "What does this tool NOT do?",
        a: "This is the most important section in the help center. The tool does not originate opinions, facts, numbers, or citations. It structures and formats content you supply, and every factual sentence must trace to evidence you provided. It does not determine admissibility. Whether your report satisfies a particular court's standards is the court's determination, which no tool can promise. It does not make the audit chain impossible to alter. The chain is tamper-evident, meaning alteration is detectable, but the tool cannot prevent someone with direct database access from modifying a record. It does not hold any formal third-party security certification. We have data-handling commitments and engineering controls (encryption in transit and at rest, RLS-enforced user isolation), and we describe our protections honestly as commitments, not certifications. The vocational rehabilitation template is still being validated. It was built from peer-reviewed methodology and desk research, and it has not yet been reviewed by a practicing expert in the field, so treat it as a starting structure and apply your own professional judgment to every section. The tool does not validate your evidence. The grounding check verifies that a sentence cites a source you supplied, not that the source is accurate, complete, or admissible; you remain responsible for the underlying evidence and for confirming that your opinions are supported by sufficient facts and data under Fed. R. Evid. 702.",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helper: strip markdown syntax for JSON-LD plain-text answers
// ---------------------------------------------------------------------------
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1") // bold
    .replace(/\*(.*?)\*/g, "$1")     // italic
    .replace(/`(.*?)`/g, "$1")       // inline code
    .replace(/\[(.*?)\]\(.*?\)/g, "$1") // links
    .replace(/#+\s/g, "")            // headings
    .trim();
}

// ---------------------------------------------------------------------------
// JSON-LD FAQPage structured data
// ---------------------------------------------------------------------------
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: GROUPS.flatMap((g) =>
    g.items.map((item) => ({
      "@type": "Question",
      name: stripMarkdown(item.q),
      acceptedAnswer: {
        "@type": "Answer",
        text: stripMarkdown(item.a),
      },
    }))
  ),
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function HelpPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Sticky header — matches article pages exactly */}
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

      <main className="mx-auto max-w-3xl px-6 py-10 sm:py-12">
        {/* Page heading */}
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Help &amp; frequently asked questions
        </h1>
        <p className="mt-4 text-pretty text-lg leading-relaxed text-slate-600">
          How Disclosed. structures your evidence, records AI use, and keeps the
          expert in control of review, adoption, and signature, with honest
          answers about what the tool does not do.
        </p>

        {/* Table of contents */}
        <nav
          aria-label="Jump to section"
          className="mt-8 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Contents
          </p>
          <ol className="mt-2 space-y-1">
            {GROUPS.map((g, i) => (
              <li key={g.id}>
                <a
                  href={`#${g.id}`}
                  className="text-sm font-medium text-blue-800 no-underline transition hover:text-blue-950 hover:underline"
                >
                  {i + 1}. {g.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* FAQ sections */}
        {GROUPS.map((group) => (
          <section
            key={group.id}
            id={group.id}
            className="reveal mt-10 scroll-mt-24 sm:mt-14"
          >
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              {group.heading}
            </h2>
            <div className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
              {group.items.map((item) => (
                <details key={item.q} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-1 text-[17px] font-semibold leading-snug text-slate-900 [&::-webkit-details-marker]:hidden">
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
                  <p className="mt-2 text-[17px] leading-relaxed text-slate-700">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </section>
        ))}

        {/* Amber disclaimer banner */}
        <p className="mt-10 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-relaxed text-amber-900 sm:mt-14">
          <strong>General information, not legal advice.</strong> Disclosed. is
          a software company, not a law firm. Verify the rules for your
          jurisdiction and matter before relying on any AI-disclosure practice
          described here.
        </p>

        {/* Bottom CTA card */}
        <div className="lift mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-800">
            See it in action
          </p>
          <p className="mt-2 text-[17px] leading-relaxed text-slate-700">
            The sample report at <strong>/sample</strong> shows a finished
            export with its AI-Disclosure Appendix exactly as it travels with
            the document. No sign-in required.
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
      </main>
    </div>
  );
}
