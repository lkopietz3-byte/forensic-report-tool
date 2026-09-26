# 11 · Social content calendar — LinkedIn-first

All posts follow `docs/gtm/00-content-brief.md` and `docs/VOICE.md`.
No admissibility claims. No invented statistics. "Not legal advice" appears
on every post that cites a case. CLF v. Shell requires a dated, verified docket status before publication.
No "trusted by N" or user counts pre-launch.

Platform: LinkedIn primarily. Twitter/X secondary (trim posts to 280-char
thread leads where noted). Target audience: forensic expert witnesses and
the attorneys who retain them.

---

## Four-week posting cadence

| Week | Days | Mix |
|------|------|-----|
| 1 | Mon, Thu | Thought leadership — AI disclosure problem framed factually |
| 2 | Mon, Wed, Fri | Caselaw education + build-in-public note |
| 3 | Mon, Thu | Thought leadership — fact-specific Ferlito ruling + product note |
| 4 | Mon, Wed, Fri | Founder story + caselaw recap + soft CTA |

Post at 8–9 a.m. in the expert's timezone (ET is dominant for US federal
litigation). Do not post more than 3×/week — this audience responds to
quality, not volume. Engage in comments same day.

---

## 5 Reusable hooks

1. **The pattern hook** — "Every struck expert declaration I've read in 2025–2026 has the same thing in common: ..."
2. **The contrast hook** — "The role AI played in an expert's work is one part of a fact-specific reliability assessment. Here's the difference."
3. **The question hook** — "If opposing counsel asked you right now to produce every AI prompt you used in your last report, what would you hand them?"
4. **The builder note hook** — "I'm building something for forensic expert witnesses. Here's what I've learned so far: ..."
5. **The rule-first hook** — "Rule 26(a)(2)(B) already requires disclosure of the facts or data the expert considered. AI use is starting to be read as part of that. Here's what that means practically."

---

## Ready-to-post drafts

### POST 1 — Thought leadership: the pattern in struck declarations
*Type: Thought leadership | Hook: pattern hook*

Every struck expert declaration I've read from 2025–2026 has the same thing in common.

It isn't that the expert used AI.

It's that the tool introduced something the expert didn't supply and didn't catch — and the expert couldn't account for what the tool did.

In *Kohls v. Ellison* (D. Minn., Jan. 2025), a Stanford misinformation scholar let GPT-4o fill in citations. It fabricated two articles and misattributed a third. The court excluded the declaration when deciding the preliminary-injunction motion.

In *Concord Music Group v. Anthropic* (N.D. Cal., May 2025), a data scientist's declaration cited a real journal — correct volume, page, year — but with a title and authors the AI invented. The court struck paragraph 9 and questioned the declaration's credibility; it noted the underlying article was real and correctly linked.

These decisions show why citation verification matters. They do not establish that every AI-related reliability issue has the same cause or remedy.

That's a methodology problem. It has a methodology answer.

---

*General information, not legal advice. Case descriptions are summaries; verify against the official reporter before relying on them.*

---

### POST 2 — Thought leadership: the Ferlito ruling
*Type: Thought leadership | Hook: contrast hook*

The role AI played in an expert's work is one part of a fact-specific reliability assessment.

In *Ferlito v. Harbor Freight Tools* (E.D.N.Y., Apr. 2025), a long-experienced expert drafted his report independently and used AI only to confirm conclusions he had already reached on his own.

The court denied exclusion after assessing qualifications and methodology as well as AI use. It found no reliability problem from the post-report AI confirmation on these facts. This creates no general safe harbor or product approval.

Practical habits that support careful expert work include:

— AI as an assistant the expert supervises and can verify
— The expert's own analysis driving the opinion
— The expert able to stand behind every word

*General information, not legal advice. Case summaries only; verify against the official reporter.*

---

### POST 3 — Build-in-public: why I'm building this
*Type: Build-in-public | Hook: builder note hook*

I'm building a report-structuring tool for forensic expert witnesses. Here's the honest version of why.

I'm not a forensic expert. I'm a solo developer who followed the 2025–2026 caselaw on AI and expert witnesses more closely than most.

And I kept seeing the same gap: the experts who got hurt weren't careless. They were using the same AI tools everyone is using. The gap was that nothing in their workflow created a record of what the tool was given and what it produced.

If that ever came up — in discovery, on cross, in a motion to strike — they'd be reconstructing from memory. That's a bad place to be.

The thing I'm building is simple in concept: a report-structuring tool that checks citations against expert-supplied evidence IDs and keeps a record of AI-assisted sections, model details, and the evidence IDs recorded as supplied. The expert still verifies the wording and sources before signing.

You stay the author. You sign. The record is just there.

I'm at the design-partner stage now — working with a handful of experts to build the template right for their discipline before opening it wider.

If this problem sounds familiar, I'd like to talk.

---

### POST 4 — Caselaw education: CLF v. Shell
*Type: Thought leadership | Hook: rule-first hook*

Rule 26(a)(2)(B) generally requires retained testifying experts in federal civil litigation to disclose the facts or data considered in forming their opinions. Discovery of AI prompts depends on the facts and applicable protections.

In *Conservation Law Foundation v. Shell Oil* (D. Conn., May 18, 2026), a magistrate judge ordered CLF to revise discovery responses concerning expert-team prompts/queries, produce responsive material, or certify after diligent search that none existed. The order addressed document-culling methodology on the facts of that case.

A few things to know about that ruling before you draw conclusions:

1. A June 3, 2026 stay pending review was reported; current docket status was not independently verified in the September 26, 2026 review. Recheck before public use.

2. The order treated this document-culling process as discoverable methodology. It does not establish that every AI prompt must be disclosed in every case.

3. The practical implication: if your AI interactions are potentially discoverable, keeping them in a form you can produce — contemporaneously, not reconstructed — is better than not.

That's not fearmongering. It's the same standard you'd apply to any methodology step.

---

*General information, not legal advice. CLF v. Shell current docket status was not independently verified on September 26, 2026; recheck before publication. Verify against the official reporter; consult counsel for your jurisdiction.*

---

### POST 5 — Thought leadership: Rule 702 + AI
*Type: Thought leadership | Hook: rule-first hook*

Amended Rule 702 (effective December 1, 2023) requires the party offering expert testimony to show — not just assert — that the opinion rests on sufficient facts or data and reflects a reliable application of reliable methods.

The burden is on the proponent.

Add AI into the workflow and that burden gets more complicated in one specific way: if the AI tool contributed to the analysis, the question "what facts or data did you rely on?" now includes what the tool was given and what it returned.

An expert who can show their work — who has a contemporaneous record of the inputs and outputs recorded for each AI-assisted section — is in a very different position from one who has to reconstruct it months later when a motion to exclude lands.

This isn't a new rule. It's the old rule applied to a new kind of methodological step.

---

*General information, not legal advice. Verify against current rules for your jurisdiction.*

---

### POST 6 — Build-in-public: the closed-world rule
*Type: Build-in-public | Hook: builder note hook*

The single hardest design decision in building Disclosed.:

The tool should avoid introducing facts, figures, or citations the expert did not supply. The current export gate enforces the part it can check mechanically: missing and unknown citation IDs.

That's what I call the closed-world rule. Report sentences must carry citation markers with IDs from the expert-supplied set. Missing or unknown IDs block export. An allowed ID does not show that the source supports the sentence; the expert must check that relationship.

The prompt asks the model to surface gaps. The expert reviews the output for anything it filled in anyway.

That's a harder constraint to build than a content filter. It's also the only thing that makes the disclosure record meaningful. The appendix reports the recorded inputs; it cannot independently establish what evidence the model actually relied on or whether the record is complete.

The gap-and-flag behavior is not a guardrail. It's the product.

---

### POST 7 — Thought leadership: disclosure is the fix
*Type: Thought leadership | Hook: pattern hook*

The courts striking expert declarations in 2025–2026 are not saying AI is off-limits. ABA Formal Opinion 512 confirmed that AI assistance is permitted with competence and disclosure.

The cases keep pointing to the same two things:

**Competence** — The expert's own judgment drives the opinion. AI is in a supporting role the expert supervises and can verify. The expert still checks that the tool did not introduce unsupported content.

**Disclosure** — If AI was used, the expert can explain how. What tool, what version, what it was given, what it returned.

Neither of these requires avoiding AI. Both require using it in a way you can account for.

A methodology record that's built contemporaneously — not reconstructed when a deposition question surfaces it — is what makes that possible.

---

*General information, not legal advice. Verify the applicable guidance for your jurisdiction.*

---

### POST 8 — Build-in-public: what design partners are telling me
*Type: Build-in-public | Hook: builder note hook*

I've been in discovery-interview mode for the last few weeks — talking to forensic experts about their current workflow with AI tools.

A few things I've heard consistently (paraphrasing):

"I'm using AI for some of the structuring work, but I have no good way to document what I gave it."

"My retaining counsel hasn't asked about AI yet, but I expect it soon."

"I'd be nervous if this came up on cross. I couldn't reconstruct my prompts."

None of these people are doing anything wrong. They're using reasonable tools. The gap is the record — what the tool was given, what it returned, kept in a form that's producible rather than reconstructed.

That's the specific gap Disclosed. is built to close.

---

### POST 9 — Thought leadership: the tamper-evident record
*Type: Thought leadership | Hook: question hook*

If opposing counsel asked you right now to produce every AI prompt you used in your last report — every input you gave the tool, every section it touched — what would you hand them?

For most experts working with AI tools today, the honest answer is: notes, maybe. A memory of what you did. Nothing contemporaneous and verifiable.

*Conservation Law Foundation v. Shell Oil* suggests that's the kind of thing a court might ask for. (A June 3, 2026 stay pending review was reported; current docket status was not independently verified in the September 26, 2026 review. Recheck before public use.)

The methodology answer isn't to avoid AI. It's to run AI in a workflow that keeps a record built for exactly that question.

What that record needs to contain: which sections the tool touched, which model and version, what evidence IDs were recorded as supplied to it. The record still needs review for completeness. Contemporaneous. Producible. Structured.

---

*General information, not legal advice. CLF v. Shell current docket status was not independently verified on September 26, 2026; recheck before publication. Verify against the official reporter; consult counsel for your jurisdiction.*

---

### POST 10 — Build-in-public: the tamper-evident design decision
*Type: Build-in-public | Hook: builder note hook*

One of the more interesting design decisions in building Disclosed.: the disclosure log is append-only and tamper-evident, not tamper-proof.

Tamper-proof would be a stronger claim. It would also be false. The record is stored; it can be altered. What the design does is make alteration *detectable*: each entry is cryptographically linked to the one before it, so a modification or broken link in the presented chain fails verification. A truncated or wholly rewritten chain may still verify without an independent anchor.

I use "tamper-evident" deliberately because "tamper-proof" is the kind of word a cross-examining attorney could dismantle in two questions. Saying what the system actually does — checks the presented chain for internal inconsistency rather than preventing alteration — is both more honest and more defensible under the kind of scrutiny this audience faces every day.

The whole product is built on that discipline. What the tool does is what we say it does, not a better-sounding version of it.

---

### POST 11 — Thought leadership: recapping the arc
*Type: Thought leadership | Hook: pattern hook*

The arc of AI and expert witnesses from 2024 to mid-2026, as plainly as I can state it:

**2024:** *Matter of Weber* (N.Y. Sur. Ct.) — the court declined to credit unreliable damages calculations and separately criticized unexplained, unverified Copilot use.

**Jan. 2025:** *Kohls v. Ellison* (D. Minn.) — AI-fabricated citations; declaration excluded on the preliminary-injunction motion.

**May 2025:** *Concord Music Group v. Anthropic* (N.D. Cal.) — AI-invented title and inaccurate authors for a real, correctly linked article; paragraph 9 struck.

**Apr. 2025:** *Ferlito v. Harbor Freight* (E.D.N.Y.) — expert used AI after writing his report to confirm independent findings; exclusion denied on these facts, with no general safe harbor.

**2026:** *CLF v. Shell* (D. Conn.) — May 18 order requires revised responses, responsive expert-team prompts/queries, or certification after diligent search that none existed. [A June 3, 2026 stay pending review was reported; current docket status was not independently verified in the September 26, 2026 review. Recheck before public use.]

These decisions concern different facts and procedural settings. They support careful verification and documentation without establishing a universal disclosure rule or admissibility guarantee.

---

*General information, not legal advice. Case summaries only; recheck CLF v. Shell docket status before publication. Verify against official reporters; consult counsel for your jurisdiction.*

---

### POST 12 — Soft CTA: design-partner ask
*Type: Build-in-public + CTA | Hook: builder note hook*

I'm looking for forensic expert witnesses who are willing to red-team Disclosed. on a real report.

What "design partner" means in practice:
— You run a report through the tool (the first one is free during design-partner phase)
— You tell me where the template is wrong for your discipline
— I build around your workflow before opening it wider
— You get the early-access rate going forward

What I'm not asking: for you to vouch for the product publicly, to use it on a case before you've evaluated it, or to do anything you wouldn't be comfortable defending to retaining counsel.

The discipline I have the most complete template for right now is forensic vocational rehabilitation. Engineering and accident reconstruction are in preview.

If this sounds worth an hour of your time, reach out. [URL or email placeholder]

---

*Note to editor: do not add any social proof, user counts, or outcome guarantees here. Let the specificity of the ask do the work.*

---

## Notes for the social media manager or founder

- **On hashtags:** #ForensicExpert #ExpertWitness #Rule26 #AIDisclosure — use sparingly; this audience skews away from hashtag-heavy posts. At most 3 per post, and only when the algorithm needs the help.
- **On engagement:** reply to every comment same day. This is a referral community. A single thoughtful exchange in comments is worth more than ten extra posts.
- **On reposts:** the caselaw education posts (1, 2, 4, 5, 7, 9, 11) can be lightly adapted and reposted after the initial run at 6–8 week intervals as the caselaw develops. Update CLF v. Shell status each time.
- **On CLF v. Shell:** check the Rule 72(a) review status before every post that mentions it. If the district court has ruled, update the framing accordingly.
- **On tagging:** do not tag the experts named in the cases. Do not tag opposing counsel.
- **On scheduling:** the cadence above is a starting point. Adjust based on post performance. A well-performing post should be engaged with rather than immediately replaced.

Before using any case post, consult the [case summaries and court sources](00-content-brief.md#case-law--use-only-these-with-this-framing-and-these-caveats). These link to the official or court-authored decisions; retain the case-specific limits in the published copy.
