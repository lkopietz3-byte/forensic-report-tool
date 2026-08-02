# VOICE.md — Brand voice & terminology

The single source of truth for how **Disclosed.** talks — in the product, on the
marketing site, in legal pages, and in email. If a sentence ships to a human, it
follows this file.

The audience is a skeptical, conservative, referral-driven forensic expert
witness whose signature carries professional and legal liability. Every word is
read by someone trained to find the overstatement. Underclaim on purpose.

The honesty rules in `CLAUDE.md` are law; this file operationalizes them with
exact word choices, before/after rewrites, and a copy checklist. When the two
disagree, `CLAUDE.md` wins.

---

## The voice in one line

**Plain, precise, and slightly understated — the register of an expert report
itself, not a SaaS landing page.** We earn trust by showing the mechanism, not
by adjectives. The product's whole pitch is honesty; the copy has to model it.

Three adjectives: **precise, calm, accountable.** Never: breathless, clever at
the expense of clear, or salesy.

---

## The terminology table (memorize this)

| Concept | Say this | Never say this | Why |
| --- | --- | --- | --- |
| What the tool does to content | **structures, formats, organizes, assembles** | drafts opinions, generates findings, writes your report, creates analysis | The prompt is restricted to supplied findings, source IDs are checked, and the expert verifies the result. |
| Who authors | **the expert prepares, adopts, and signs** | we wrote, the AI wrote, our report | Rule 26 uses “prepared and signed by the witness”; the product does not make a legal authorship determination. |
| Rule 26 relationship | **Rule 26(a)(2)(B)-structured**, **organized to the Rule 26(a)(2)(B) format**, **tracks every Rule 26 element** | Rule 26-compliant, compliant, guaranteed compliant | Compliance is a legal conclusion, not ours to assert. |
| Court outcome | **designed to support**, **discloses**, **prepared for disclosure** | court-defensible, admissible, will hold up in court | Admissibility is always the court's determination. |
| The audit chain | **tamper-evident**, **append-only**, **hash-chained** | tamper-proof, immutable, unhackable | We can detect tampering, not prevent it. |
| Data handling | **commitment / intent to** not train on customer data; **zero-retention path** (with the caveat below) | we are SOC 2, we have a signed zero-retention contract, your data is 100% secure | We don't hold certs/contracts yet. State intent, not fact. |
| Grounding | **traced to a source you supplied**, **evidence-grounded**, **flags the gap** | fact-checked, verified true, accurate | We verify a sentence traces to supplied evidence — not that it is true. |
| Time savings | **the time this targets**, **experts in our design cohort report…** | saves you 3–5 hours (bare), guaranteed faster | Pre-launch; no measured outcome. Attribute the estimate. |
| Competitor framing | name the gap factually | "the only", "the best", disparagement | Conservative audience punishes hype. |

### A note on "zero-retention path"
Only use this phrase if it is operationally true at the moment of writing
(Anthropic API zero-retention is a configuration/commitment, not a signed
contract today). Pair it with what it means — "data not stored beyond the
session, not used for model training" — never as a bare buzzword. If unsure
whether it's currently true, say "we commit to" rather than asserting it as a
present fact. See `audit/06-data-protection.md` and `audit/09-marketing-ftc.md`.

---

## Verb discipline (the one that breaks the product if wrong)

The whole moat collapses if copy implies the tool originates content. The safe
verbs all describe operating on content the expert already supplied:

> structure · format · organize · assemble · arrange · lay out · track · cite ·
> flag · surface · disclose · record · trace

The banned verbs imply origination of fact, opinion, number, or citation:

> draft (an opinion) · generate (a finding) · write (the report) · create
> (analysis) · decide · conclude · determine · invent · fill in

"Draft" is allowed **only** as a noun for the structured output the expert then
edits ("your findings become a structured draft"), never as a verb with the tool
as subject originating substance. When in doubt, make the **expert** the subject
of the sentence and the tool the instrument.

---

## The "we" problem

"We draft from your findings" reads to a conservative attorney as "a company
wrote this report." Make the AI the named tool and the expert the named
controller. Prefer:

- ❌ "We structure your evidence" → ✅ "The tool structures your evidence" / "You structure your evidence; the tool does the assembly"
- ❌ "We'll cite" → ✅ "Confirm what the report will cite"
- ❌ "We draft from your findings" → ✅ "Your findings become a structured draft"

"We" is fine for the company as a business entity ("We're onboarding design
partners," "We don't train on your data"). It is **not** fine as the actor that
produces report content.

---

## Before / after (canonical rewrites, from the copy audit)

| Surface | ❌ Before | ✅ After |
| --- | --- | --- |
| How-it-works step | "We draft from your findings" | "Your findings become a structured draft" |
| Guardrails heading | "Built so it can't embarrass you" | "Designed to keep review, adoption, and signature with the expert" |
| Disclosure body | "we produce a court-ready appendix" | "Disclosed. produces an appendix that records each AI-assisted section, the model and version, and the evidence it was given — and nothing it was not given" |
| Footer | "We structure your findings and prove how" | "You author and sign every report. We structure your findings and document how." |
| Metadata title | "Court-Defensible Expert Reports" | "Disclosed. — Expert-Witness Reports with Built-In AI Disclosure" |

---

## Claims hygiene (FTC + bar-ethics safe)

1. **No statistic without provenance.** A bare "3–5 hours" reads as invented.
   Attribute it: "experts in our design cohort report…" or reframe as the claim
   the reader can verify: "report drafting is 3–5 hours you can't bill."
2. **No social proof we don't have.** No "Most popular" tier, no fake counts, no
   "trusted by N experts" pre-launch. Use descriptive labels ("Recommended for
   solo practitioners") that are defensible without usage data.
3. **No legal advice voice.** Legal/ToS/privacy pages carry the
   **"Draft — not legal advice / not a law firm"** banner. When citing ABA Op.
   512 or a ruling, end with "verify the applicable rules for your jurisdiction;
   this is not legal advice."
4. **Cite the moment, don't sensationalize it.** The 2026 discovery rulings
   (e.g. *Conservation Law Foundation v. Shell*) are real urgency — state them
   factually with the date, never as fearmongering.
5. **Affirmative, not defensive, on ethics.** "Using AI assistance is permitted;
   what's required is disclosure and expert ownership — this tool does both."
   Lead with permission + the fix, not with the threat.

---

## Tone calibration by surface

- **Landing page:** confident but understated. Lead with expert authorship and
  the ethics frame, not the output. Show the sample and the appendix — proof
  beats adjectives for this audience.
- **In-product microcopy:** direct, second-person, agency-affirming. The live
  workspace voice is the north star — "You are the author. Approve to lock this
  section for export." Keep that register everywhere.
- **Legal / privacy:** precise, literal, hedged where reality requires.
  Commitments framed as commitments. Banner present.
- **Email / outreach:** peer-to-peer, no marketing gloss. A respected expert is
  doing us a favor by reading. Short, specific, one ask.

---

## Copy checklist (run before any user-facing string ships)

- [ ] Does the verb imply the tool **originated** a fact, opinion, number, or
      citation? (If yes — rewrite. This is the existential one.)
- [ ] Is "we" the actor producing report content? (If yes — make the tool the
      instrument and the expert the author.)
- [ ] Any guarantee of admissibility/compliance/court outcome? (Replace with
      "structured / designed to support / discloses.")
- [ ] "tamper-proof / immutable" anywhere? (→ "tamper-evident / append-only.")
- [ ] Any certification, contract, or capability we don't actually hold stated
      as present fact? (→ commitment/intent, or remove.)
- [ ] Any statistic without provenance? (→ attribute or reframe.)
- [ ] Legal-adjacent page missing the "not legal advice / not a law firm"
      banner?
- [ ] Would a cross-examining attorney be able to call this sentence an
      overstatement? (If maybe — soften it.)

The automated guard is `src/test/honesty.test.ts`. It is a floor, not a ceiling
— a string can pass the test and still violate this file. The checklist is the
real gate.
