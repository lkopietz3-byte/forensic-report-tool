# 04 · Objection handling — honest answers to the hard questions

> Governed by `docs/gtm/00-content-brief.md` and `docs/VOICE.md`. Pairs with
> `03-discovery-call-playbook.md` (how to run the call) and
> `design-partner-kit.md` (the strategy). Use these on discovery calls, in email
> replies, and as raw material for FAQ/landing copy.

**How to use this:** these are not scripts to recite — they're the honest position
on each objection, in voice. On a call, **acknowledge the objection as legitimate
first** ("that's exactly the right worry"), then answer specifically, then return
the floor. A skeptical expert respects a straight answer with a named limit far
more than a smooth deflection.

**Non-negotiable across every answer** (a violation here is a defect, not a style
nit):
- The tool **structures / organizes the expert's own findings** — it never
  **drafts opinions, generates findings, or writes the report.** The expert
  independently verifies, prepares, adopts, and signs.
- **Never** claim a report is **admissible, court-defensible, or compliant** —
  admissibility is the court's call.
- The audit record is **tamper-evident**, never **tamper-proof / immutable**.
- **Never** claim certs/contracts we don't hold (no SOC 2, no signed
  zero-retention contract) — data handling is a **commitment**, not a credential.
- **Be honest about discoverability.** Do not imply the AI record can be hidden or
  is undiscoverable.
- Legal framing is **general information, not legal advice; we are not a law firm;
  verify the rules for your jurisdiction.** Case summaries: verify against the
  official reporter; *CLF v. Shell* may change.

---

## 1. "AI-written reports are unethical — it's cross-examination suicide."

**The answer:**
> You're right to refuse an AI-*written* report — I'd refuse one too. This doesn't
> write your report. It **structures findings you supply** into the Rule
> 26(a)(2)(B) format. Its prompt restricts model output to supplied evidence,
> and missing or unknown source IDs block export. You independently verify every
> source relationship, prepare, adopt, and sign the report. On the ethics: the
> ABA's Formal Opinion 512 says using AI is
> *permitted* — what's required is competence and **disclosure**, not abstinence.
> So the cross-exam question isn't "did you use AI," it's "can you account for how."
> This is built to give you that account.

**Why this works:** agrees with the real objection (no AI-authored reports),
reframes from origination to structuring, and replaces a vague ethics fear with the
actual rule (Op. 512 = disclosure, not prohibition). It never claims the report is
admissible.

---

## 2. "The citations will be hallucinated — that's the whole problem."

**The answer:**
> That's the failure that's getting people burned, and it's the one thing this is
> built around. It works **closed-world**: every factual sentence has to carry a
> citation marker back to an evidence unit **you supplied.** If a sentence has no
> grounded source, or cites something you didn't give it, the **export hard-blocks
> it** — the file won't generate. It can't reach outside your evidence to invent a
> source, because it has nothing else to reach into. Where it's missing something,
> it **flags the gap and asks you** — it never fills it in.
>
> The contrast is the case law. In *Kohls v. Ellison* the expert let a chatbot fill
> in citations, it fabricated them, and the declaration got struck. *Concord v.
> Anthropic* was a real journal with an AI-invented title — same outcome. The
> pattern that *survived* is *Ferlito v. Harbor Freight*: the expert reached his
> conclusions independently and used AI only to **confirm** them — testimony
> allowed. That supervised pattern is exactly what this enforces.

**Why this works:** answers the existential fear with the concrete mechanism (hard
block on ungrounded/invalid cites, gaps flagged not filled), then grounds it in the
real cases — the cautionary pair vs. the safe-harbor pattern. Honest verbs
throughout.

---

## 3. "My reports are too unique and bespoke for a template."

**The answer:**
> Good — they should be. The template isn't a fill-in-the-blanks form that
> flattens your work; it's the **Rule 26 skeleton** every report in your field
> already shares — opinions and basis, facts considered, exhibits, qualifications,
> prior testimony, compensation. Your **methodology, your analysis, your opinions**
> fill it, and they're yours. And the template is the part I most want a design
> partner to **red-team** — right now it's desk research until a practicing expert
> tears it apart and tells me where it's wrong for real work. The structure is the
> commodity; what you put in it is the expertise.

**Why this works:** separates the bespoke substance (theirs) from the shared Rule
26 scaffold (the commodity), and turns the objection into the design-partner ask.
Honestly flags the template as unvalidated desk research.

---

## 4. "Opposing counsel will use the AI-disclosure record against me."

**Be honest — do not pretend the record can't be discovered.**

**The answer:**
> Straight answer: **yes, your use of AI may be discoverable.** In *Conservation
> Law Foundation v. Shell* a magistrate ordered an expert to produce her AI
> **prompts** as Rule 26 methodology — though I'll be clear, that's a **non-final
> order, objected-to under Rule 72(a) and stayed pending review**, so it's a signal
> of direction, not settled law. I'm not going to tell you a record makes the AI
> question disappear. It doesn't.
>
> What it changes is **which record exists when they ask.** The choice isn't
> "record or no record" — it's a **clean, contemporaneous, tamper-evident** account
> of each AI-assisted section, the model and version, and exactly the evidence it
> was given… **versus** reconstructing it from memory months later under a motion to
> compel. *Ferlito* shows that supervised AI use — you reaching the conclusions,
> AI assisting — is fine and survives. A clear record is how you *show* that's what
> happened, instead of trying to remember it on the stand like the expert in *Matter
> of Weber*, who couldn't recall her prompts and got her opinion thrown out.

**Why this works:** it concedes the true risk (discoverability) and the case's
non-final status up front — which is what earns the expert's trust — then makes the
real argument: not invisibility, but a good record vs. a reconstructed one, with
*Ferlito* and *Weber* showing both outcomes. Never overstates.

---

## 5. "I don't write enough reports to justify a tool."

**The answer:**
> Then a monthly subscription would be a bad deal for you, and I'm not going to
> push one. That's why the lead model is **per report** — you pay when you produce
> one, not a seat you're renting between matters. And the **first report is free**,
> so you can run a real one end to end and decide with your own eyes, not my pitch.
> If you write three a year, you pay for three. *(Pricing's still being validated,
> so I'd genuinely rather hear what fits how you actually work.)*

**Why this works:** matches the model to low volume instead of arguing the premise,
de-risks with the free first report, and honestly flags pricing as not-yet-final —
which also turns it into a discovery question.

---

## 6. "My files are under a protective order — confidentiality is everything."

**The answer:**
> Then this part matters most. **Intake runs in your browser** — it reads your
> PDFs, Word files, Excel, even scanned exhibits with OCR, **on your own machine.
> The file never leaves your computer to be parsed.** On the model side, I make a
> **commitment not to train on your data** and to keep a zero-retention path —
> data not stored beyond the session, not used to train a model. I'll be precise
> about what that is: it's a **commitment**, not a SOC 2 certificate or a signed
> contract I'm going to wave at you, because I don't have those yet and I'm not
> going to claim them. For a design partner I'd never ask for case data under a
> protective order at all — you red-team with a **de-identified** report.

**Why this works:** leads with the genuinely strong fact (browser-side intake, file
never leaves their machine), then states the no-training commitment **as a
commitment, honestly distinguished from a cert we don't hold** — which protects
credibility with exactly the audience that checks.

---

## 7. "I don't trust a solo, unknown vendor with something this serious."

**The answer:**
> That's a fair and correct instinct — you should be cautious about who you build
> a report-signing habit around. I'm not going to pretend to be a company I'm not.
> What I'd offer instead of claims: the **first report is free**, so you risk
> nothing to test it; authorship and responsibility **stay entirely with you**;
> case files **stay on your machine**; and either of us can walk away anytime with
> nothing published about you without your say-so. The design-partner model is
> built for exactly this trust gap — you keep control of everything that matters and
> see the product do real work before you rely on it. And the integrity isn't my
> word; it's **mechanical** — the export blocks an ungrounded citation whether I'm
> watching or not.

**Why this works:** validates the caution instead of arguing it, then replaces
"trust me" with verifiable structure (free trial, retained authorship, local files,
exit rights, a mechanical guarantee). No fake scale or social proof.

---

## 8. "How is this different from ChatGPT / CaseMark / InspectMind?"

**Name the gap factually — no disparagement.**

**The answer:**
> Fair question, and I'll be specific without knocking anyone.
> - **ChatGPT** is an open-world general model — it'll happily write you a citation
>   that doesn't exist, because nothing stops it reaching outside your evidence.
>   This is **closed-world**: it can only use what you give it, and the export
>   **blocks** an ungrounded cite. Different job.
> - **CaseMark and the general legal-AI tools** are built for the litigation team —
>   summaries, drafting across a matter. They're not built around a forensic
>   **expert's** signature, one discipline's methodology, and a disclosure record
>   for a Daubert challenge.
> - **InspectMind and the field-report tools** are strong at capturing inspection
>   data. The gap is the **Rule 26 expert-report structure plus the tamper-evident
>   AI-disclosure appendix** — the part built for the moment a court asks how you
>   used AI.
>
> The honest one-liner: most tools help you **produce text faster**; this is built
> around **accounting for how AI was used** on a report that goes out under your
> name. The structuring is cloneable — the disclosure record is the point.

**Why this works:** draws factual contrasts (open- vs. closed-world; team-tool vs.
expert-signature tool; field-capture vs. Rule-26-plus-disclosure) without claiming
"only" or "best," and concedes the structuring is cloneable — which is both true and
disarming.

---

## 9. "What if the tool makes a mistake and it's my signature on it?"

**The answer:**
> It's your signature, so you review every line — that's the design, not a
> disclaimer. Two things make that review concrete: the prompt restricts model
> output to your supplied evidence and source IDs are checked; and where
> something is missing it **flags the gap** with an "expert input needed" marker —
> it **doesn't quietly fill it in.** Live in the editor, each sentence shows green,
> amber, or red as you type, so missing and unknown citations are visible. A valid
> source ID does not prove semantic support, so your source-by-source verification
> remains essential.
> instead of buried.

**Why this works:** answers the liability fear with the mechanism (restricted
prompt, checked source IDs, visible gaps), and keeps verification, adoption, and
signature squarely with the expert. It does not promise the tool prevents all
error; it promises visibility.

---

## 10. "Are you training your model on my data?"

**The answer:**
> No — I make a **commitment not to train on your data**, and to keep a
> zero-retention path: not stored beyond the session, not used to train a model.
> I'll be exact about what that commitment is and isn't — it's an operational
> commitment and intent, **not** a SOC 2 certification or a signed zero-retention
> contract, because I'd be lying if I claimed those today and you'd be right not to
> believe me. There's also a **no-AI deterministic mode** — the whole report can be
> assembled with no model touching it at all, and the disclosure then states that no
> AI produced any text. So if you want zero model exposure on a sensitive matter,
> that's a switch, not a promise.

**Why this works:** clear "no," then **immediately bounds the claim** to a
commitment rather than a cert — the honesty the audience rewards — and offers the
no-AI mode as a concrete fallback for the most sensitive cases.

---

## 11. "This will make me look lazy — or worse — to the court."

**The answer:**
> I'd flip that. What looks bad to a court isn't *assistance* — it's an
> unaccountable process: a citation nobody can source, an expert who can't explain
> how the report came together. Using a tool to **structure your own findings into
> the required format** is no more "lazy" than using Word, Westlaw, or
> OASYS/SkillTRAN — they're all instruments; you're still the expert. And the
> posture here is the opposite of hiding it: it produces an appendix that **discloses
> each AI-assisted section, the model, and the evidence it was given.** Op. 512 frames
> AI use as permitted **with disclosure** — so the defensible move is the
> transparent one, and that's what this does. You're not hiding a tool; you're
> documenting one.

**Why this works:** reframes "lazy" as "unaccountable" (the thing courts actually
penalize), normalizes the tool against accepted ones, and turns disclosure into the
*credibility* move rather than the risk. No admissibility claim.

---

## 12. "Price."

**The answer:**
> Fair — and I'd rather be straight than coy about it. The lead model is **per
> report**: **$250 for one**, or **$1,000 for five**, and the **first one's
> free** so you judge the value before any money changes hands. We are not
> selling unlimited access until real usage tells us what responsible support
> costs. Put it against the **3–5 hours of drafting you often can't bill** —
> at your rate, one report's worth of reclaimed time covers it. *(And I'll be
> honest — pricing is still being validated, so if that's off for how you work, that
> feedback is worth more to me than the sale.)*

**Why this works:** gives a real number instead of dodging, anchors against
unbilled drafting time (their own pain, not an invented ROI guarantee), and flags
pricing as still-validating — which is both honest and useful discovery signal.

---

## Quick-reference grid

| # | Objection | The one-line honest answer |
| --- | --- | --- |
| 1 | AI reports are unethical / cross-exam suicide | It structures *your* findings; you author and sign. Op. 512 = disclosure, not abstinence. |
| 2 | Citations will be hallucinated | Closed-world; export hard-blocks ungrounded/invalid cites. *Kohls/Concord* vs. the *Ferlito* pattern. |
| 3 | My reports are too bespoke | The template is just the Rule 26 skeleton; your methodology fills it. Red-team it with me. |
| 4 | The record will be used against me | Yes, AI use may be discoverable (*CLF v. Shell*, non-final). A clean contemporaneous record beats a reconstructed one; *Ferlito* shows supervised AI survives. |
| 5 | I don't write enough reports | Per-report pricing, first one free. Pay for what you produce. |
| 6 | Files under protective order | Browser-side intake — file never leaves your machine. No-training **commitment** (not a cert). |
| 7 | Don't trust a solo unknown vendor | Fair caution. Free first report, you keep authorship + files + exit; integrity is mechanical. |
| 8 | Different from ChatGPT/CaseMark/InspectMind? | Closed-world vs. open; expert-signature + Rule 26 + disclosure vs. team/field tools. No disparagement. |
| 9 | What if it errs and it's my signature | You review every line; prompts are restricted, source IDs are checked, and gaps are surfaced. You verify, adopt, and sign. |
| 10 | Training on my data? | No — a commitment (not SOC 2 / not a signed contract). No-AI deterministic mode exists. |
| 11 | Makes me look lazy to the court | Courts penalize *unaccountable*, not *assisted*. Disclosure is the credible move. |
| 12 | Price | Target $250/report after the founding pilot; planned five-pack $1,000. No unlimited annual plan. Still validating. |

---

*General information for the founder's own preparation — not legal advice, and not
a law firm. Case summaries are summaries, not holdings; verify against the official
reporter, and note* Conservation Law Foundation v. Shell *is a non-final order under
review that may change. Verify the applicable rules for your jurisdiction.*
