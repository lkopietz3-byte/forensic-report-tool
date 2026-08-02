> **STALE SCORES — historical snapshot.** This audit predates the end-to-end build sprint
> (live-AI wiring, auth + RLS persistence, persisted tamper-evident audit chain, Stripe
> subscriptions + credit packs, hard grounding gate on export, CSP nonce, ~220 tests).
> Product-completeness/engineering/UX/moat scores below are now materially understated.
> The validation/distribution/TAM scores remain accurate — those were never code problems.

# Honest Audit — Disclosed. (June 2026)

A deliberately harsh, no-flattery assessment. Ratings are /10 where 5 = "average
/ unproven," not "passing." The single most important line in this whole document:
**you have built an excellent answer to a question no real customer has yet
confirmed they are asking.**

## Overall: 4.5 / 10 as a *business*; 8 / 10 as a *prototype*

Beautiful, disciplined execution of an **unvalidated bet**. Nothing here is proven
in market: no design partner, no user, no revenue, no domain-expert sign-off, and
a "product" that can't yet produce a real report end to end. The gap between how
good this looks and how little is validated is the whole story.

---

## Ratings by category

### Concept & positioning — 7/10
The wedge is genuinely sharp and, per the competitive sweep, **unoccupied today**:
nobody sells "structure the expert's *own* findings into a Rule 26 report + a
tamper-evident AI-disclosure record." It rides a real, named, accelerating legal
trend (*CLF v. Shell*, *Kohls v. Ellison*, the Dec-2025 Evidence Rules Committee).
That's a legitimately good opening. Docked hard because the slot is open due to
being *nascent*, not *defensible*, and the buyer is scared, not eager.

### Prototype / demo quality — 8/10
The sample report, the grounding-tinted `/intake` demo, the auto-generated
disclosure record, the OCR upload, the content article — all polished and
credible. This is top-decile *prototype* craft for a solo build. It earns the
meeting. It does not yet earn the money.

### Product completeness (is it a usable product?) — 3/10
This is the brutal one. **You cannot do a real report end-to-end.** No auth, no
persistence, no multi-section workspace, exports are sample-only, and the live
(model-backed) drafting path is *off* — the demo is deterministic. A prospect who
says "great, let me run my actual case through it" hits a wall. It's a convincing
demo, not a tool someone can adopt. Until that's false, every "yes" is theoretical.

### UX / design — 7.5/10
Now genuinely good after this week's work (product-preview hero, premium pricing,
responsive nav, the article). But it took several rounds to catch real defects —
the iOS zoom, the nav collision, the email input collapsing to 21px on mobile —
which says the polish is recent and not yet battle-tested across devices. Still
has zero real-user usability testing.

### Engineering quality — 8/10
Above bar: 167 tests, the honesty/grounding invariant enforced by tests, an
append-only hash-chained audit log, careful CSP, accessible-ish markup. Caveat:
it's a **marketing site + single-tenant demo**, not a hardened multi-tenant app.
Everything that makes it *production* — RLS isolation, server-side billing
enforcement, persisted audit chain, CSP nonce, auth — is deferred. The hard 20%
is unwritten.

### Honesty / legal framing — 9/10
The best thing here, and a real differentiator. "Never originates an opinion,"
"you stay the author," "tamper-evident not tamper-proof," "admissibility is the
court's call" — all disciplined and test-guarded. For a malpractice-wary,
conservative buyer this is the credibility wedge. Don't ever let marketing erode it.

### Moat / defensibility — 4/10
Per the competitive read: almost none of this is technically defensible. The
report-structuring is a template+LLM problem **CaseMark is two workflows away
from**. The "AI audit trail" moat is **already a commodity primitive** sold by
illuminis/Swept/nono to better-funded insurance/enterprise buyers — re-skinnable
for legal in a sprint. Your only durable moats are *distribution + trust in a
narrow vertical*, *category-definition speed*, and the *honesty positioning* —
none of which you hold yet.

### Differentiation vs. competitors — 6/10
Unclaimed slot today (good), but thin. Closest threat **CaseMark** already does
FRCP-26 designation + expert-report *summarization* and sells to litigation. Your
fiercest real competitor is a **$20 Copilot subscription the expert already
misuses**. You're differentiated on philosophy and disclosure — easy to copy once
proven.

### Market / TAM — 4/10
Single-discipline beachhead realistically caps at low-single-digit-millions ARR.
Distribution is the worst kind: conservative, referral-driven, slow-adopting, no
existing audience. "Getting rich" depends entirely on multi-discipline + adjacent
modules landing *after* the beachhead is proven — and the beachhead isn't proven.

### Pricing — 4/10
Numbers ($250/report, $1,500/yr) are **guessed**. Zero evidence experts will pay
them, or prefer per-report vs. seat. The ROI framing ($1,500 of time back) is a
good *story* but untested against a buyer who'll counter with "Copilot is $20."

### Go-to-market readiness — 6/10
Strong *assets* now (the kit, `/for-experts` quality-gated application, the
content piece, human outreach drafts). But: not deployed, no audience, no
emails sent, no design partner, no conference presence. Readiness ≠ traction.

### Validation — 1/10
The dominant weakness. **Effectively zero.** No discovery interviews, no design
partner, no domain expert who has red-teamed a real report, no paying user, no
demand signal beyond inferred legal commentary. The plan named this as the #1
fatal risk months ago and it is *still open*. Every other rating on this page is
provisional until this number moves.

### Founder / execution risk — 5/10
Strong solo builder (this codebase proves it). But: can't personally QA a
credibly-compliant RAPEL/ASTM report, must build + sell + support alone, and is
emotionally invested in a thing that looks finished but isn't validated — the
exact setup for over-building instead of selling.

---

## The five brutal truths

1. **You're optimizing the product when the bottleneck is demand.** Another
   feature, another polish pass, another section of the landing page — all of it is
   procrastination dressed as progress until one real expert says "I'd pay for this."
2. **It's a demo, not a product.** The moment someone wants to use it for real,
   there's nothing to use. That cliff is invisible from the marketing site.
3. **The moat is a screen door.** Open today only because CaseMark and the
   audit-trail vendors haven't bothered. The protection is their inattention, which
   is not a strategy.
4. **You're selling fear to people who haven't decided to be afraid yet.** The
   disclosure wedge converts only if experts believe non-disclosure gets them
   excluded. That belief is forming, not formed.
5. **You cannot vouch for the one thing that matters most — report quality —**
   and neither can anyone else yet, because no forensic expert has validated it.

## What would actually move these numbers (in order)

1. **Five discovery calls.** Validation 1 → 4 with nothing but a calendar. This is
   the highest-ROI hour you can spend, full stop.
2. **One design partner who red-teams a real report.** Product-completeness and
   quality go from theoretical to evidenced; moat (#1 = trust) starts to exist.
3. **One expert who says "I'd pay $X."** Pricing 4 → 7 and the whole TAM model
   stops being fiction.
4. **Make the live path work end-to-end for one real case** (auth-light, just
   enough to produce one real report). Product-completeness 3 → 6.
5. **Name the category publicly before CaseMark does** — "Rule-26 AI disclosure
   for experts." The article is step one; keep going.

## The one-sentence verdict

A genuinely clever, beautifully built, honestly positioned prototype sitting on an
open-but-shallow wedge — whose entire value now hinges on the founder closing the
laptop and talking to ten forensic experts before building anything else.
