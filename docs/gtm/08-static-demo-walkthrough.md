# 08 · Static demo walkthrough (async / leave-behind)

> For emailing after a call, posting in a Slack DM, or leaving with a referral source.
> All honesty rules apply: never imply admissibility, never say the tool writes opinions.
> See `docs/gtm/00-content-brief.md`.

---

## Email cover note

**Paste this into the body of the email. Customize the bracketed fields.**

---

Subject: Disclosed. — the walkthrough I mentioned

[Name] —

Attached is a short walkthrough of Disclosed., the tool I described. The one thing I'd
ask you to look at first is frame 4 — the refusal. That's the whole product in one
screenshot: a sentence with an unknown citation ID gets blocked before
export. The disclosure appendix in frame 9 is the second thing worth
your time.

I'm looking for two or three vocational-rehabilitation practitioners to red-team the
template before it's final. If that's of interest, reply here and we can find 30 minutes.

[Your name]

*General information only — not legal advice; we are not a law firm. Verify the rules
for your jurisdiction.*

---

## Screenshot storyboard — 8–12 frames

> **How to capture each frame:** run the app locally (`npm run dev`) or use the deployed
> preview. Each `[screenshot: ...]` line describes exactly what to show and what crop/zoom
> to use. Capture at 1440px width, 2x retina if possible, then export at 100% for email.

---

### Frame 1
**[screenshot: `/workspace` — full page, worked example loaded, scrolled to the top so the always-on grounding pulse banner is visible and reads "Closed-world — Armed against [N] sources." The matter caption and expert name fields in section 1 should be filled in. No build yet.]**

**Caption:** The workspace opens with the always-on grounding pulse at the top — a live statement of which sources the tool has access to. Nothing else.

**Why it matters:** Sets the frame before a single fact is in play: the evidence list shows what the expert supplied to this draft.

---

### Frame 2
**[screenshot: `/workspace` — section 2 "Your evidence," zoomed to show 3–4 filled evidence items with their numbered chips (blue), content text, source/location fields, and section-tag dropdowns. The paste-and-extract area above should be visible but not the focus.]**

**Caption:** Each piece of evidence gets a number. Report sentences must cite IDs from this evidence list before export; the expert checks whether those sources support the claims.

**Why it matters:** Shows that the evidence list is the expert's own record, not a database the tool reaches into independently.

---

### Frame 3
**[screenshot: `/workspace` — paste-and-extract area, showing the "Upload a document" button and the "Pull items from this text" button. The annotation below the upload button that reads "PDF, Word, Excel, scans (OCR) — read in your browser; the file never leaves your computer" should be clearly visible.]**

**Caption:** Files are read in the browser. The bytes never leave the expert's computer — a confidentiality feature.

**Why it matters:** A forensic expert handling sensitive medical or financial records needs to know the intake step is local.

---

### Frame 4 — THE REFUSAL (most important frame)
**[screenshot: the homepage TryItDemo widget at `/#try-it` — "A made-up citation" preset selected. The textarea shows the sentence with `[[E:E9]]`. The right-hand sidebar "The only sources it has" shows three sources (E1, E2, E3). The verdict box reads "Export blocked — 1 sentence cites no source you supplied." The red "?" citation chip is visible inline with the sentence text.]**

**Caption:** A citation to a source that doesn't exist — E9 — is immediately flagged. Export stays blocked. This check catches unknown IDs; the expert must still inspect valid citations for unsupported claims.

**Why it matters:** This is the existential feature. The export gate blocks unknown citation IDs but cannot detect an unsupported claim attached to a valid ID.

*[Note: include the Kohls reference only with the caveat "summaries, not legal advice; verify against the official reporter."]*

---

### Frame 5 — Cleared and ready
**[screenshot: the homepage TryItDemo widget — "A properly cited sentence" preset selected. The textarea shows the sentence citing `[[E:E2]]`. The verdict box is green: "Ready to export — every sentence cites a source you supplied." The citation chip renders as a blue "2" superscript.]**

**Caption:** Cite a real source — one in your case file — and the sentence clears. Green means the citation-ID check passed; the expert still reviews the source relationship.

**Why it matters:** Shows the path forward is simple: cite your evidence, and the gate opens. No workaround is needed; correct practice is rewarded.

---

### Frame 6 — Build preview: section list with grounding badges
**[screenshot: `/workspace` — after clicking "Build & preview report," the preview section is visible. Show 3–4 section rows with their per-section badges: at least one "Cited" (green), ideally one "Awaiting your input" (amber). The readiness banner at the top of the preview should be visible and green (or amber). Crop to show the section list and badges clearly.]**

**Caption:** After the build, every section carries a grounding badge. "Needs review" blocks export; the expert resolves it before anything goes out.

**Why it matters:** The grounding check is not a final-step manual review — it runs per-section, per-build, and per-save, and it gates the export automatically.

---

### Frame 7 — Live grounding in the editor
**[screenshot: `/workspace` — one section in edit mode, the LiveGrounding component visible below the textarea. The textarea should contain a mix: one sentence with a valid citation (green dot), one sentence without a citation (red dot). The citation-insert buttons (`[[E:E1]]`, `[[E:E2]]`, etc.) should be visible above the grounding widget. The "Save & re-check" and "Revert to draft" buttons should be visible.]**

**Caption:** While editing a section, citation IDs are checked in real time. A red dot means the sentence needs a valid citation before export.

**Why it matters:** The expert sees an uncited sentence immediately, and the export gate blocks it if left unresolved.

---

### Frame 8 — The export buttons and disclosure record
**[screenshot: `/workspace` — the area containing the "Download Word (.docx)" and "Download PDF" buttons, plus the AI-Disclosure record panel below. The panel should show "Tamper-evident chain verified" in green, the statement text, and the "Prepared with: [model name]" line. The "You are the author" amber notice should be visible.]**

**Caption:** One export covers both Word and PDF. The AI-Disclosure record is built as the report is assembled — not retroactively — and the chain integrity is verified at export.

**Why it matters:** The disclosure is structural, not an afterthought. It records what the model was given, not just that AI was used.

---

### Frame 9 — The AI-Disclosure Appendix (in-app preview or sample page)
**[screenshot: the dark AI-Disclosure Appendix section at `/sample`, showing the table with columns "Section," "Model · version," and "Evidence provided." Three or four rows should be visible. The "Generated from the disclosure record" badge in the header should be visible. The italic note at the bottom about profile sections should be visible.]**

**Caption:** The appendix in the export: each AI-assisted section, the model and version, and the evidence IDs recorded as supplied to the model.

**Why it matters:** This is the discoverable methodology record. If counsel asks how AI was used, the expert has a documented, hash-chained account of recorded activity to review alongside other evidence.

---

### Frame 10 — Sample report: evidence panel
**[screenshot: `/sample`, two-column layout, right column showing the "Evidence you supplied" sidebar with 4–5 evidence items listed, each with a numbered chip and source description. One item should be highlighted (`:target` state, blue border) as if a citation chip was clicked. The note "Every numbered chip resolves to a supplied source; the expert verifies substantive support." should be visible.]**

**Caption:** Every numbered chip in the report resolves to one of these sources. Click a chip, jump to the source.

**Why it matters:** The citation trail is inspectable without the tool — if opposing counsel wants to verify, the references are readable in the exported document too.

---

### Frame 11 — Sample report: Rule 26 status banner
**[screenshot: `/sample`, the green Rule 26(a)(2)(B) banner: "Rule 26(a)(2)(B): all elements present." Discipline switcher above it showing "Vocational rehabilitation" selected and "Engineering" and "Accident reconstruction" as preview options.]**

**Caption:** The report is organized to the Rule 26(a)(2)(B) structure — all six required elements present. Compliance is the court's determination; the tool tracks the elements.

**Why it matters:** Organizing to the Rule 26 structure is not a guarantee; it is the work. The tool does the work; the expert signs.

---

### Frame 12 — Coverage check (private, ephemeral)
**[screenshot: `/sample`, the "Coverage check" section with the dashed indigo border. Show the "Private" badge, the "Challenge-readiness checklist" heading, and 4–6 checklist items — some with green dots (detected), some with amber dots and "not detected" badges. The footer note "Nothing here is logged, exported, or recorded in the AI-Disclosure appendix — it's a private check you control, kept out of the discoverable record by design" should be visible.]**

**Caption:** A private second set of eyes — questions opposing counsel might probe. The tool asks; the expert decides. Never logged, never exported.

**Why it matters:** The expert controls what is discoverable. The coverage check exists to help the expert prepare, not to add to the record.

---

## One-page leave-behind summary

> Use this as a PDF attachment or a second page of the email. ~250 words.
> Do not claim admissibility, SOC 2, or any certification not yet in place.

---

### Disclosed. — what it is and what it is not

**What it does.** Disclosed. structures a forensic expert witness's own findings into a
Rule 26(a)(2)(B)-organized report and keeps an automatic, tamper-evident record of how AI
was used. The expert independently verifies, prepares, adopts, and signs.

**The one invariant.** Report sentences must cite an ID from the expert-supplied
set before export. The editor displays the citation-ID check, and the export
route runs it again and blocks uncited or unknown-ID sentences. A valid ID still
needs expert review for actual source support.

**The disclosure record.** A tamper-evident, append-only, hash-chained audit log
contains AI-assisted sections, model and version, and evidence IDs logged as supplied.
This composes the AI-Disclosure Appendix in the export — a documented methodology record,
not a retroactive summary.

**What it is not.** The tool is designed to avoid originating facts, opinions,
numeric ranges, or conclusions; citation-ID checks alone cannot guarantee that.
It does not determine earning capacity, labor-market support, or the evaluee's
restrictions. The expert must make those judgments; the tool arranges draft text
and marks citations for expert verification. Admissibility is the court's call.

**Court formatting.** Exports include continuous line numbers, Century Schoolbook font,
and cover formatting standard in federal expert reports. Word (.docx) and PDF, one credit.

**Where it stands.** The vocational-rehabilitation template is the finished beachhead.
Engineering and accident reconstruction are in preview. Design partners help shape the
template before it is final — a red-teaming relationship, not beta testing.

**Pricing (being validated).** $250 for one report or a planned five-pack at
$1,000; first report at no charge. New unlimited memberships are not sold while
pilot volume and support costs are being measured.

*General information only — not legal advice; we are not a law firm. Summaries of case
law are not legal advice; verify against the official reporter and the rules for your
jurisdiction.*
