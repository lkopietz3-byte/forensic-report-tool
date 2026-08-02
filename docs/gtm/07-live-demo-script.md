# 07 · Live demo script

> Governing voice: precise, calm, accountable. The expert authors; the tool structures.
> Never claim admissibility, compliance, or court outcome. Never say the tool "drafts" opinions.
> See `docs/gtm/00-content-brief.md` for the full honesty rules.

---

## Pre-demo setup checklist

Run through this 10 minutes before anyone joins.

**Tabs to have open (in order, left to right):**
1. `/workspace` — the full builder, loaded with the **worked example** already filled in (click "Load a worked example" in advance). Confirm the always-on grounding pulse reads "Armed against X sources."
2. `/sample` — the vocational-rehab sample report, scrolled to the top. The discipline switcher should be visible.
3. `/sample#ai-disclosure` (or scroll-ready) — the dark AI-Disclosure Appendix section at the bottom of the same page.
4. A blank tab you can use to download the Word export from `/workspace`.

**State to verify before starting:**
- In `/workspace`, the worked example is loaded. You can see evidence items in section 2, and matter/name fields are filled.
- The grounding pulse banner at the top of `/workspace` reads "Closed-world — Armed against [N] sources."
- The browser is zoomed so text is readable from a screen share (Cmd+= a couple of times in Chrome/Safari). 130% is usually right.
- Network is stable. The build call takes 5–20 seconds; warn the guest if your connection is unreliable.
- If you plan to show the export: confirm the PDF or Word download opens correctly on your machine.

**Graceful failure lines (memorize these):**
- If "Build & preview report" is slow (>20 seconds): *"The model is doing the structuring right now — this is the one step that touches the network. Everything else — the grounding check, the citation logic, the disclosure record — runs in your browser with no server call."*
- If the build errors: *"Let me reload the worked example and show you the sample report instead — it's the same output, static."* Then switch to tab 2.
- If the export download doesn't open: *"The file is there — let me find it in Downloads and open it."* Do not let this derail more than 30 seconds.
- If asked a domain question you can't answer: *"That's exactly the kind of thing I want the design partner to correct — the template gets red-teamed by practicing experts before it's final. What would the right framing be?"*

---

## 5-minute version: "The wow"

**Goal:** Show the closed-world refusal in 90 seconds, then clear it and export. The single most persuasive five minutes is the moment the tool says no.

**Who this is for:** A first call where you have 5 minutes of genuine attention. Get to the refusal fast.

---

### Beat 1 — Set the one-minute frame (60 seconds, no clicks yet)

*Say:*
> "One thing before I show you anything: the whole product is built around a single constraint. The tool cannot put a fact into a report unless it cites a source you gave it. That's not a setting — it's the architecture. I want to show you what that looks like when you try to break it."

*Point out the grounding pulse banner at the top of /workspace.*
> "That banner is always on. Right now it says 'Closed-world.' It's telling you which sources the tool has access to — only the ones in section 2. We're going to feed it a sentence that reaches outside that world."

---

### Beat 2 — The refusal moment (90 seconds)

**Click:** Open tab 1 (`/workspace`). The worked example is already loaded.

*Say:*
> "I'm going to type a sentence into the evidence text box — actually, let me just show the demo widget on the homepage, because it's cleaner for this."

*[Optional: if you'd rather use the landing page TryItDemo widget, navigate there. Otherwise stay in /workspace and use the paste-and-extract box.]*

**Navigate:** go to the homepage and scroll to the "Try it" demo section. Three preset buttons are visible: "An unsupported claim," "A made-up citation," and "A properly cited sentence."

**Click:** "An unsupported claim."

*Say:*
> "This is a sentence with a dollar figure — 'The claimant will lose $2.3 million in lifetime earnings.' Notice there's no citation. Watch what happens."

*Point to the verdict box, which now reads "Export blocked — 1 sentence cites no source you supplied."*

> "Blocked. The tool won't let that sentence into a report because it has no evidence behind it. Not a warning, not a flag you have to remember to check — a hard block."

**Click:** "A made-up citation."

*Say:*
> "Now I've added a citation — E:E9. But look at the sidebar: there are only three sources. E9 doesn't exist. Watch."

*Point to the citation chip rendering as a red "?" and the verdict still reading "Export blocked."*

> "Still blocked. And this is the scenario that struck an expert's declaration in Kohls v. Ellison in January 2025 — the expert let a model fill in citations, the model invented them, and the court struck his entire declaration as credibility-shattering. This check prevents an unknown source ID from passing silently. It does not prove that a valid source supports the sentence, so the expert still compares every statement to the cited source."

*[Note: always add "summaries, not legal advice; verify against the official reporter" if the audience presses on case specifics.]*

---

### Beat 3 — Clear it (45 seconds)

**Click:** "A properly cited sentence."

*Say:*
> "Now I've cited to source 2 — the labor-market survey, which is actually in this case file. Green. Export open."

*Point to the verdict: "Citation check passed — every sentence names a source you supplied."*

> "That's the automated invariant: every factual sentence has a recognized source marker before export. The human invariant is the expert verifying that the source actually supports it."

---

### Beat 4 — Export and show the appendix (90 seconds)

**Switch to:** tab 1 (`/workspace`), scrolled to the build buttons at the bottom of section 2.

*Say:*
> "Let me show you the actual output. This is a vocational-rehabilitation earning-capacity matter — fictional, for the demo. The expert's findings are already in. I'll build and preview it."

**Click:** "Build & preview report."

*[While it builds — 5–20 seconds:]*
> "The model is arranging the expert's findings into the Rule 26(a)(2)(B) structure — opinions and basis, facts and data considered, exhibits, qualifications, prior testimony, compensation statement. It can only cite the evidence in section 2. It flags any gap."

*[Once preview appears, point to the Readiness banner:]*
> "Green. Every sentence cited. Disclosure chain verified. Now I'll download it."

**Click:** "Download Word (.docx)" (or PDF — whichever opens faster on your machine).

*[While it downloads:]*
> "One credit covers both formats."

*[Open the downloaded file. Scroll to the end.]*

> "This is the AI-Disclosure Appendix. It's generated automatically from a tamper-evident, append-only record: each AI-assisted section, the model and version, and exactly the evidence it was given — and nothing it was not given. This is what opposing counsel sees if they ask how AI was used."

*Point to the table in the appendix.*

> "If the disclosure record were altered after the fact, the hash chain would fail on reload. The product uses the word tamper-evident, not tamper-proof — we can detect a change, not prevent one. That distinction matters to the people who read this."

---

### Transition to design-partner ask (45 seconds)

*Say:*
> "That's the five-minute version. The template — the section structure for vocational rehab — was built from desk research. I need a practicing expert to red-team it. That's what a design-partner slot means: you shape the template, I build what you need, and you get the tool at no charge for the first few reports while we get that right. Is that a conversation you'd want to have?"

*If yes: book the next call here. If they want to see more: run the 15-minute version.*

---

## 15-minute version: full walkthrough

**Goal:** Walk every surface in order. The expert sees the complete flow from intake to export, with real grounding feedback, a live edit, and the disclosure appendix.

---

### Beat 1 — Frame and context (2 minutes)

**Screen:** `/workspace`, worked example loaded, no build yet.

*Say:*
> "What I'm going to show you is the complete flow a forensic expert would use. I'll go section by section. There are four surfaces: intake — where evidence comes in; the evidence list; the build and preview; and the export with the disclosure appendix. The whole thing takes an expert 30–60 minutes for a real matter once their notes are organized."

*Point to the always-on grounding pulse at the top.*
> "That banner stays on the whole time. Before a build it tells you how many sources the tool is armed with. After a build it tells you whether every sentence is cited. It's the same check that gates the export — there's no separate 'run the check' step."

---

### Beat 2 — Intake (2 minutes)

**In section 1 ("The matter and you")**, point to the fields.

*Say:*
> "Section 1 is the matter caption and the expert's profile. Matter caption, retaining counsel, the expert's name and credentials, statement of compensation — that's a Rule 26(a)(2)(B) required element — and prior testimony for the last four years, same requirement. The tool formats what the expert types; it doesn't fill any of this in."

*Show the worked example's filled-in fields briefly.*

**Scroll to section 2 ("Your evidence").**

*Say:*
> "Section 2 is where evidence comes in. The expert can paste text — a deposition excerpt, their own notes, a records list — and click 'Pull items from this text.' The tool segments it into citable items the expert then reviews and edits. Or they can upload a file."

*Point to the upload button.*
> "PDF, Word, Excel, scans via OCR — the file is read entirely in the browser. The bytes never leave the expert's computer. That's a confidentiality feature, not a limitation."

*Show one evidence item already in the worked example — its content, source/location field, and section tag.*
> "Each item gets a number. That number is how every sentence in the report cites back to it. Items can only be cited in the section they're tagged to."

---

### Beat 3 — Evidence list and sources panel (1 minute)

**Scroll past the evidence items to the sources panel.**

*Say:*
> "The sources panel groups items by document — so if ten items came from the same deposition, they're grouped together. You can bulk-move them to a different section, rename the source, or remove a batch. It's organization, not content."

*Point to the "cited/uncited" badges if visible (they appear after a build — skip if not yet built).*

---

### Beat 4 — Build and preview (3 minutes)

**Scroll to the build buttons.**

*Say:*
> "Now I'll build. This is the one step that calls the model."

**Click:** "Build & preview report."

*[While building, talk through what's happening:]*
> "The model receives the expert's evidence items — the confirmed facts the expert added — and arranges them into the Rule 26 structure. It is not deciding what the facts are. It is not adding numbers, dates, or citations the expert didn't supply. It is structuring. Every sentence it produces must carry a citation to a source in section 2, or it comes out as a placeholder: 'Expert input needed.' "

*[When preview appears, point to the readiness banner:]*
> "Readiness: every sentence cited, disclosure chain verified. If anything were wrong — one ungrounded sentence, one citation to a source that doesn't exist — the banner would be red and the export buttons would be blocked."

*Point to the per-section grounding badges.*
> "Each section has a badge: Cited, Awaiting your input, or Needs review. Export stays blocked while anything reads Needs review."

---

### Beat 5 — Live grounding: edit a section with a citation (2 minutes)

*Say:*
> "Let me show you what happens when you edit."

**Click:** "Edit" on one of the analysis sections (e.g., the Access to Labor Market section or whichever has a "Cited" badge).

*Say:*
> "I can edit any section. The tool gives me the current text and lets me change it. Watch what happens if I add a sentence without a citation."

*Type a sentence without a citation marker into the edit textarea. The LiveGrounding component will show a red dot next to it.*

> "Red. That sentence doesn't cite anything. It would block export if I saved it as-is. I can either add a citation — by clicking one of the evidence buttons here — or delete the sentence."

**Click one of the `[[E:...]]` citation buttons to insert a citation at the cursor.**

> "Now it cites source [N]. The grounding widget turns green on that line. When I click 'Save & re-check,' the server runs the full grounding gate again — the same gate that governs the export."

**Click:** "Save & re-check."

*[Wait for rebuild. Point to the section badge returning to "Cited."]*
> "Every edit goes through the same gate. There's no way to save a sentence that doesn't cite your evidence and have it reach the export."

---

### Beat 6 — Readiness and disclosure record (2 minutes)

*Scroll to the readiness banner and the AI-Disclosure record section in the preview.*

*Say:*
> "Two things below the preview. First, readiness: an automated internal check — completeness, every sentence cited, disclosure-record integrity. Not a determination of admissibility. The tool says so explicitly: that's the court's call."

*Point to the AI-Disclosure record panel.*
> "Second, the disclosure record. This is what becomes the appendix in the export. Every AI-assisted section, the model and version, and the evidence it was given. The statement here tells you what will be in the appendix — it's not generated at export time, it's accumulated as the report is built, in a tamper-evident chain. 'Tamper-evident chain verified' means the hash sequence is intact. If someone altered an entry after the fact, the chain would fail on reload."

*Point to the "You are the author" warning box.*
> "The tool surfaces this every time AI assistance was used: 'Read every sentence and confirm it before you sign; the tool organizes your findings, it does not form opinions.' That's the intended use — and it's the pattern the courts have distinguished as acceptable. The Ferlito v. Harbor Freight case in April 2025 let expert testimony stand precisely because the expert drafted independently and used AI only to confirm conclusions already reached. [Summaries, not legal advice; verify the rules for your jurisdiction.] This tool is built to support that pattern."

---

### Beat 7 — Export: Word and PDF (1.5 minutes)

**Click:** "Download Word (.docx)."

*[While downloading:]*
> "One export covers both formats — Word and PDF. The Word file has continuous line numbers, Century Schoolbook font, and the cover format standard in federal expert reports. The AI-Disclosure Appendix is at the end."

*[Open the downloaded file. Scroll through sections quickly, then to the appendix.]*
> "The appendix table: section name, model and version, evidence sources provided. This is the discoverable methodology record. If opposing counsel issues a subpoena for the AI prompts — which a magistrate ordered in Conservation Law Foundation v. Shell Oil, though that order is non-final and under Rule 72(a) review, so treat it as a signal of direction rather than settled law — the expert has it documented."

---

### Beat 8 — The sample report and discipline switcher (1 minute)

**Switch to:** tab 2 (`/sample`).

*Say:*
> "This is the worked sample — what a finished vocational-rehabilitation report looks like, with every numbered chip linking to the source it came from. The evidence sidebar on the right shows every source the report is allowed to cite. Click a chip and it jumps to the source."

*Point to the discipline switcher at the top.*
> "Engineering and accident reconstruction exist as previews — the section structure is real, the citation and disclosure mechanics are real, the wording is illustrative. Vocational rehabilitation is the finished beachhead."

*Point to the AI-Disclosure Appendix at the bottom (dark section).*
> "Same appendix. Generated from the same record."

*[Optional: download the PDF or Word from the sample page.]*

---

### Beat 9 — The coverage check (30 seconds, optional)

*If time allows, scroll to the "Coverage check" section on the sample page.*

*Say:*
> "One more piece: coverage check. This is private — never stored, never exported, never in the discoverable record. It asks questions opposing counsel might probe: 'Is the labor-market methodology documented?' 'Are wage sources cited?' It asks; the expert decides. It's a second set of eyes on your own materials."

---

### Transition to design-partner ask (1 minute)

*Say:*
> "That's the full flow. The vocational-rehabilitation template is built from desk research and needs red-teaming by a practicing expert. That's what a design-partner relationship looks like: you tell me where the template is wrong, I fix it, you get the tool at no cost for the first few reports while we get that right. I'm looking for two or three practitioners who write earning-capacity reports and are willing to give me honest feedback. Does that sound like something you'd consider?"

*[If yes, book 30 minutes for a structured template review call. If they want to think about it, send the static walkthrough from 08-static-demo-walkthrough.md as the leave-behind.]*
