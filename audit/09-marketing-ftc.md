# Audit 09 — Marketing Claims / FTC & Credibility Honesty Review

Scope: all visible copy in `src/app/page.tsx`, `src/app/layout.tsx` (metadata),
`src/app/sample/page.tsx`, and `src/app/app/Workspace.tsx`.

---

## Per-Claim Findings

### 1. [CRITICAL] "Court-defensible expert reports" (H1 headline, `<title>` metadata)

**Why risky:** An asserted-fact framing, not aspirational. Pre-launch, zero paying
users, no real product access, no validation by any court or legal authority. A
sophisticated forensic expert or their retaining counsel could argue the product
has never been tested in actual litigation. "Defensible" also implies legal
adequacy — which only a judge or opposing counsel, not a software vendor, can
determine. FTC Section 5 prohibits unsubstantiated objective claims.

**Honest reword:** "Expert reports drafted for court disclosure" or "Structured to
meet Rule 26(a)(2)(B) requirements — you review and sign." Reserve
"court-defensible" for a post-launch claim supported by actual use in litigation.

---

### 2. [CRITICAL] "Encryption in transit and at rest, no training on your case data, and a zero-retention path with our model provider. Built for material under protective order." (GUARDRAILS card, `page.tsx`)

**Why risky:** Four distinct asserted facts, none of which can be verified as true
at this moment:
- "Encryption in transit and at rest" — has the infrastructure actually been
  built and configured? No product exists yet.
- "No training on your case data" — requires a signed data-processing agreement
  or DPA with the model provider explicitly prohibiting training use. No such
  contract is confirmed to exist.
- "A zero-retention path with our model provider" — same issue; this is a
  provider-side contractual guarantee. Anthropic's default API terms do not
  include a zero-retention SLA without a specific enterprise agreement.
- "Built for material under protective order" — a protective order imposes strict
  confidentiality obligations. Asserting suitability for PO material without a
  BAA-equivalent or independent legal review is both legally risky and
  potentially misleading to experts who face sanctions for PO violations.

Any sophisticated expert who relies on this statement and later discovers the
contract doesn't exist faces real professional and legal exposure. This is the
single highest-liability cluster in the copy.

**Honest reword:** "Designed for confidentiality: our roadmap includes
encrypted-at-rest storage, a zero-retention agreement with our model provider,
and suitability review for protective-order material. None of these are active
until we confirm the contracts and infrastructure are in place — we'll publish
our data-handling policy before launch."

---

### 3. [HIGH] Green "Verified" badge on the mock AI-Disclosure Appendix (hero section, `page.tsx`; also in `sample/page.tsx`)

**Why risky:** The badge says "Verified" with no explanation of what has been
verified, by whom, or against what standard. On a landing page, a green
"Verified" badge to a sophisticated user (who scrutinizes wording) implies
independent third-party validation — e.g., a legal review, SOC2-style audit, or
court approval — none of which exists. It is the kind of trust signal that FTC
guidance on misleading design patterns (dark patterns) specifically calls out.

**Honest reword:** Remove the badge entirely from the marketing mock-up, or
replace with a label that is accurate and self-explanatory, such as "Generated
from audit log" (which the sample page already uses as a second badge — use only
that one).

---

### 4. [HIGH] "courts now order experts to produce how they used AI" (stat bar, `page.tsx`) and the "May 2026" case citation (AI-Disclosure section)

**Why risky:** Two related issues:
- The generic present-tense assertion ("courts now order") is stated as
  established fact but is only an emerging trend as of mid-2026. No citation
  is provided, which means a skeptical reader — especially a forensic expert
  who researches citations for a living — will demand a source.
- The specific "May 2026 federal court ordered an expert to produce the exact AI
  prompts behind her report as discoverable Rule 26 methodology" is an
  unattributed case claim. If this is based on a real case (e.g., hypothetically
  CLF v. Shell or similar), the case name and citation must appear. If it is
  illustrative/hypothetical, it must be disclosed as such. Stating a specific
  month and event without a cite reads as fact to lawyers who will look it up.
  A fabricated or mischaracterized precedent would be catastrophic for
  credibility with exactly the audience this product targets.
- The companion claim "Another expert's testimony was struck for
  AI-hallucinated citations" has the same problem — needs a case cite or
  explicit disclaimer that it is illustrative.

**Honest reword:** Either (a) add full case citations (case name, court, date) for
both examples, or (b) reframe explicitly as illustrative: "In scenarios courts
are beginning to encounter, experts have been asked to produce AI prompts as
discoverable methodology. Courts have stricken testimony where AI-generated
citations could not be verified." Add a footnote: "Illustrative; specific rulings
vary by jurisdiction."

---

### 5. [HIGH] "every Rule 26(a)(2)(B) element accounted for" (stat bar and Rule 26 section heading, `page.tsx`)

**Why risky:** This is stated as a present-tense guarantee. Rule 26(a)(2)(B)
requires: (i) complete statement of opinions and basis; (ii) facts or data
considered; (iii) exhibits; (iv) expert's qualifications; (v) list of prior
testimony; (vi) compensation statement. Whether the tool actually produces
content for all six elements in a compliant form is a legal determination, not an
engineering one, and no attorney or court has validated it. "Accounted for" could
be construed as a warranty of legal compliance.

**Honest reword:** "Structured around all six Rule 26(a)(2)(B) elements — you
confirm each is complete before export." This is accurate (the gating logic
exists in the code) without implying legal certification.

---

### 6. [HIGH] "Built so it can't embarrass you" + "make that impossible" (Trust section, `page.tsx`)

**Why risky:** "Can't" and "impossible" are absolute — they constitute a
guarantee of zero failure. No software can make hallucination or fabricated
citations impossible; the AI model itself can still produce malformed output that
slips past the citation-check regex. If a report goes out with a bad citation
and the expert traces it back to this claim, the language creates an
indemnification argument.

**Honest reword:** "Built to make fabricated citations extremely hard to miss —
every factual sentence must resolve to a source you supplied, and the export is
blocked if any sentence is ungrounded." This is accurate to what the code
actually enforces and does not overclaim.

---

### 7. [MEDIUM] "each one reclaims hours of billable time worth far more than the credit" (Pricing section, `page.tsx`)

**Why risky:** This is an ROI claim with no substantiation. "Far more" is vague
but directionally assertive. FTC guidance requires that performance claims (time
savings, economic benefit) be substantiated with evidence — typically surveys or
user data. Pre-launch with no customers, there is no data. The "3–5 hrs" stat
bar claim has the same problem.

**Honest reword:** Frame both as estimates: "Forensic experts often write off 3–5
hours of drafting time per report — each credit is priced at a fraction of a
single billable hour at typical expert rates." This is plausible and honest
without asserting it as a measured fact.

---

### 8. [MEDIUM] "First report free" (Pricing card, `page.tsx`)

**Why risky:** No product exists. This promise is unenforceable and potentially
deceptive if the pricing structure changes before launch — which the fine print
acknowledges ("Early-access pricing, subject to change"). The combination of a
specific concrete offer ("First report free") with a blanket change-right creates
a contradiction.

**Honest reword:** Either remove "First report free" from the pricing table until
the product ships, or add explicit qualification: "First report free for
early-access design partners — subject to availability."

---

### 9. [MEDIUM] "Priority drafting queue" (Active expert tier, `page.tsx`)

**Why risky:** Implies a queue exists, meaning the service is in operation and
some users experience slower service. Pre-launch, this is meaningless and
potentially misleading — it implies the product already has enough load to
require queue management. Sophisticiated buyers notice infrastructure claims.

**Honest reword:** Remove until launch, or replace with "Priority onboarding and
template setup" which is honest about what the pre-launch benefit actually is.

---

### 10. [LOW] "Discipline template tuned to your format" / "Discipline template tuning & support" (Pricing tiers)

**Why risky:** Implies a person or team will do custom configuration work as part
of the subscription price. If this isn't a firm commitment (staffing, SLA,
scope), it creates expectation risk. Minor but worth tightening.

**Honest reword:** "Discipline template co-design with you during onboarding" —
which matches the actual CTA language ("Help shape the template") used elsewhere.

---

### 11. [LOW] Layout `<title>` metadata: "Court-Defensible Expert Reports" (same as claim #1 above)

Repeated in `layout.tsx`. Same risk as #1 — appears in search results as a
factual assertion. Fix in both places together.

---

### 12. [INFORMATIONAL] "Fictional matter for demonstration. No real party, expert, or data." (sample/page.tsx)

This disclaimer is present and correct. Good. However, it appears only in small
`text-xs` text. For a legal audience who may screenshot the sample, it should be
more prominent — consider a banner, not a caption.

---

## Top 3 Must-Fix Before Any Traffic or Press Coverage

1. **Data-handling / confidentiality cluster (Claim #2):** Remove all four
   asserted-fact data-security claims ("encryption," "no training," "zero
   retention," "built for protective order") until the infrastructure is built
   and the provider contract is signed. Replace with future-tense/aspirational
   language and a commitment to publish a data-handling policy. This is the
   highest legal and reputational risk — a forensic expert who violates a
   protective order because they relied on this marketing has a direct harm to
   point to.

2. **Unattributed case citations (Claim #4):** The "May 2026" federal court
   anecdote and the "testimony struck" anecdote must either be footnoted with
   real case cites or explicitly labeled as illustrative scenarios. Forensic
   experts and lawyers will Google these immediately. Fabricated or vague
   precedent destroys credibility with the exact audience you need.

3. **"Court-defensible" headline + "can't embarrass you / impossible" guarantee
   (Claims #1, #6):** The H1, `<title>`, and absolute-guarantee language must be
   softened to aspirational framing before launch. These are the two claims most
   likely to become the basis of a deceptive-advertising complaint or an expert's
   malpractice defense argument ("I relied on the vendor's guarantee that it was
   court-defensible").
