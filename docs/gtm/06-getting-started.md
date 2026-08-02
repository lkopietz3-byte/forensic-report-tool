# 06 · Getting started — your first report in Disclosed.

> **Who this is for.** A forensic expert witness opening the workspace for the first
> time. Zero to a signed-ready export, step by step.
>
> **What this is not.** Legal advice. Admissibility is always the court's call.
> Verify the applicable rules for your jurisdiction.

---

## Before you begin

Disclosed. works with any forensic expert witness matter. The full worked example is
vocational rehabilitation and earning capacity; engineering and accident
reconstruction templates are available as previews.

You'll need:
- The case caption and retaining counsel's name
- Your credentials and compensation arrangement (required for Rule 26)
- A list of your prior testimony (last 4 years — required for Rule 26)
- Your evidence: case records, deposition excerpts, evaluation notes, medical
  records, or any documents you reviewed in forming your opinions

Everything you type into the workspace stays in your browser session until you save
it to your account. Nothing is sent to the server until you click "Pull items from
this text" or "Build & preview report."

---

## Step 1 · Set up the matter

The first card in the workspace is labelled **1 · The matter and you**.

Fill in:

- **Matter / caption** (required) — the full case name and docket number as it
  will appear on the cover page. Example: *Alvarez v. Brightline Mechanical Servs.,
  No. 2025-CV-04417*
- **Retaining counsel** — the firm and party they represent. Example: *Hahn &
  Castro LLP (Plaintiff)*
- **Your role** — pre-filled as "Vocational rehabilitation & earning-capacity
  expert"; edit to match your discipline
- **Your name** (required) — your name as it will sign the report. Example: *Dana
  M. Whitfield, M.S., CRC*
- **Credentials** — your certifications, degrees, and designations
- **Statement of compensation** — Rule 26(a)(2)(B) requires you to disclose the
  compensation you're paid for the study and testimony. Enter your own arrangement.
  The tool formats what you type; it does not suggest compensation terms.
  Example: *$295/hr review; $450/hr testimony; not contingent on the outcome.*
- **Prior testimony (last 4 years) — one per line** — Rule 26(a)(2)(B) requires
  listing cases where you testified as an expert at trial or by deposition in the
  previous 4 years. One case per line.

[screenshot: Section 1 of the workspace with fields filled in]

> **Tip.** If this is your first time, click **Load a worked example** in the blue
> banner at the top of the workspace. It populates a complete vocational-rehab
> matter so you can see the whole flow — then edit any field to make it yours, or
> click **Start over** to begin fresh.

---

## Step 2 · Add your evidence

The second card is labelled **2 · Your evidence**.

Evidence items are the foundation of the report. Every factual sentence in every
section will be required to cite at least one of these items — by the citation
system and by the export gate. The tool assigns each item a number (1, 2, 3, …);
those numbers appear as small superscript chips in the preview and in the final
export.

You have three ways to add evidence:

### 2a · Upload a document

Click **Upload a document**. Accepted formats: PDF, Word (.docx), Excel (.xlsx),
HTML, plain-text formats (.txt, .md, .csv, .tsv, .json, .xml, .yaml, .log), and
images (PNG, JPEG, TIFF, and others).

**The file never leaves your computer.** All reading — including OCR for scanned
PDFs and image files — runs entirely in your browser. Nothing is sent to the server
until you explicitly pull items.

If the document was scanned (or is an image), you'll see: "Read by OCR — check the
text against the original before pulling items." Review the extracted text in the
text box; correct any OCR errors before proceeding.

[screenshot: Upload a document button and the text area after a PDF loads]

### 2b · Paste document text

Paste any text directly into the text area — deposition excerpts, notes, a records
list, or anything you've already pulled into a document. Type a source label (e.g.
"Depo of J. Alvarez") and choose the section it belongs to, then click:

**Pull items from this text**

The tool segments the text into individual citable items and adds them to your
evidence list. Review each item — you can edit any field.

### 2c · Add an item by hand

Click **+ Add an evidence item by hand** at the bottom of the evidence list. Fill in:

- **Evidence content** — a single fact, finding, measurement, or statement
- **Page/line cite** — where in the source document this appears (e.g. *Depo p.18
  ln.4*)
- **Section** — which part of the report this evidence supports

For each item, you can also click **+ Attach image (renders as a numbered figure)**
to embed a photo or diagram. The image is resized in your browser and will appear as
a numbered figure in the Figures section of the export. The source field becomes the
figure caption. Images embed when you export but are not stored when you save —
the save toast will remind you to re-attach them next time.

### Assigning and reordering evidence

Each item has a **section dropdown** — use it to assign the item to the part of the
report it supports. You can change section assignments at any time.

Use the **↑** and **↓** buttons to reorder items. The narrative in each section
follows the order of the evidence items assigned to it, so the order matters.

To remove an item, click **Remove** on its row.

[screenshot: Evidence section with several items, showing numbered chips and section dropdowns]

---

## Step 3 · Review sources at a glance

Below the evidence list is the **Sources panel**, which groups your items by
document source. You can:

- Rename a source (all items from that document update at once)
- Reassign all items from a source to a different section in bulk
- Remove all items from a source at once
- See which items are already cited in the last preview (cited / uncited badges)
- Click an item's number to scroll to it in the evidence list

This is a display-only panel — it never sends anything to the server.

---

## Step 4 · Choose formatting options

The **Deliverable options** card lets you set the formatting of the output file.
These are presentation choices only — they never affect content or grounding:

- Font (Century Schoolbook by default — the conventional forensic-report font)
- Spacing
- Whether line numbers appear (on by default — standard for many federal court
  filings; confirm your court's requirements)
- Whether the AI-Disclosure Appendix is included in the export

[screenshot: Deliverable options card]

---

## Step 5 · Choose AI mode

Below the deliverable options is a toggle labelled **Use AI to help structure the
writing**.

- **On (default):** a model arranges your confirmed findings into fluent prose,
  still cited only to your evidence. You review and sign every line.
- **Off:** a fixed, rule-based formatter assembles the report with no model involved.
  The AI-Disclosure Appendix will state that no AI produced any text.

Either way, the grounding gate applies identically: every sentence must cite your
evidence or be flagged, and the file won't export until it does.

---

## Step 6 · Build & preview

Click **Build & preview report**.

[screenshot: Build & preview report button]

The workspace assembles the report and shows you:

### Readiness panel

A colored banner at the top of the preview summarizes the automated internal checks:

- **Green:** every sentence is cited to your evidence, the disclosure chain
  verified, and all Rule 26 elements are present. Ready to export.
- **Amber:** all sentences are cited, but some sections still have
  `[Expert input needed:]` placeholders waiting for your input.
- **Red:** one or more sentences need a citation, or the disclosure chain check
  failed. Export is blocked.

The panel says explicitly: "Automated internal checks — completeness, every sentence
cited to your evidence, and disclosure-record integrity. Not a determination of
admissibility, which is the court's."

### Section preview

Each section appears with a status badge:

- **Cited to your evidence (green):** all sentences in this section are grounded
- **Awaiting your input (amber):** the section contains `[Expert input needed: …]`
  placeholders you need to fill
- **Needs review (red):** one or more sentences are ungrounded or cite a source id
  that wasn't supplied — these sentences are listed below the section text

[screenshot: Section preview showing Cited and Awaiting your input badges]

---

## Step 7 · Resolve flagged sentences

If any section shows **Needs review** or **Awaiting your input**, click the **Edit**
button on that section.

You'll see a text editor with the section text and, below it, a row of citation
buttons for each evidence item assigned to this section:

```
[[E:E1]]   [[E:E2]]   [[E:E3]]
```

Click a citation button to insert the citation marker at your cursor position. A
factual sentence must include at least one citation to the evidence that supports it.
As you type, the live grounding check updates in real time: green means the sentence
is cited, red means it still needs a source.

For `[Expert input needed: …]` placeholders: replace the placeholder with your own
text, then add the appropriate citation. The tool asks; you decide.

When you're done editing a section, click **Save & re-check**. The report rebuilds
and the readiness panel updates. If you want to discard your edits and return to the
assembled draft, click **Revert to draft**. Click **Cancel** to close the editor
without any change.

[screenshot: Section editor open with citation buttons and live grounding tint]

> **The always-on grounding pulse** (the sticky banner at the top of the workspace)
> reflects the current status at all times — "Not ready / N sentences need a source",
> "Almost there", or "Grounded / Ready to export." It updates after every rebuild.

---

## Step 8 · Export Word or PDF

When the grounding pulse shows **Grounded** and the readiness panel is green:

Click **Download Word (.docx)** or **Download PDF**.

The server re-runs the grounding check before rendering the file. If everything
passes, the file downloads to your computer. If something was missed, you'll see the
flagged sentences and the download will not proceed.

The exported file contains:
1. The report body with line numbers, your name, and the matter caption on the cover
2. A Figures section (if you attached images to any evidence items)
3. Exhibits (tabular data from your evidence)
4. The AI-Disclosure Appendix

[screenshot: Download Word (.docx) and Download PDF buttons]

---

## Step 9 · What the AI-Disclosure Appendix is

The Appendix at the end of your exported file is generated automatically from the
disclosure record — a cryptographically linked log of exactly what happened during
the build:

- Which sections were structured with AI assistance (or, in no-AI mode, that none
  were)
- The model name and version used for each section
- The evidence items provided to the model for each section

The Appendix also includes an integrity note: "Each entry in this record is
cryptographically linked to the entry before it, so any later edit or deletion
would be detectable." This means tampering with the record is **detectable**, not
impossible — which is why the word "tamper-evident" is used, not "tamper-proof."

Profile sections — your qualifications, prior testimony, and compensation statement
— are authored directly by you. They involve no model call and do not appear in the
disclosure table.

You can share the [For retaining counsel →] one-pager with your client's counsel to
explain what the disclosure record is and how to read it.

---

## Step 10 · Save your report to your account

Click **Save to my account** at any point to save the current state. A saved report
stores:
- The matter, your expert details, all evidence text and citations
- Your section edits and formatting choices
- The audit chain (the disclosure record)

What is **not** stored: attached images. Images stay in your browser session and
embed when you export, but they are stripped from the saved payload. The save
message will tell you if any images were omitted. Re-attach them next time you open
the report.

To reopen a saved report, scroll to **Your saved reports** at the top of the
workspace and click **Open**. When the report loads, the workspace will show either
"Opened. Disclosure chain verified." or a notice if the chain check did not pass.

[screenshot: Saved reports list with an Open button]

---

## Credits and billing

The workspace shows your current credit balance. One credit covers both the Word and
PDF download for the same report — you do not pay twice to switch formats.

To buy credits:
- **Buy 1 report — $250** — a single report credit
- **Buy 5 reports — $1,000** — a pack of five credits ($200 per report)

New unlimited memberships are not being sold while founding-pilot report volume
and support costs are measured. Existing legacy members can still use **Manage
billing**.

Many experts pass report costs to retaining counsel as a case expense.

---

## What is and is not stored

| Stored when you save | Not stored |
| --- | --- |
| Matter caption, expert name and credentials | Your uploaded documents (they never left your browser) |
| All evidence text and source citations | Images attached to evidence items |
| Your section edits | The raw extracted text from the paste area |
| Formatting choices (font, spacing, line numbers) | Coverage check / challenge-readiness output (ephemeral by design) |
| The audit chain (the disclosure record) | — |

The coverage check and challenge-readiness checklist that appear after a build are
private and ephemeral — they never appear in the report, are never logged to the
disclosure record, and are not stored. This is deliberate: a logged "we flagged a
gap" could be discoverable as methodology.

---

## Frequently asked questions

**Q: Can opposing counsel see the AI-Disclosure Appendix?**
The Appendix is part of your export file. Whether and when you disclose it depends
on the discovery rules and court orders in your matter. We are not a law firm; verify
the applicable rules for your jurisdiction.

**Q: What if the tool says `[Expert input needed: …]`?**
That means the supplied evidence did not support that sentence — the tool refused to
invent content. Fill in your own text based on your expert judgment, then add the
citation to the evidence that supports it.

**Q: Can I use my own wording instead of the AI-structured prose?**
Yes. Click **Edit** on any section, write what you want, and add your citations. The
grounding gate applies to your edits exactly as it does to the AI-structured draft.
Turn off the AI toggle before building if you want to start from your confirmed
findings rather than a structured draft.

**Q: Why can't I export?**
The most common reasons: (1) a sentence is missing a citation — the readiness panel
will list which sentences; (2) a `[Expert input needed:]` placeholder is still in
the text; (3) the disclosure chain did not verify on load. Check the red readiness
panel for specifics.

**Q: What happens to my files when I upload them?**
They never leave your browser. All parsing — PDF text extraction, Word reading,
spreadsheet parsing, OCR for scanned documents — runs entirely on your device. Only
the text you review and choose to pull into evidence items is sent to the server.

**Q: Is this report "court-defensible" or "compliant"?**
No. The report is organized to the Rule 26(a)(2)(B) structure and every factual
sentence is traced to your evidence. Whether any report is admissible is a judicial
determination that depends on the expert's qualifications, methodology, and the
court's standards. We are not a law firm; this is not legal advice.

---

*General information, not legal advice. We are not a law firm. Verify the applicable
rules for your jurisdiction.*
