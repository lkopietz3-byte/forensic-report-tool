# 05 · Product mastery — the founder's field guide

> **Purpose.** Makes the founder the expert on their own product. For every
> user-facing capability: what it is, the buyer pain it answers, the one-sentence
> talking point, and the honest limit. Read this before any demo or discovery call.
>
> **Governed by** `docs/gtm/00-content-brief.md` and `CLAUDE.md`. If anything here
> conflicts with those files, fix this file. Honesty rules are not negotiable.

---

## The one sentence that must never be wrong

> "Disclosed. structures your own findings into a Rule 26(a)(2)(B)-organized report
> and keeps an automatic, tamper-evident record of how AI was used — so you can
> answer any question about AI methodology without reconstructing your session."

Commit this to memory. Every feature below is a sub-clause of that sentence.

---

## 1 · The closed-world grounding contract

### What it is

Every factual sentence in the report must carry an inline citation marker — `[[E:id]]`
— pointing to an evidence unit the expert personally entered. The id is the
identifier of a specific piece of evidence in the expert's list. The model (or the
rule-based formatter, in no-AI mode) operates only on the evidence it was given; it
has no access to the internet, prior cases, or any information source outside what
the expert supplied for this matter.

Two mechanisms enforce the contract:

1. **`[Expert input needed: …]` placeholders.** When the supplied evidence does not
   support a sentence, the model emits a placeholder rather than inventing content.
   The expert sees it in the preview; it stays visible until the expert fills it in.
   Gaps surface; they are never filled silently.

2. **Export hard-block (HTTP 422).** When the expert clicks "Download Word (.docx)"
   or "Download PDF", the server re-runs `checkGrounding` against every factual
   sentence before rendering the file. If any sentence is ungrounded (no citation)
   or carries a citation to an id that was not supplied for this report, the export
   returns HTTP 422 and the UI shows the offending sentences — the file is never
   produced. The expert cannot accidentally export an ungrounded report by
   bypassing the preview.

The grounding logic lives in `src/lib/domain/grounding.ts`. It is framework-agnostic
and fully unit-tested. The export gate lives in `src/app/api/report/export/route.ts`
and cannot be weakened without breaking a CLAUDE.md invariant.

### The buyer pain it answers

The cases that get vocational experts excluded — *Kohls v. Ellison*, *Concord Music
Group v. Anthropic*, *Matter of Weber* — share a common failure mode: AI introduced
content the expert could not trace, explain, or source. The grounding contract makes
that failure structurally impossible: the model cannot cite a source that was not
supplied, and the file cannot be produced if it tries.

### One-sentence talking point

"The system can only cite sources you gave it, and the file won't export if a single
sentence is missing its citation — that's the structure that keeps you traceable
under cross-examination."

### Honest limit

The grounding contract proves that each sentence in the export is traced to a source
the expert supplied. It does not verify that the source itself is accurate, that the
expert's interpretation of it is correct, or that the expert's conclusions will
survive Daubert challenge. The expert is the author; the expert confirms and signs.

---

## 2 · The tamper-evident, append-only, hash-chained audit log

### What it is

Every time a section is structured — whether by the AI model or the rule-based
formatter — an event is appended to the audit log. Each event records:

- which section was being structured
- the model name and version (e.g. `claude-3-5-sonnet-20241022`)
- the exact evidence unit ids that were fed to the model for that section
- a timestamp
- a SHA-256 hash of the event chained to the hash of the previous event

The chain is **append-only**: the database schema uses INSERT-only Row Level Security
(`src/supabase/migrations/0004_…`) so events cannot be updated or deleted. When a
saved report is loaded, the server re-runs `verifyAuditChain` over the entire chain;
if any entry was altered, deleted, or reordered, the chain check fails and the
workspace shows: "Note: the saved disclosure chain failed verification."

### The AI-Disclosure Appendix

`src/lib/domain/disclosure.ts` reads the audit log for a report and produces a
structured appendix. The appendix, which appears at the end of every Word and PDF
export, contains:

- A plain-language statement of how AI was used (or, in no-AI mode, that no AI
  produced any text)
- A table: section / model and version / evidence sources provided
- An integrity note: "Each entry in this record is cryptographically linked to the
  entry before it, so any later edit or deletion would be detectable."

Profile sections (qualifications, prior testimony, compensation) are authored
directly by the expert and involve no model call; they do not appear in the
disclosure table.

### Why "tamper-evident, not tamper-proof"

The hash chain makes any alteration to a stored entry **detectable** — the next
entry's hash will not match. It does not prevent someone with direct database write
access from rewriting the entire chain. This is an important honest distinction.
When an opposing counsel asks whether the disclosure record could have been altered,
the correct answer is: "The record was tamper-evident at the time of export; the
chain verified as unaltered then. Wholesale rewriting the chain is theoretically
possible by anyone with admin database access, which is why 'tamper-evident' is the
right word, not 'tamper-proof'."

Never say "tamper-proof," "immutable," or "unhackable." This is a CLAUDE.md hard
rule, not a style preference.

### The buyer pain it answers

*Conservation Law Foundation v. Shell Oil* (D. Conn.) — a magistrate ordered the
expert to produce her AI prompts as discoverable Rule 26 methodology. [**Critical
caveat:** this is a non-final magistrate order, objected to under Rule 72(a) and
stayed pending review — a signal of direction, not settled law. Always say so.] The
audit log and appendix are the answer to that order before it is issued: the expert
can produce exactly which sections, which model version, and which evidence was
provided, without needing to reconstruct a session from memory.

### One-sentence talking point

"The appendix is generated automatically from a cryptographically linked record — not
reconstructed from memory after the fact."

### Honest limit

The audit log records events faithfully if the software runs as designed. It is not
an independent third-party attestation, and it does not constitute a legal instrument.
Whether any given disclosure satisfies a court's requirements remains a judicial
determination. We are not a law firm; verify the applicable rules for your
jurisdiction. This is general information, not legal advice.

---

## 3 · No-AI deterministic mode

### What it is

The AI assistance toggle in the workspace (labelled "Use AI to help structure the
writing") can be turned off. In that mode, the report is assembled by a fixed,
rule-based formatter: no generative model is invoked, and the disclosure statement
in the appendix states: "No generative AI model produced any text in this report."
The evidence is still organized by section, citations still work identically, and
the export gate still enforces grounding. The difference is that the prose is the
expert's confirmed text, re-emitted with its citation — the formatter originates
nothing.

The `noAi` flag is sent in the build payload; the server-side assembler in
`src/lib/report/assemble.ts` branches on it and uses the `STRUCTURER_MODEL`
identifier for the audit event so the disclosure statement auto-selects the no-AI
wording.

### The buyer pain it answers

Some experts prefer to draft entirely in their own words and want the tool only for
structure, citation enforcement, and the disclosure appendix — not prose assistance.
No-AI mode serves them without any change to the trust or grounding mechanics.

### One-sentence talking point

"You can assemble the whole report with no model at all; the disclosure then says
so, and everything else — the grounding gate, the appendix — works exactly the same
way."

### Honest limit

No-AI mode does not mean the tool produced the report unaided. The expert's text
still passes through the system, is formatted, and is exported. The disclosure
accurately reflects this.

---

## 4 · Live per-sentence grounding; the always-on grounding pulse

### What it is

**Live per-sentence grounding in the section editor.** When the expert opens a
section to edit (via the "Edit" button in the preview), the `LiveGrounding` component
(`src/app/workspace/LiveGrounding.tsx`) checks each sentence in real time against
the allowed evidence ids for that section. A green tint means the sentence is cited;
amber means it contains a `[Expert input needed:]` placeholder; red means the
sentence is ungrounded or carries an invalid citation. This is computed locally from
`classifySentence` in `grounding.ts` — the same function the export gate uses — so
what the expert sees in the editor is exactly what the gate will enforce.

**The always-on grounding pulse.** A sticky banner at the top of the workspace shows
the current grounding status at all times:

- **Closed-world (neutral / blue):** before a build — states the grounding promise
  and how many evidence sources are "armed."
- **Not ready (red):** after a build, if any factual sentence is ungrounded or the
  disclosure chain failed verification — "N sentences need a source. Export stays
  blocked."
- **Almost there (amber):** all sentences cited, but some sections still have
  `[Expert input needed:]` placeholders awaiting the expert's input.
- **Grounded (green):** every sentence cited to the expert's evidence and the
  disclosure chain verified — "Ready to export."

The pulse is derived from the preview state already on screen; it is never sent to
any server.

### The buyer pain it answers

An expert should not need to run the full export to discover that a sentence is
ungrounded. The live tint surfaces the issue at the point of editing; the pulse
surfaces it at a glance.

### One-sentence talking point

"The grounding check runs sentence-by-sentence as you type — what you see in the
editor is exactly what the export gate will check."

### Honest limit

The live grounding check verifies that sentences carry valid citation markers to
sources the expert supplied. It does not verify the accuracy of those sources or the
correctness of the expert's conclusions.

---

## 5 · Evidence as figures; court formatting

### What it is

**Evidence as figures.** Any evidence item can have an image attached (via the
"+ Attach image (renders as a numbered figure)" label on each evidence row). The
image is resized client-side to a figure-sized PNG — the original never leaves the
expert's computer. In the export, images appear as numbered figures in a Figures
section after the report body, captioned with the evidence item's location field.
They are cited by their evidence id like any other item; an image attached to an
uncited sentence is still 422-blocked.

Deliberate limit: images are session-held and not persisted when the report is saved.
The save toast says so explicitly: "Attached figures stay in this session and embed
when you export — they aren't stored yet, so re-attach them next time you open this
report." Text, citations, and the audit chain do persist.

**Court formatting.** The Word (.docx) and PDF exports apply:

- Continuous line numbers in the left margin (the standard for federal court expert
  reports in many jurisdictions)
- Century Schoolbook typeface (the conventional forensic-report font)
- A cover page with the Disclosed. logo, matter caption, and expert name

These are formatting choices only — they never affect content or grounding.

### The buyer pain it answers

An expert whose report is missing line numbers has to reformat for submission. An
expert who needs to embed a site photo or functional assessment diagram as a
numbered figure needs that wired to the citation system, not pasted as a floating
image with no traceability.

### One-sentence talking point

"Figures are cited evidence items, not decorations — they're grounded the same way
as text."

### Honest limit

Line numbering conventions vary by jurisdiction and judge. The expert should confirm
that the format matches the court's requirements before filing. We are not a law
firm; this is not legal advice.

---

## 6 · Client-side intake and OCR

### What it is

The "Upload a document" button accepts PDF, Word (.docx), Excel (.xlsx/.xlsm), HTML,
plain text (.txt/.md/.csv/.tsv/.json/.xml/.yaml/.log), and images (PNG, JPEG, TIFF,
BMP, GIF, WebP). Scanned PDFs and image files are processed by a self-hosted
Tesseract OCR engine — the engine and a compact English model are bundled with the
app from `public/tesseract/`, with no CDN dependency.

**The file never leaves the browser.** All parsing — PDF text extraction via pdfjs,
Word parsing via mammoth, spreadsheet parsing via SheetJS, OCR via Tesseract — runs
entirely in the client. The only thing sent to the server is the extracted text,
after the expert has reviewed it and clicked "Pull items from this text." This is a
confidentiality feature: case records containing PHI, trade secrets, or attorney
work-product never travel to Disclosed.'s servers.

OCR'd text is flagged with: "Read by OCR — check the text against the original
before pulling items." The expert is responsible for verifying the extracted text
before treating it as evidence.

The expert can also bypass upload entirely and click "+ Add an evidence item by
hand" — for when the source is an oral examination, a phone call, or a document
the expert reviewed physically.

Declined by design: RTF and legacy .doc formats are not supported. A hand-rolled
parser for those formats would risk returning garbled text; a wrong read is worse
than no read.

### The buyer pain it answers

Forensic case records routinely contain PHI. Experts — and especially their
retaining counsel — need assurance that uploading a medical record or deposition
transcript to a cloud tool does not transmit the patient's or client's data to a
third-party server. Client-side processing removes that concern entirely for the
intake step.

### One-sentence talking point

"The file stays on your machine — only the text you pull from it, and only after you
review it, is sent to the server."

### Honest limit

Once the expert clicks "Pull items from this text," the extracted text is sent to
the server for segmentation into evidence items. The expert controls what text is
sent and when. Data handling for stored reports is described in our privacy
commitment; we commit to not training on customer data, but we do not currently hold
SOC 2 certification or a signed zero-retention contract.

---

## 7 · The readiness check

### What it is

After "Build & preview report" runs, a readiness panel appears at the top of the
preview. The readiness check is composed by `src/lib/domain/readiness.ts`, which
aggregates three signals:

1. **Rule 26(a)(2)(B) completeness.** Did the expert supply the six required
   elements: (i) opinions and basis; (ii) facts and data considered; (iii) exhibits;
   (iv) qualifications and publications (10 years); (v) prior testimony (4 years);
   (vi) compensation statement?
2. **Grounding.** Are all factual sentences in all sections cited to supplied
   evidence?
3. **Disclosure-chain integrity.** Does the audit chain verify?

Issues are categorized as "blocker" (prevents export) or "warning" (does not block
but the expert should review). The readiness check panel says explicitly: "Automated
internal checks — completeness, every sentence cited to your evidence, and
disclosure-record integrity. Not a determination of admissibility, which is the
court's."

### Saved reports and the disclosure chain re-verifying on load

When a saved report is opened via "Open" in the saved-reports list, the server
re-runs `verifyAuditChain` over the stored audit events before returning the data.
The workspace then shows either "Opened. Disclosure chain verified." or "Opened.
Note: the saved disclosure chain failed verification." This catches any alteration to
the stored audit entries since the report was last saved.

### Credits and pricing (soft framing)

The product is priced per report. The current pricing being tested: a single report
credit at $250; a pack of five credits at $1,000 ($200 per report). The first report
is free (no credit required) for new accounts. New unlimited memberships are not
being sold until the founding cohort establishes real volume and support needs.

One credit covers both the Word and PDF export for the same report — the expert does
not pay again to switch formats. Credits are visible in the workspace and update in
real time after each export.

Frame on a call: many forensic experts write between two and eight reports per year.
Per-report pricing means a light-volume expert pays only for what they use; the
five-pack rewards repeat use without committing Disclosed. to unbounded support or
usage. Some experts may treat the tool as a case expense, subject to their own
engagement terms and applicable billing rules.

### One-sentence talking point (readiness)

"The readiness check is an automated internal checklist — it tells you what's still
missing before you export, but admissibility is always the court's call."

### Honest limit

The readiness check is not a legal review. It is a software check that runs against
the report structure. It cannot evaluate whether the expert's opinions are
methodologically sound, whether the evidence is sufficient for the jurisdiction, or
whether the report will satisfy Daubert or the applicable evidentiary standard.

---

## 8 · Word and PDF export

### What it is

"Download Word (.docx)" and "Download PDF" both trigger the same server-side export
route (`src/app/api/report/export/route.ts`). Before any file is rendered:

1. The server re-checks entitlement (Pro tier or credits available).
2. The server re-runs `checkGrounding` on every factual section. Any ungrounded or
   invalid-citation sentence returns HTTP 422 and the file is not produced.
3. The credit is spent atomically (database-level, not read-then-write) so a
   network retry cannot double-spend.

The rendered file contains: the report body with line numbers, a Figures section if
any evidence has image attachments, an Exhibits section for tabular exhibits, and
the AI-Disclosure Appendix.

Citation markers (`[[E:id]]`) are stripped from the export prose — the reader sees
clean text. The disclosure appendix carries the complete evidence-to-section mapping.

### One-sentence talking point

"The export gate runs the same grounding check the editor shows — if it was green in
the preview, the file comes out clean."

### Honest limit

The export produces a Word document or PDF. What the expert does with it — whether
it is filed, disclosed to opposing counsel, or submitted under a particular court's
local rules — is the expert's responsibility. Admissibility is the court's call.

---

## 9 · What Disclosed. deliberately does NOT do

This section exists so the founder does not over-promise on a call. These are honest
limits, not roadmap teases.

| What it does not do | Why |
| --- | --- |
| Does not form opinions | The tool can only structure, format, and organize what the expert supplies. It has no domain knowledge of vocational rehabilitation, engineering, or any other discipline. |
| Does not verify sources | Grounding proves that a sentence cites a source the expert supplied — not that the source itself is accurate. |
| Does not guarantee admissibility | Admissibility is a judicial determination. The tool is designed to support disclosure; whether that disclosure satisfies a court's requirements is the court's call. |
| Does not guarantee Rule 26 compliance | The report is organized to the Rule 26(a)(2)(B) structure and the readiness check flags missing elements. Whether the content in those elements is legally sufficient is not ours to determine. |
| Does not file with the court | It produces Word and PDF files; what happens next is the expert's and counsel's responsibility. |
| Does not manage e-discovery | Case-management and e-discovery integrations are Phase 2. |
| Does not support multi-contributor intake yet | Shared case rooms (paralegals, associates contributing evidence) are designed but blocked on auth infrastructure. |
| Does not persist image figures on save | Images are session-held. The audit chain, evidence text, and citations persist. Images must be re-attached after reopening a saved report. |
| Does not hold SOC 2 certification | Data handling is described as a commitment and intent; we do not currently hold any certification or signed zero-retention contract. |
| Does not support RTF or legacy .doc | A wrong read is worse than no read for those formats. |
| Does not support multi-language OCR yet | English only; additional language support is a future capability. |

---

## 10 · The honesty invariant — the product's soul

From `CLAUDE.md`:

> **The tool must not be designed to introduce facts, opinions, numeric ranges, or
> citations beyond material the expert supplied.** Prompts restrict generation to
> supplied evidence, model-extracted evidence must match source text, and missing or
> unknown citation IDs block export. These controls do not prove semantic support or
> truth; the expert independently verifies every statement and source relationship.

This is not a positioning statement. It is the design constraint that every feature
above is built to enforce. On a call, if you are ever tempted to say the tool writes
the report, generates findings, or drafts opinions — stop. Those verbs are wrong and
they undermine the product's entire value proposition to a buyer who is trained to
find the overstatement.

---

## Quick-reference: the words that matter

| Say | Never say |
| --- | --- |
| structures / formats / organizes | drafts opinions / generates findings / writes the report |
| you verify, prepare, adopt, and sign | the AI wrote / our report |
| Rule 26(a)(2)(B)-structured | Rule 26-compliant / guaranteed compliant |
| designed to support disclosure | court-defensible / admissible |
| tamper-evident | tamper-proof / immutable |
| commitment to not train on your data | SOC 2 / signed zero-retention contract |
| traced to a source you supplied | fact-checked / verified true |
| admissibility is the court's call | will hold up in court |

---

*This document is internal founder prep material. Do not share with prospects as-is.*
