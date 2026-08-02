# Legal-review handoff — Disclosed.

**What this is:** a checklist to make a licensed attorney's review of Disclosed.
fast and cheap. It inventories the terms that already exist, then lists the
specific decisions and gaps only a lawyer should resolve before you (a) take real
money and (b) accept real, protective-order case files.

**What this is NOT:** legal advice, and not a substitute for a licensed attorney.
Disclosed. is a software company, not a law firm. Have a qualified attorney in
your jurisdiction review everything below before relying on it. Nothing here is a
representation that any clause is enforceable.

---

## What already exists (don't re-draft — review)

The product ships honesty-compliant legal copy today. Point your attorney at:

- **`/terms`** (`src/app/terms/page.tsx`) — Terms of Service. Covers: the expert
  is the sole author and responsible signer (Rule 26(a)(2)(B)); no warranty of
  admissibility or accuracy; limitation of liability (cap = greater of trailing
  12-month fees or $100); acceptable use; content ownership + a no-training
  commitment; termination; "not legal advice / not a law firm."
- **`/disclaimer`** (`src/app/disclaimer/page.tsx`) — AI-Use & Expert Authorship
  Disclaimer. Reinforces: the tool structures, the expert authors, reviews,
  verifies, signs, and is responsible; admissibility is the court's decision.
- **`/privacy`** (`src/app/privacy/page.tsx`) — privacy policy.
- **In-product author callout** — the workspace shows "You are the author…"
  before the deliverable (`ReportBuilder.tsx`).

These are drafts marked "pending attorney review" — the review is the point.

---

## Decisions only a licensed attorney should make

### A. Before you take the first dollar

1. **Company entity + name.** The terms say "Disclosed." and "its operators."
   Once the entity is formed (LLC/PLLC — ask an accountant too), the terms need
   the real legal name and notice address. *Do not take money into a personal
   account for a litigation-adjacent product.*
2. **Governing law, venue, and dispute resolution.** The current terms have **no
   governing-law, venue, or arbitration clause** — this is the most notable gap.
   Decide: which state's law, where disputes are heard, and whether to require
   arbitration + a class-action waiver.
3. **Is the liability cap enforceable and appropriate?** The greater-of-$100-or-
   12-months cap is aggressive for a tool touching court deliverables. Confirm
   enforceability in your governing-law state and that it survives a
   "professional negligence"-style framing.
4. **Add an indemnification clause?** Currently absent. Typically: the expert
   indemnifies the vendor for the expert's own misuse, fabrication, or breach of
   the acceptable-use terms. A lawyer should draft the mutual/one-way scope.
5. **Billing/consumer terms for credits + subscription.** Auto-renewal disclosure
   laws (e.g. California's ARL, and similar state laws) apply to the subscription.
   Refund policy for unused credits. Whether buyers are "consumers" or
   businesses. The billing code is wired; the *terms* around it are not reviewed.
6. **Marketing-copy compliance sign-off.** The honesty rules (structures-not-
   drafts; admissibility-is-the-court's; tamper-evident-not-proof; no fake certs;
   no "court-defensible/admissible/guaranteed") are self-enforced in the repo.
   Have counsel confirm nothing on the live site oversteps into an implied
   warranty or an unfair-trade-practices exposure.

### B. Before you accept real, protective-order case files

7. **Sub-processor / data-flow disclosure.** When live AI drafting is on, evidence
   text is sent to the model provider (Anthropic's API). The terms must name the
   sub-processor and describe the data flow. **Verify the no-training claim** maps
   to Anthropic's *current commercial/API* terms (API data is not used for
   training by default) — and do **not** upgrade the language to a "signed
   zero-retention contract" unless one actually exists (it doesn't; the repo's
   honesty rules forbid that claim).
8. **Protective-order / privilege posture.** Acceptable-use already tells experts
   not to upload materials barred by a protective order or where upload would
   waive privilege. Confirm that instruction + the "nothing is stored" framing of
   the `/intake` demo is sufficient, and whether you need a written data-processing
   addendum for firm/B2B buyers.
9. **PHI / HIPAA.** The beachhead (vocational-rehab / earning-capacity) can touch
   medical records. Decide whether any workflow puts you in "business associate"
   territory and, if so, whether a BAA is required — or whether acceptable-use +
   the expert's own compliance is the boundary. *(The product deliberately avoids
   the medical/IME sub-niche partly for this reason — confirm you stay outside it.)*
10. **E&O insurance alignment.** Match the terms' liability posture to real
    Errors & Omissions coverage before real reports flow. Talk to an insurance
    broker; align the policy and the cap.

---

## The one product change worth making (your call)

Acceptance today is **passive** — the terms are posted and there's an author
callout, but the expert never *actively* accepts them at the moment it matters.
For a liability firewall, an **active click-through at the point of export** is
materially stronger:

> ☐ I am the author of this report. I have reviewed and independently verified
> every statement, figure, and citation. I accept the [Terms](/terms).

…required (unchecked-by-default) before the first export, with the acceptance
recorded (timestamp + terms version). This is a small, contained change to the
export flow and it upgrades the posture from "we posted terms" to "the signer
affirmatively accepted responsibility on the record."

**I can implement this** whenever you want it — but whether to gate on it, and the
exact wording, is a legal-posture decision for you + your attorney, so I'm flagging
it rather than adding it unilaterally.

---

## Bottom line

The terms *text* is in good shape and honesty-compliant. The work isn't writing
new terms — it's (1) a licensed attorney closing items A2–A5 and B7–B10, (2) the
entity + E&O, and (3) optionally the active-acceptance gate. Items **A1–A5 gate
taking money; B7–B10 gate real case files.** Everything else can ship in demo mode
now.
