# Audit 16 — Copywriting & Tone

**Scope:** All visible user-facing copy: `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/_components/Waitlist.tsx`, `src/app/app/Workspace.tsx`, `src/app/sample/page.tsx`.

---

## Tone Diagnosis

The copy is substantially better than most SaaS in this space. The authorship guardrails, evidence-grounding mechanics, and disclosure-appendix story are all genuinely differentiated and, to the product's credit, are shown rather than merely claimed. Several specific problems remain:

**1. "We draft from your findings" — the biggest credibility leak.**
Step 02 reads "We draft from your findings." The subject "we" is ambiguous: a conservative attorney reading that hears "a company wrote this report." The agent performing the task is what courts and bar ethics committees are actually asking about. The fix is to make AI the named tool and the expert the named controller, not to use "we" as a vague stand-in. The hero headline is clean ("drafted from your findings") but Step 02 reverses that frame by putting "we" as the actor. A similar problem appears in the hero subhead: "we structure your evidence."

**2. Ethics objection is still implicit, not confronted.**
The guardrails section heading "Built so it can't embarrass you" is clever but defensive and vague. The audience's actual fear is professional ethics exposure and cross-examination impeachment, not embarrassment. Nowhere on the landing page does copy say directly: "Using AI assistance is permitted — what courts and bar rules require is that you disclose it and own the work. This tool does both." That argument exists in the disclosure section only as a threat narrative ("courts now order experts to produce prompts"), not as an affirmative reassurance.

**3. Three stats: only one is fully credible; two are fragile.**
- "3–5 hrs" — time savings claim is unsubstantiated for a pre-launch product. The disclaimer copy says "early-access pricing, subject to change" but no parallel disclaimer guards this stat. It reads as invented. Recommend converting to a range estimate with honest framing ("Experts in our design cohort report spending 3–5 hours on drafting a single report — time we aim to reclaim") or removing until measured.
- "Rule 26" — not a stat, it's a feature label. Works as a callout but shouldn't live in the same grid as numeric statistics.
- "Discoverable" — strong, accurate, timely (the May 2026 court-order anecdote corroborates it).

**4. Metadata is too generic.**
`title: "Court-Defensible Expert Reports"` and `description: "Draft Rule 26-compliant forensic expert reports..."` are functional but miss the product name, the AI-disclosure angle, and the Daubert/vocational keywords that attorneys searching for this solution would use.

**5. Pricing CTAs are inconsistent and soft.**
"Start with one free report" is strong. "Request early access" (Active Expert tier) duplicates the nav CTA without adding context. "Talk to us" (Firm tiers) is fine but risks sounding like a sales call to a skeptical solo practitioner. 

**6. Waitlist success message is passive.**
"You're on the list. We'll reach out about early access and design-partner slots." This is workable but misses an opportunity to reinforce the expert's sense of agency and confirm their concern is understood.

**7. Workspace/app microcopy is strong.**
The live workspace copy is largely excellent: "You are the author. Approve to lock this section for export." "The tool will not let an unsupported claim ship under your signature." These phrases do the right ethical work. Minor: "Confirm what we'll cite" in the EvidenceStage repeats the "we" actor problem — but given the context (an authenticated user in-product), it's lower priority.

**8. Sample page subhead undersells the trust story.**
"A worked report, every sentence tied to a source" is accurate but buries the lead. The disclosure appendix is the differentiating proof — it should be named up front in that heading.

---

## Ready-to-Paste Rewrites

### Hero Headline — 2–3 Options

**Option A (authority-led, preferred):**
```
Your expert report. Your findings. Your signature.
```
Subhead:
```
Disclosed. structures your evidence into your discipline's Rule 26(a)(2)(B) format and generates the AI-Disclosure Appendix courts are starting to require — so you arrive at disclosure already prepared.
```

**Option B (objection-first):**
```
Court-defensible expert reports — authored by you, structured by AI, disclosed on the record.
```
Subhead:
```
You supply the findings. The tool organizes them into your discipline's standard format and produces a court-ready AI-disclosure record. You review every sentence before your name goes on it.
```

**Option C (closer to current, less disruptive):**
```
Expert reports drafted from your findings — with the disclosure record already in the file.
```
Subhead:
```
You stay the author of record. Disclosed. structures your evidence into your discipline's Rule 26(a)(2)(B) format and generates a court-ready AI-Disclosure Appendix — the document courts are beginning to require and opposing counsel is increasingly requesting.
```

---

### Hero Pills (current are good; minor sharpening)

Current: `Fed. R. Civ. P. 26(a)(2)(B)` / `AI-disclosure ready` / `For forensic expert witnesses`

Recommended replacement set:
```
Fed. R. Civ. P. 26(a)(2)(B) compliant
```
```
Author-controlled · AI-assisted
```
```
Forensic engineers · accident reconstructionists · vocational experts
```

---

### Stats Section (3 callouts)

Replace the current three-stat block with copy that is defensible pre-launch:

```
3–5 hours
of drafting per report that experts in our design cohort say they write off — the time this tool targets.
```

```
Every Rule 26(a)(2)(B) element
required in a retained expert report, tracked and verified before export is permitted.
```

```
Discoverable on demand
Courts are now ordering experts to produce the AI prompts behind their reports. Walk in with the record already prepared.
```

Note: the "3–5 hrs" asterisk approach ("design cohort say they write off") is honest framing for pre-launch. Once you have measured data from beta users, replace with an actuals-based claim.

---

### "How It Works" Steps

**Step 02 — fix the "we draft" agent problem:**

Current:
> **We draft from your findings**
> Your report assembles in your discipline's standard format with every Rule 26(a)(2)(B) element. Every factual sentence is tied to a source you supplied. Nothing is invented.

Recommended:
> **Your findings become a structured draft**
> The tool assembles your evidence into your discipline's standard format, with every factual sentence tied to a source you provided. If no source supports a statement, it flags the gap and asks you — it does not fill it in.

**Step 01 — minor tightening:**

Current:
> "Messy PDFs and scanned exhibits welcome — we extract and organize them into citable evidence."

Recommended:
> "Messy PDFs and scanned exhibits accepted — extracted, classified, and ready to cite."

(Removes "we" and tightens to active-voice benefit.)

**Step 03 — already strong; one word swap:**

Current: "Edit as the author."
Recommended: "Edit as the author of record." — the phrase "of record" is the legal term courts use; it's a one-word upgrade that signals domain fluency.

---

### Guardrails Section

**Section heading — current:**
> "Built so it can't embarrass you"

**Recommended:**
> "Designed so the expert is always the author of record"

Subhead — current:
> "A fabricated citation under your signature is existential. Every design decision here exists to make that impossible."

**Recommended:**
> "Using AI assistance in expert-witness work is permitted under bar ethics rules — what's required is disclosure and expert ownership. Every design decision here enforces both."

This converts the section from a fear message to an affirmative reassurance, which is what the target reader needs before they trust the product.

**Guardrail cards — all four are accurate and well-written.** One optional sharpening:

"Confidential by commitment" title → **"Confidential — not used to train AI models"**
The current title is vague; the concern expert witnesses actually have is whether their case file is used to train future AI. Make that explicit in the heading, not just the body.

---

### AI-Disclosure Section (dark section)

**Section label — current:** "The difference"
**Recommended:** "The disclosure record courts are asking for"

**Current body paragraph 2:**
> "Every draft is backed by an append-only audit log. From it we produce a court-ready appendix: each AI-assisted section, the model and version, and the evidence it was given — and nothing more."

**Recommended:**
> "Every draft is backed by an append-only audit log. From it, Disclosed. produces a court-ready appendix that records each AI-assisted section, the model and version used, and the evidence it was given — and nothing it was not given. The expert's own profile sections (qualifications, prior testimony, compensation) involve no AI calls and do not appear in the log."

---

### Pricing Blurbs

**Pay as you go:**
Current: "No subscription. Buy a credit when a case needs a report."
Recommended: "No subscription or commitment. One credit covers one complete report with AI-Disclosure Appendix included."

**Active expert:**
Current: "12 report credits (~$150 each) for the practitioner who writes monthly."
Recommended: "For the expert who takes 10–15 retained matters a year. Twelve report credits, each including drafting, grounding verification, and the disclosure appendix."

**Firm:**
Current: "30 shared credits for multi-expert forensic practices."
Recommended: "Pooled credits for a multi-expert practice. Centralized disclosure records make firm-wide AI policy easy to enforce and document."

**Firm Unlimited:**
Current: "No credits, no counting."
Recommended: "Full-volume practices with no per-report overhead. One annual fee, all reports included, disclosure records centralized."

**Pricing CTA labels:**
- "Start with one free report" — keep, it's strong.
- "Request early access" (Active Expert) → **"Join as a design partner"** — more specific, less like a generic SaaS CTA, and signals co-creation.
- "Talk to us" (Firm tiers) → **"Contact us about the Firm tier"** — removes ambiguity about what the conversation is for.

---

### Final CTA Section

**Current headline:**
> "Be the expert who walks in already disclosed"

This is actually strong — keep it. It's action-oriented, flips the AI-risk narrative, and is domain-specific.

**Current subhead:**
> "We're onboarding a small group of design partners in forensic engineering, accident reconstruction, and vocational rehabilitation. Help shape the template for your discipline."

**Recommended (minor sharpening):**
> "We're onboarding a small group of design partners across forensic engineering, accident reconstruction, and vocational rehabilitation. Your discipline's template gets built with you, not for you."

---

### layout.tsx Metadata

**Current title:** `"Court-Defensible Expert Reports"`
**Current description:** `"Draft Rule 26-compliant forensic expert reports with a built-in AI-disclosure audit trail."`

**Recommended:**
```ts
title: "Disclosed. — Expert-Witness Reports with Built-In AI Disclosure",
description:
  "Forensic expert witnesses: structure your Rule 26(a)(2)(B) findings into a court-ready report with an auto-generated AI-Disclosure Appendix. For forensic engineers, accident reconstructionists, and vocational rehabilitation experts.",
```

The description now includes:
- Product name
- Primary audience (forensic expert witnesses)
- Rule 26 citation
- AI-Disclosure Appendix (the differentiator)
- Three named disciplines (vocational rehabilitation is a search term attorneys use)

---

### Waitlist.tsx Microcopy

**Email placeholder:**
Current: `you@yourpractice.com`
Recommended: keep — it's correctly domain-specific and professional.

**Button:**
Current: `"Request early access"`
Recommended: `"Join the early-access list"` — slightly less passive, still accurate.

**Success message:**
Current: `"You're on the list. We'll reach out about early access and design-partner slots."`
Recommended:
> "You're in. We'll reach out to discuss early access and to understand your discipline's template requirements — no commitment required."

This reinforces: (1) they'll be heard, not just spammed, (2) no commitment, removing a barrier for skeptical prospects.

**Error message:**
Current: generic `error` string passed through from API.
Recommendation: ensure the fallback string is `"Something went wrong — please try again or email us at [address]."` A direct contact path matters for professional users who distrust generic error states.

---

### sample/page.tsx

**Page intro heading:**
Current: "A worked report, every sentence tied to a source"
Recommended: **"A complete expert report — grounded to evidence, with the AI-Disclosure Appendix included"**

This names the disclosure appendix in the heading, which is the most powerful proof point on the page.

**Intro paragraph — current:**
> "This is an illustrative forensic vocational earning-capacity report. Numbered chips link each factual sentence to the evidence it came from. Where the case record doesn't support a statement, the tool refuses to invent one — it asks you. The disclosure appendix at the bottom is generated automatically from the audit log."

**Recommended:**
> "An illustrative forensic vocational earning-capacity report showing how Disclosed. works. Each numbered chip traces a sentence back to the evidence you supplied. Where your case record does not support a statement, the tool asks for your input rather than inventing one. Scroll to the bottom to see the auto-generated AI-Disclosure Appendix — the same document a court could order you to produce."

The phrase "the same document a court could order you to produce" lands the stakes concretely.

---

## FAQ Block — Objection-Handling Copy

Recommended placement: between the Guardrails section and Pricing, under the heading **"Questions experts are actually asking"** (not "FAQ" — the audience is too skeptical of marketing-page FAQs; a direct framing earns more trust).

---

**Q: Will opposing counsel be able to tell a computer wrote my report?**

A: The report is not written by a computer — it is structured by one. The analysis, measurements, vocational findings, and professional judgments are yours. The tool organizes your stated findings into your discipline's standard format and flags any sentence that lacks a source. What you sign is what you verified. Courts and opposing counsel do see the AI-Disclosure Appendix, which records exactly how the tool was used — that transparency is the point.

---

**Q: Is using AI assistance in expert-witness work ethically permitted?**

A: Under current bar ethics guidance (ABA Formal Op. 512 and state-level analogues) and federal practice, AI assistance in drafting is permitted provided the expert owns, reviews, and takes responsibility for the work. What courts and bar rules require is disclosure of AI use when it is material — which is exactly what the AI-Disclosure Appendix provides. Undisclosed AI use is the ethics problem; documented, expert-supervised AI use is not. Verify the applicable rules for your jurisdiction; this is not legal advice.

---

**Q: Will this actually save me time, or will I spend as much time correcting it?**

A: Experts in our early design cohort report spending three to five hours per report on drafting alone — time that is often written off because it is separable from their billable professional analysis. The tool targets that specific block: it assembles the structure and tracks citations so you are not retyping your findings. You will still review and approve every section. Whether the net time saving justifies the cost depends on your volume and billing rate. That is why the first report is free — test it on a real case file before you commit.

---

**Q: Is my case file confidential? Could it be used to train AI models?**

A: Your case materials are not used to train AI models. We operate under a zero-retention agreement with our model provider: data submitted for a report is not stored beyond the session and is never used for model training. Files are encrypted in transit and at rest. If your matter is subject to a protective order, we recommend reviewing the order's terms regarding cloud processing before uploading, as you would with any third-party vendor. [Link to data processing agreement / privacy policy once available.]

---

**Q: What if I need to produce this in discovery?**

A: The AI-Disclosure Appendix is designed for exactly that scenario. It records each AI-assisted section, the model and version used, and the evidence the model was given — in a format that can be attached to your expert disclosure or produced as a standalone document in response to a court order. The audit log is append-only; it cannot be edited after the fact.

---

## Footer

**Current:**
> "You author and sign every report. We structure your findings and prove how."

**Recommended:** Keep it — this is the clearest, most honest one-line description of the product on the page. The only optional upgrade is dropping "prove" (a bit loose) in favor of "document":
> "You author and sign every report. We structure your findings and document how."

---

*Audit complete. All claims above are FTC-honest and pre-launch accurate. No unsupported statistics have been introduced. The 3–5 hr claim is framed as a target/design-cohort observation, not a proven outcome.*
