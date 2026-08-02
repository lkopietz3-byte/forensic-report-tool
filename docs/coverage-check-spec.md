# Coverage Check — Feature Spec & Guardrails

A private, expert-controlled "second set of eyes" that prompts the expert about
gaps in **their own** materials — without ever originating a fact, number,
opinion, citation, or theory. Mechanism #2 (loose-ends relational checks) is
**shipped** on `/sample` (`src/lib/domain/coverage.ts` + the panel in
`src/app/sample/page.tsx`). Mechanisms #1 and #3 below are the roadmap.

## Why this is safe (the legal basis)

**Status:** mechanism #2 (loose-ends) and mechanism #1 (challenge-readiness
checklist) are **shipped** on `/sample`. Mechanism #3 (private prep questionnaire)
is **deferred** — its question bank overlaps #1, and its natural home is a real
case-intake/workspace that doesn't exist yet; revisit when auth/intake lands.

Deep research (June 2026; 25 sources, adversarially verified) settled the design:

- **It's explicitly permitted.** *Numatics, Inc. v. Balluff, Inc.* (E.D. Mich.,
  No. 13-11049): one "may explain the rule's requirements and **coach the expert
  to be sure the report touches all the bases**" — what's forbidden is "abject
  ghostwriting." A neutral coverage question sits on the permitted side.
- **It targets what Daubert/FRE 702 actually punish** — the "parrot doctrine"
  (an expert who merely restates others' assertions has no reliable
  methodology), insufficiency of basis, and unaddressed elements. So it hardens
  the report against the challenges users fear.

## The make-or-break rule: EPHEMERAL, never logged

*Conservation Law Foundation v. Shell Oil* (D. Conn., May 2026; **stayed on a
Rule 72(a) objection June 3, 2026 — unsettled, so design for the worst case**)
ordered an expert's AI interactions produced as **discoverable Rule-26
methodology**. A retained record that "the tool warned you that you had no
labor-market survey and you proceeded anyway" would be a ready-made impeachment.

Therefore:

- The coverage check **must stay ephemeral**: computed on demand, shown, then
  dropped. **Never** written to the `AuditLog`, **never** in the report or the
  AI-Disclosure appendix, **never** persisted server-side.
- `src/lib/domain/coverage.ts` deliberately **takes no `AuditLog`** and imports
  none. Keep it that way. The tamper-evident audit trail (the moat) proves the
  expert originated all substance; it must not also swallow the gap warnings, or
  the moat becomes the weapon.
- The UI says so plainly: *"Nothing here is logged, exported, or recorded in the
  AI-Disclosure appendix — a private check you control, kept out of the
  discoverable record by design."*

## The honesty / independence line (safe vs. unsafe phrasing)

A neutral question that **names a category or requirement** is safe; a prompt
that **supplies the answer** (fact, number, range, citation, theory) collapses
FRE 702 independence and breaks the CLAUDE.md invariant.

- ✅ "Have you addressed work-life expectancy in your earning-capacity analysis?"
- ✅ "You listed these records as reviewed but didn't cite them — intentional?"
- ✅ "Rule 26 requires the basis for each opinion — is each stated?"
- ❌ "Use a 14.2-year work-life expectancy."
- ❌ "Add a labor-market survey showing 12% reduced access."
- ❌ "The claimant is likely limited to sedentary work." / "Cite Smith v. Jones."

## Adoption framing

High-autonomy professionals reject tools perceived as encroaching on their
judgment (perceived autonomy-threat is the dominant non-adoption driver,
β ≈ −0.397, p<0.01 in the CDSS literature). So: **voluntary, opt-in,
expert-led, non-authoritative.** Frame as "your private second set of eyes,"
never "the AI found a problem" or "you must." (Surgical-checklist backlash flows
toward *human* enforcers in a hierarchy — likely weaker for a private solo tool,
which cuts in our favor.)

## Mechanism #2 — loose-ends (SHIPPED)

`findLooseEnds()` — pure, deterministic, closed-world. Categories:

- `unused_evidence` — a confirmed record cited in no section.
- `listed_not_relied` — a record cited only in an index/list section
  (Records Reviewed / Facts or Data / Exhibits), never in an analysis section.
- `open_input` — a section carrying an open `[Expert input needed: …]` item.
- `uncited_section` — a drafted evidence-based section that cites nothing.

Every output is a neutral question. The check also reports `inputsAllRelied`
(a positive signal when every record is used) and `clear`.

## Mechanism #1 — challenge-readiness checklist (SHIPPED)

`buildCoverageChecklist(template, reportText?)` — curated neutral coverage
questions carried per-section on the template as `coveragePrompts: CoveragePrompt[]`
(`{ q, mentions? }`), keyed to Rule 26 + RAPEL + Daubert. Pure self-check: the
expert confirms each. As a conservative, reliable aid, a question may declare
distinctive `mentions` terms; when NONE appear anywhere in the report, the UI
flags it "not detected — addressed?" (still a question, never a claim, never an
answer). On the sample this correctly surfaces two real omissions — the
claimant's age and the interview date — among 18 questions. Rendered inside the
private Coverage-check panel on `/sample`; never exported or logged.

## Roadmap (same guardrails apply)

- **Mechanism #3 — private pre-draft prep questionnaire (DEFERRED).** A worksheet
  that prompts before drafting and never appears in the deliverable. Deferred:
  its question bank overlaps #1, and its home is a real case-intake/workspace not
  yet built. When built, reuse #1's `coveragePrompts`; same no-log rule; consider
  documenting it as attorney-directed, work-product-adjacent prep.
- **Possible enhancement to #1:** richer per-discipline `mentions` tuning and
  more disciplines (engineering/reconstruction) as their templates land.
- **Closest real-world template:** Wolters Kluwer CCH Knowledge Coach —
  status/logic/risk diagnostics flag gaps; the professional supplies the
  substance.

## Do / Don't

- **Do:** neutral questions only; opt-in and expert-controlled; ephemeral +
  dismissable without record; positive "all relied" signal; mirror the
  navigate-to-gap / expert-supplies-substance pattern.
- **Don't:** persist or log gap warnings; phrase as facts/numbers/recommendations;
  present as authoritative or mandatory; let any of it touch the audit trail or
  export; market it as "drafting."

## Open questions (track)

- Would a court treat an *ephemeral* (never-stored) prompt the same as a logged
  one for Rule 26 "facts/data considered"? The "considered" standard may reach
  even un-retained influences — favors keeping prompts neutral/non-substantive
  regardless of persistence.
- Does CLF v. Shell survive Rule 72(a) review and spread to other circuits?
- Do CRC/ABVE experts (who already work from RAPEL) welcome coverage checklists
  more than the physicians/surgeons in the studied analogues? (Validate in
  discovery interviews.)
