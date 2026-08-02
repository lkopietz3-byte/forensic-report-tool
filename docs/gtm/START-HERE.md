# START HERE — your go-to-market preparedness kit

Thirteen documents that turn "the product is built" into "I can deploy it, talk to
experts credibly, demo it, and sell it." Read this page first; it tells you what
each one is and the order to use them in.

## The one thing this kit does not change

**The bottleneck is still deploy + send the 10 emails.** None of this is a reason
to delay that. The kit exists so that when the emails land a call, you're ready —
not so you can spend two weeks polishing collateral instead of shipping. The honest
order is: **deploy → learn enough to be credible → send → run great calls.** If you
catch yourself perfecting a one-pager before the site is live, stop and go deploy
(`docs/GO-LIVE.md`).

---

## What's in the folder

Everything obeys `00-content-brief.md`, which itself obeys `docs/VOICE.md` and the
honesty rules in `CLAUDE.md`. If you edit anything here, keep it inside those rules.

### The rulebook
- **[00-content-brief.md](00-content-brief.md)** — the rules every asset follows:
  voice, the honesty do/don't table, and the only domain/legal/product facts any
  asset may state. Read it once so you can keep new copy honest yourself.

### Tier 1 — make yourself credible (do before the calls)
- **[01-field-guide-vocational-rehab.md](01-field-guide-vocational-rehab.md)** — the
  crash course. What forensic vocational rehab is, who the experts are, RAPEL, the
  TSA, how Rule 26 + Daubert apply, the AI-disclosure cases, and a frank "how to
  talk when you're a builder, not an expert." **This is the highest-value document
  in the kit.** Read it twice.
- **[02-cheatsheet-and-glossary.md](02-cheatsheet-and-glossary.md)** — one screen to
  keep open *during* a call: RAPEL, the Rule 26 elements, the 5 cases, a 24-term
  glossary, and the phrases that signal you get it (vs. the tells that you don't).
- **[05-product-mastery.md](05-product-mastery.md)** — be the expert on your own
  app: every feature, why it exists, the one-line talking point, and the honest
  limit. The moat (closed-world grounding + the tamper-evident disclosure record)
  explained so you can defend it cold.
- **[03-discovery-call-playbook.md](03-discovery-call-playbook.md)** — the
  minute-by-minute manual for a single call: prep, the opening frame, the question
  flow, the design-partner ask, and the five answers to capture. Extends the
  `design-partner-kit.md`, doesn't repeat it.
- **[04-objection-handling.md](04-objection-handling.md)** — the 12 objections
  you'll hear and honest, on-voice answers (including the hard one: yes, AI use may
  be discoverable — here's why a clean record beats a reconstructed one).

### Tier 2 — show it (demos)
- **[07-live-demo-script.md](07-live-demo-script.md)** — the 5-minute "watch it
  refuse a fake citation" wow, and the 15-minute full walkthrough. What to click,
  what to say, how to recover if the build is slow.
- **[08-static-demo-walkthrough.md](08-static-demo-walkthrough.md)** — the async
  version to email: a captioned screenshot storyboard, a cover note, and a ~250-word
  leave-behind.

### Tier 2 — sell it (marketing assets)
- **[09-elevator-pitches-and-positioning.md](09-elevator-pitches-and-positioning.md)**
  — positioning paragraph, taglines, 10s/30s/2-min pitches, and an honest founder
  story (no fake bio).
- **[10-one-pagers.md](10-one-pagers.md)** — designer-ready one-pagers, one for the
  expert and one for retaining counsel.
- **[11-social-content-calendar.md](11-social-content-calendar.md)** — 12 LinkedIn
  drafts (build-in-public + caselaw thought leadership) and a 4-week cadence. This
  is the slow-burn credibility engine; start it once the site is live.

### Tier 3 — support it (help content, for when users arrive)
- **[06-getting-started.md](06-getting-started.md)** — first-run onboarding for a new
  expert user, zero to a signed-ready report, with the real button labels.
- **[12-help-center-faq.md](12-help-center-faq.md)** — 29 Q&A across getting
  started, grounding, the disclosure record, exporting, confidentiality, billing,
  and an honest "trust & limits" group.

---

## Use it in this order (mapped to the 30-day plan)

1. **Deploy** (`docs/GO-LIVE.md`). Nothing here matters until the links work.
2. **Read 01 + 02 + 05.** Get fluent in the field and your own product. A day, maybe
   two. This is the difference between a call that earns a design partner and one
   that ends in a polite "interesting, good luck."
3. **Skim 03 + 04.** Know the call shape and the objections before the first one
   books.
4. **Send the 10 emails** (`docs/outreach-batch-1.md`). The day-14 tripwire is real.
5. **For each call:** prep with 03, demo with 07, handle pushback with 04, send 08 as
   a follow-up. Capture the five answers every time.
6. **Once live:** start the 11 cadence; publish a caselaw post timed to the moment.
7. **When a design partner says yes:** stand up 06 + 12 as real help content and
   red-team 01's template with them (it's desk-research until they validate it).

---

## Before ANY of this goes in front of a customer — fix these three

The writers flagged a handful of `[VERIFY]` placeholders. They all reduce to three
facts only you can confirm:

1. **Pricing.** The live app currently shows **$250 / report** with a planned
   **$1,000 / 5-pack**; do not offer an unlimited annual plan (the brief's older
   pricing was exploratory — use the current numbers). Every asset frames pricing
   as *current, still being validated* — keep
   that softness, and update the figures if you change them in Stripe. Search the
   folder for `[VERIFY` to find each spot.
2. **Zero-retention / data posture.** Assets say you *commit* not to train on data
   and describe a *zero-retention path* — never a signed contract or SOC 2. Confirm
   the Anthropic API setting reflects that before the one-pagers go out, and keep the
   wording as a commitment.
3. **CLF v. Shell status.** It's cited everywhere as a *non-final magistrate order
   under Rule 72(a) review*. Before a post or one-pager that names it ships, check
   whether the district judge has ruled — if it resolved, update the line. It may
   change the story either way; the kit is written to survive both.

Two standing truths the kit already bakes in, but worth holding in your head: the
**vocational template is desk-research until a real expert validates it** (don't
present it as settled methodology on a call), and **admissibility is always the
court's call** (never yours or the tool's to promise).

---

*Generated by six specialist writers against `00-content-brief.md`; honesty-checked
(no admissibility/compliance guarantees, no "tamper-proof," no fabricated stats or
certifications, every case carries the "not legal advice" + CLF-non-final caveats).
Pricing and the two status items above are the only things left to confirm.*
