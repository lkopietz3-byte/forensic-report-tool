# 00 · Content brief — the rules every asset in this folder follows

This is the governing brief for all go-to-market material under `docs/gtm/`. It
operationalizes `docs/VOICE.md` and `CLAUDE.md` for the GTM writer (human or AI).
If a sentence in any GTM asset breaks a rule here, the asset is wrong, not the rule.

> **Why this folder exists.** The product is built and the strategy is written
> (`docs/marketing-plan.md`). What was missing: the *ready-to-use assets* and the
> *founder's own preparedness* — domain fluency, call prep, product mastery, demo
> scripts, marketing collateral, help content. That's what lives here.

---

## The product in one honest paragraph

**Disclosed.** structures a forensic expert witness's **own** findings into a
Federal Rule of Civil Procedure 26(a)(2)(B)-organized report, and keeps an
automatic, **tamper-evident** record of how AI was used — each AI-assisted
section, the model and version, and exactly the evidence it was given, and nothing
it was not. The expert independently verifies, prepares, adopts, and signs. The structuring is
cloneable; the disclosure/methodology record is the moat, built for the moment a
court or opposing counsel asks how AI was used.

## Audience

Skeptical, conservative, referral-driven forensic expert witnesses ($350–700/hr)
whose signature carries professional and legal liability. They are trained to find
the overstatement. **Underclaim on purpose.** Three adjectives for every asset:
**precise, calm, accountable.** Never breathless, clever-over-clear, or salesy.

---

## The honesty rules (a violation is a defect, not a style nit)

| Topic | Say | Never say |
| --- | --- | --- |
| What the tool does to content | structures · formats · organizes · assembles · arranges · tracks · flags · surfaces | drafts opinions · generates findings · writes your report · creates analysis |
| Who prepares and signs | the expert **independently verifies, prepares, adopts, and signs** | we wrote · the AI wrote · our report |
| Rule 26 | Rule 26(a)(2)(B)-**structured** · organized to the Rule 26 format · tracks every Rule 26 element | Rule 26-**compliant** · compliant · guaranteed |
| Court outcome | designed to support · discloses · prepared for disclosure; **admissibility is the court's call** | court-defensible · admissible · will hold up in court |
| Audit chain | **tamper-evident** · append-only · hash-chained | tamper-proof · immutable · unhackable |
| Data handling | a **commitment / intent** not to train on your data; zero-retention *path* | we are SOC 2 · signed zero-retention contract · 100% secure |
| Grounding | traced to a source you supplied · evidence-grounded · flags the gap | fact-checked · verified true · accurate |
| Time savings | "report drafting is 3–5 hours you often can't bill"; attribute to the design cohort | "saves you 3–5 hours" (bare) · guaranteed faster |
| Competitors | name the gap factually | the only · the best · disparagement |

**Verb discipline** (the one that breaks the product): make the **expert** the
subject and the **tool** the instrument. "Draft" is allowed only as a *noun* for
the structured output the expert then edits — never as a verb with the tool
originating substance. No invented statistics, no social proof we don't have (no
"trusted by N experts," no "most popular"). Any legal-adjacent claim ends with
**"general information, not legal advice; we are not a law firm; verify the rules
for your jurisdiction."**

**Do not fabricate.** No case law, holding, statistic, quote, pricing, or domain
fact beyond what's in this brief or the repo files you're told to read. If you need
something you don't have, leave a `[VERIFY: …]` placeholder.

---

## Grounded facts — the only domain/legal/product facts an asset may state

### Product (all already built)
- **Closed-world grounding.** Every factual sentence must carry a citation marker
  (`[[E:id]]`) to an evidence unit the expert supplied. Export **hard-blocks**
  (HTTP 422) any report with an ungrounded sentence or a citation to an id that
  wasn't supplied. Gaps surface as `[Expert input needed: …]`, never filled in.
- **The disclosure record.** A tamper-evident, append-only, hash-chained audit log
  records each AI-assisted section, the model + version, and exactly the evidence
  it was given → an **AI-Disclosure Appendix** in the export. The chain re-verifies
  on load; tampering is *detectable*, not *prevented* (hence "tamper-evident").
- **No-AI deterministic mode.** The whole report can be assembled with no model at
  all; the disclosure then states that no AI produced any text.
- **Live per-sentence grounding** in the editor (green / amber / red as you type).
- **Evidence images** render as numbered figures; cited like any evidence.
- **Court formatting:** continuous line numbers, Century Schoolbook, cover logo.
- **Export:** Word (.docx) and PDF.
- **Intake** reads PDF / Word / Excel / scans (OCR) **entirely in the browser — the
  file never leaves the expert's computer** (a confidentiality feature).
- **Pricing — STILL BEING VALIDATED; frame softly, not as final:** $250 for one
  report, planned five-pack at $1,000, first report free. Do not advertise an
  unlimited plan until pilot volume and support costs justify one.
- **Beachhead worked sample:** forensic **vocational rehabilitation** (earning
  capacity). Engineering + accident reconstruction exist as previews.

### Methodology — vocational rehab
> Source: `discovery/vocrehab-template-spec.md`, which is **DRAFT desk-research,
> not yet validated by a practicing expert.** Carry that caveat: the template gets
> red-teamed by the design partner before it's gospel.

- **RAPEL model (Weed)** — the dominant peer-reviewed earning-capacity method:
  **R** Rehabilitation plan · **A** Access to labor market (home of the
  **Transferable Skills Analysis / TSA**) · **P** Placeability (where the
  **labor-market survey** is applied) · **E** Earning capacity (always a **range**,
  never a single number) · **L** Labor force participation (work-life expectancy).
- **TSA inputs:** past relevant work coded to the **DOT** with **SVP**, **GED**,
  aptitudes; tools **OASYS / SkillTRAN**, **O*NET** via the O*NET–DOT crosswalk,
  **BLS / Census** wages; occupations below SVP 3 generally aren't "transferable."
- **Daubert / Rule 702 failure modes** that get vocational opinions excluded: no
  visible **data→opinion path**; generic job titles disconnected from the actual
  evaluee; weak labor-market-survey methodology (the discredited "equal
  distribution method," criticized in *Hohman v. Kijakazi*); over-reliance on
  uncorroborated self-report; functional assumptions / qualifications not stated.
- **Rule 26(a)(2)(B) report elements:** (i) opinions + basis/reasons; (ii) facts or
  data considered; (iii) exhibits; (iv) qualifications + publications (10 yr); (v)
  prior testimony (4 yr); (vi) statement of compensation.

### Case law — use ONLY these, with this framing and these caveats
> Full cites in `src/app/resources/ai-disclosure-in-expert-reports/page.tsx`.
> Every use ends with: *summaries, not legal advice; verify against the official
> reporter; CLF v. Shell may change.*

- **Kohls v. Ellison** (D. Minn., Jan 10, 2025) — expert let GPT-4o fill in
  citations; it fabricated sources; declaration **struck** ("shatter[ed] his
  credibility").
- **Concord Music Group v. Anthropic** (N.D. Cal., May 2025) — real journal but
  AI-invented title/authors; paragraph struck; "a world of difference between a
  missed citation and a hallucination generated by AI."
- **Matter of Weber** (N.Y. Sur. Ct., 2024) — expert used a chatbot to "check"
  valuation math, couldn't recall the prompts or explain the method; valuation
  found unreliable.
- **Ferlito v. Harbor Freight** (E.D.N.Y., Apr 2025) — the **safe-harbor** case:
  the expert drafted independently and used AI only to **confirm** conclusions he
  had already reached; testimony **allowed**. This is the pattern the product is
  built to support.
- **Conservation Law Foundation v. Shell Oil** (D. Conn.) — a magistrate ordered an
  expert to produce her AI **prompts** as discoverable Rule-26 methodology.
  **Critical caveat:** non-final magistrate order, objected-to under Rule 72(a) and
  stayed pending review — a **signal of direction, not settled law.** Always say so.
- Background: **Fed. R. Evid. 702** (amended Dec 1, 2023 — sufficient facts/data +
  reliable application; burden on the proponent). **ABA Formal Op. 512** (AI use is
  permitted with competence + disclosure).

---

## The founder's honest posture (matters for the calls and the story)

The founder is a **solo builder**, not a credentialed vocational-rehabilitation
expert. Every asset that touches the founder's voice must keep that honest: the
value offered is the tool and the willingness to listen and build, never a claim of
discipline expertise. On a call, the credible move is to **ask, not assert** — a
real expert can smell a faked credential instantly, and faking one is how you lose
a referral community. Lead with the AI-disclosure problem (which the founder *does*
understand) and let the expert be the expert.
