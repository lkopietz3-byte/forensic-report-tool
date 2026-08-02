# 18 — Conversion, Message Hierarchy & Objection Handling

Scope: src/app/page.tsx + src/app/_components/Waitlist.tsx — full-funnel audit for a skeptical forensic expert-witness audience.

---

## Issues (ranked by funnel/conversion impact)

### [P0] Hero doesn't lead with the primary objection it must defeat
**Impact:** The #1 reason a forensic expert bounces is "AI-authored reports are unethical and cross-exam-fatal." The headline ("Court-defensible expert reports, drafted from your findings") is directionally right but buries the differentiation. A skeptic reads "AI drafts the report" and stops. The word "AI" doesn't appear in the headline or subhead; the mechanism is implicit.
**Fix:** Lead the headline with the ethical frame, not the output. E.g., "You sign. AI structures. The court sees exactly how." Or add a one-line sub-pill: "Your findings. Your signature. Your cross-exam story." Make the expert the irrefutable author in the first 5 words.

### [P0] No "Is this even allowed / defensible under cross-examination?" treatment anywhere
**Impact:** The single biggest objection for this audience is that opposing counsel will use AI use against them at deposition. There is no section, no FAQ, and no language directly rehearsing the cross-exam answer the expert needs. The AI-Disclosure dark section explains the appendix mechanically but doesn't arm the expert with the answer to "Isn't this just an AI hallucination you signed?"
**Fix:** Add a dedicated "Cross-Exam Ready" or "What do you say at deposition?" band immediately after the AI-Disclosure section. 3 short Q&A pairs: (1) "Did AI write your report?" → correct answer + how the appendix proves it; (2) "Are those citations real?" → grounding mechanism; (3) "Was this peer-reviewed?" → expert-authored, expert-signed framing. This is the single highest-value conversion addition for this audience.

### [P0] Pricing: 4 tiers is paralyzing for a pre-launch waitlist with zero social proof
**Impact:** The page's only goal right now is waitlist signups + design-partner recruitment. Showing 4 tiers signals a finished product, creates analysis paralysis, and raises the question "Which one am I agreeing to?" before the expert trusts the product at all. "Firm Unlimited" at $6,000/yr especially mismatches the individual-expert waitlist context.
**Fix:** Pre-launch: collapse to 2 options max. Option A: "Pay per report — $200, first one free." Option B: "Design partner — help shape the template for your discipline, then get preferred access." Hide Firm/Firm Unlimited behind "Need multi-seat access? Talk to us →". Re-expose full pricing post-launch.

### [P1] "3–5 hrs" time-savings claim is unsubstantiated and will be challenged
**Impact:** Skeptical experts will dismiss this immediately if it has no provenance. "Often-written-off time" hedge is good but not enough. Without a source ("from our beta pilots" / "based on X reports drafted") a careful expert reads it as marketing fiction.
**Fix:** Either add a source attribution parenthetically ("across N beta drafts") or reframe as the claim the expert can verify: "Most experts tell us report drafting is 3–5 hours they can't bill. We built the tool around getting that back." Making the expert the authority on the estimate defuses the credibility challenge.

### [P1] Confidentiality card is present but thin — "zero-retention path" is unexplained
**Impact:** "Zero-retention path with our model provider" is the most important privacy claim but it's a phrase, not a proof. Experts handling case files under protective order need more than a sentence.
**Fix:** Add a short inline explainer: what "zero-retention path" means operationally (data not used for training, not stored beyond session, provider contractually bound). Optionally link to a /privacy or /security page. The current 25-word card is insufficient for the audience's risk calibration.

### [P1] Sample report link is present but deprioritized — it's the best objection-killer available
**Impact:** /sample is surfaced once in the hero (small blue text link) and once in nav. For a conservative expert, seeing a real output is far more persuasive than any copy. It should be a primary CTA, not a secondary footnote.
**Fix:** Promote the sample link to a visually distinct CTA button in the hero alongside the waitlist form. Label it "See a real Rule 26 report + Disclosure Appendix →" in a bordered secondary button style, not inline text. Also surface it at the bottom of the "How it works" section.

### [P1] No founder/team credibility signal anywhere on the page
**Impact:** This is a trust-sensitive, conservative professional audience. Forensic experts want to know who built this and whether they understand expert-witness work. A tool from "some startup" is dismissed; a tool from someone with litigation-support, legal-tech, or forensic background is considered.
**Fix:** Add 1–2 sentences of founder context in the final CTA band or footer: "Built by [name/background, e.g., legal-tech engineer who spent 5 years building litigation-support software]." Even minimal honest context beats none. No fake bios; even "a team with experience in litigation support" is better than silence.

### [P2] Design-partner program is only mentioned in the final CTA — not positioned as a feature
**Impact:** "Design partner" is actually valuable to the right expert (influence over template, early access). But it only appears in a single paragraph at the bottom. Skeptics who scroll past the hero without converting never see the pitch.
**Fix:** Add a "Design Partners" Pill to the hero alongside the existing pills. Reference it in the nav or as a subtle band above the final CTA so it surfaces mid-funnel. Frame it explicitly: "6 discipline slots open — help define the Rule 26 template for vocational rehabilitation experts."

### [P2] "Discoverable" stat in the "why now" triptych is confusing — double meaning
**Impact:** "Discoverable" means "subject to discovery" (legal sense) and also "findable." The body copy clarifies intent but the headline word creates a half-second of confusion in a skeptical read. For a legal audience, ambiguity on a term with formal legal meaning erodes trust.
**Fix:** Replace the headline with "Discovery-proof" or "Already disclosed" to be unambiguous. Or use "AI use is now discoverable" as a phrase to add the legal context upfront.

### [P2] Waitlist form: discipline dropdown is optional but collecting it has high strategic value — nudge harder
**Impact:** Knowing discipline distribution is critical for design-partner prioritization and template roadmap. Currently presented as "(optional)" with no framing. Most users will skip it.
**Fix:** Add a one-line nudge: "Telling us your discipline helps us prioritize the template for your field." Or make it required with a friendly label, since it has zero friction and high product value.

### [P3] "Most popular" label on Active Expert tier is misleading pre-launch with no user data
**Impact:** This violates honest social-proof standards (pre-launch, no real usage data). "Most popular" on a product nobody has used yet is a dark pattern. If challenged, it could surface in the kind of professional forum where this audience lives.
**Fix:** Replace with "Best value" or "Recommended for solo practitioners" — descriptive labels that make a claim you can defend without needing user data.

### [P3] Footer copy is good but the page has no "About" or "Who we are" link
**Impact:** Conservative experts who want to vet the company have no path to learn more. A bare footer with no About page signals either a brand-new solo founder or something to hide.
**Fix:** Add "About" link in nav or footer pointing to a minimal /about page (even 2–3 sentences). Attainable pre-launch, high trust signal.

---

## Recommended Section Order (for skeptical forensic expert)

Current order: Nav → Hero → Why Now (3 stats) → How It Works → AI-Disclosure → Guardrails → Rule 26 grid → Pricing → Final CTA → Footer

**Recommended order:**

1. **Nav** — add "Sample Report" as primary nav item (already there, good); add "About" link
2. **Hero** — rewrite headline to lead with expert authorship + ethical frame; promote /sample to secondary CTA button
3. **Why Now / Discovery risk** — keep 3-stat triptych, fix "Discoverable" ambiguity; add 1 line of context on the May 2026 court order to anchor urgency
4. **Cross-Exam Ready FAQ band** [NEW] — 3 Q&A pairs rehearsing the deposition answers; this is the #1 missing section
5. **How It Works** (3 steps) — current content is good; add sample report link at bottom of section
6. **AI-Disclosure Appendix** (dark section) — current content strong; add 1 sentence naming the cross-exam implication
7. **Guardrails / Trust** (4 cards) — expand Confidentiality card with operational detail
8. **Rule 26 Coverage grid** — keep; strong signal to the technical audience
9. **Pricing** [simplified to 2 options pre-launch] — collapse 4 tiers; surface "Design Partner" option as alternative to standard waitlist
10. **Design Partner band** [NEW or expanded] — name the open slots, name the disciplines, frame the ask explicitly
11. **Final CTA / Waitlist** — add founder credibility 1–2 sentences; make discipline required
12. **Footer** — add About link

---

## Top 3 Must-Fix

1. **[P0] Add a "Cross-Exam Ready" FAQ section** — the deposition objection is the conversion killer for this audience and nothing on the page addresses it directly. Three honest Q&A pairs ("Did AI write your report?", "Are citations hallucinated?", "Is this methodology?") would resolve the #1 unstated fear.

2. **[P0] Rewrite hero headline to lead with expert authorship and defeat the ethics objection in 8 words** — the current headline is accurate but lets a skeptic interpret it as "AI writes your report." The fix is a frame shift, not a new feature.

3. **[P0] Collapse pricing to 2 pre-launch options and remove "Most popular" label** — 4 tiers with fabricated social-proof signals is analysis paralysis plus an honest-branding risk. For a waitlist conversion goal, the only decision the visitor needs to make is: "try one report" vs. "become a design partner."
