# Visual Design & Brand Credibility Audit

**Scope:** Landing page (`page.tsx`), sample report (`sample/page.tsx`), app workspace (`app/Workspace.tsx`), global styles (`globals.css`), and layout (`layout.tsx`). Audience: senior forensic expert witnesses and retaining litigators.

---

## Findings

### [HIGH] Logo/wordmark is placeholder-grade, not finished
The "D" logo is a plain `rounded-lg bg-blue-600` square with a single bold letter "D" in white. This reads as an MVP stand-in. In a market where credibility is the product, a text-in-a-box monogram signals "not yet a real company." The wordmark `Disclosed.` in `text-sm font-semibold` is too small in the nav; it sits at the same visual weight as the nav links.  
**Fix:** Commission or construct an actual SVG mark — even a refined letterform with optical corrections, or a scale/balance motif (subtle legal reference). Increase wordmark to `text-base font-bold` with `tracking-tight`. Consider pairing with a ligature-quality serif for the wordmark only (e.g., `font-serif` wrapper scoped to the brand name).

### [HIGH] No professional typeface loaded — system-sans is not credible enough
`globals.css` has no `@font-face` or Google Fonts import. The entire UI renders in the OS system sans (San Francisco on Mac, Segoe UI on Windows). For a forensic legal tool priced at $200–$6,000/report, this reads as a prototype. System sans is fine for utilities; it undercuts authority for a product whose pitch is "walk into court with this."  
**Fix (low effort):** Add one Google Fonts import in `layout.tsx` — Inter or IBM Plex Sans for body/UI, and a display-weight serif (e.g., `Playfair Display` or `DM Serif Display`) scoped only to H1/H2 headings. This single change dramatically shifts perceived seriousness. Alternatively, use the Tailwind `font-serif` class on headings with `font-feature-settings: 'kern' 1; letter-spacing: -0.02em`.

### [HIGH] blue-600 accent reads "generic SaaS," not "legal-tech"
`blue-600` (#2563eb) is the default Tailwind blue — the exact color of thousands of generic SaaS products. For a conservative legal audience, it signals "template." The trust palette for legal/financial tools skews toward deep navy/ink (`#1e2d4f` range) with a restrained single accent — often a refined slate-blue or even a muted gold.  
**Fix:** Replace `blue-600` with a custom navy — e.g., `#1B3A6B` (deep ink-blue). Replace `blue-50` tint backgrounds with `#EEF2FF` or a warm off-white. Update the "D" logo square and all primary CTAs to match. This requires changing ~20 Tailwind class references from `blue-600`/`blue-700`/`blue-50`/`blue-100` to a custom color token. Keep `emerald-*` for the grounding/verified signals (green = grounded is semantically clear).

### [MEDIUM] The "Verified" badge is gimmicky in its current form
The emerald `bg-emerald-500/15 text-emerald-300` "Verified" pill in the dark disclosure section and `GroundingBadge` components is the right instinct — but the word "Verified" without a qualifier reads as a generic SaaS trust badge (like a startup's social-proof badge). In a court context, forensic experts will immediately ask: verified by whom, per what standard?  
**Fix:** Change the text to "Audit log verified" or "Generated from append-only log." On the landing page mock appendix card specifically, consider replacing "Verified" with a lock/seal SVG icon + "Append-only log" to convey immutability. Reserve the pill for functional status in the app, not marketing.

### [MEDIUM] Heading weight/tracking lacks authority — too light for this audience
All headings use `font-semibold` (600 weight). For a legal-authority aesthetic, primary H1s and section headers benefit from `font-bold` (700) or even `font-extrabold` (800) for the hero — with tighter tracking (`tracking-tight` is already present, but pairing with a slightly heavier weight at large sizes reads as more definitive). The current hero h1 at `text-4xl font-semibold` looks soft compared to how legal publications typeset authority.  
**Fix:** Change `h1` in the hero to `font-bold sm:font-extrabold`. Change landing section `h2` headers to `font-bold`. In the app workspace, the matter title and section headers can remain `font-semibold` — the app surface should be more restrained than the marketing.

### [MEDIUM] Pill components (hero trust labels) are too subtle
The hero pills (`Pill` component: `border-slate-200 bg-white/70 text-xs font-medium text-slate-600`) are correct in concept — referencing "Fed. R. Civ. P. 26(a)(2)(B)" at the top is excellent. But the visual treatment is so light they nearly disappear. On a low-contrast monitor or in print, they read as barely-there whispers.  
**Fix:** Increase pill border to `border-slate-300`, bump text to `text-slate-700`, and consider adding a small icon to the legal-standard pill (a small gavel or scale SVG at `h-3 w-3`). Do not add color fills — keep them white/neutral to stay authoritative.

### [MEDIUM] Missing explicit security/encryption trust mark
"Confidential by commitment" in the Guardrails section mentions encryption but it's buried as body copy. Forensic work involves protected case materials, depositions, and PHI in vocational cases. The absence of a visible security signal (even a padlock icon + "TLS 1.3 + AES-256 at rest" line) in a prominent location is a credibility gap with counsel who will be asked by clients about data handling.  
**Fix:** Add a narrow trust bar below the nav or above the footer: 3–4 small items in a `flex gap-6` strip — `🔒 TLS 1.3 + AES-256 at rest` · `Zero data retention` · `Fed. R. Civ. P. 26(a)(2)(B) compliant output` · `No training on your case data`. Keep it in `text-xs text-slate-500` to stay restrained, not marketing-loud. Use inline SVG icons, not emoji.

### [MEDIUM] Missing credentialing/standards badges on landing
The site currently only references Rule 26 by name. The target audience recognizes specific credentialing touchpoints — RAPEL (vocational), ACTAR (accident reconstruction), ABFSE, SEAK expert witness designation — as proxies for "built for people like me." The absence of any such reference makes the site feel like it was built by engineers who read about forensic experts but haven't spoken to enough of them.  
**Fix (marketing copy, not just visual):** Add a section or sidebar line: "Designed with forensic engineers, vocational rehabilitation experts, and accident reconstructionists. Templates validated against SEAK and ACTAR formatting standards." Even if templates are still being built, referencing the standards being targeted builds trust. Add a `Pill`-style badge: `RAPEL-aware template` or `Built for ACTAR format`.

### [LOW] Radial gradient hero is generic SaaS
The `radial-gradient(60% 50% at 50% 0%, rgba(37,99,235,0.10), transparent)` is correct in being subtle, but the exact same treatment appears on thousands of SaaS sites. With the blue-to-navy pivot, this becomes a deep ink tint that feels more like a courtroom seal than a tech product halo.  
**Fix:** Adjust gradient to use the new navy color token at 8% opacity. Consider replacing the circular halo with a very subtle horizontal rule / border wash at the top (1px border in slate-200 above the hero) — removing the gradient entirely is also valid for a more restrained legal aesthetic.

### [LOW] rounded-2xl cards are slightly too casual for legal-grade
`rounded-2xl` (16px radius) is the standard "friendly SaaS card" radius. Legal and financial products typically use `rounded-lg` (8px) or `rounded-xl` (12px) for document-adjacent UI. The current radius contributes to the "startup template" reading.  
**Fix:** Globally change primary content cards from `rounded-2xl` to `rounded-xl` (or `rounded-lg` for the most conservative areas like the report article in sample/page.tsx). Keep `rounded-2xl` only for CTA panels like the final waitlist section where friendliness is appropriate.

### [LOW] App stepper uses emoji checkmark (✓) — looks unprofessional in context
The stepper in `Workspace.tsx` uses `"✓"` as a string for done states. On some rendering environments this emoji variant looks slightly off; more importantly, inline emoji in a tool presented as court-adjacent looks like a chat app, not professional software.  
**Fix:** Replace `"✓"` string with a 12×12 inline SVG checkmark path (the same one already used elsewhere in the codebase for Rule 26 checklist items). This is a 2-minute copy-paste change.

### [LOW] Page title is generic
`layout.tsx` sets `title: "Court-Defensible Expert Reports"` with no brand name in the title. Browser tabs and search results show no mention of "Disclosed."  
**Fix:** Change to `"Disclosed. — Court-Defensible Expert Reports"` or `"Disclosed. | Expert Report Drafting for Rule 26"`.

### [LOW] Footer tagline undersells
The footer reads: "You author and sign every report. We structure your findings and prove how." This is fine but the second sentence is weak. "Prove how" doesn't land with legal precision.  
**Fix:** "You author and sign every report. We structure your evidence, cite every source, and generate the AI-disclosure record courts now demand."

---

## Quick Wins (ranked by impact-to-effort)

1. **Load a professional typeface** — Add `Inter` (body) + one display serif for H1/H2 via Google Fonts in `layout.tsx`. ~10 minutes, highest single-change visual upgrade.
2. **Swap blue-600 to deep navy** — Define a CSS custom property `--color-brand: #1B3A6B` and do a find-replace on `blue-600`/`blue-700` in all three files. ~20 minutes.
3. **Replace "Verified" badge text** — Change to "Generated from audit log" in the mock appendix card on the landing page. 2-minute copy change, immediate credibility lift.
4. **Add a security/trust strip** — A single `<div>` with 3–4 inline SVG + text items in `text-xs text-slate-500`. ~30 minutes.
5. **Change heading weights** — Hero H1 to `font-bold`, landing H2s to `font-bold`. 5-minute change.
6. **Reduce card radius** — Replace `rounded-2xl` on primary content cards with `rounded-xl`. 10-minute find-replace.
7. **Fix page title** — Add brand name to `layout.tsx` metadata. 1-minute change.
8. **Replace emoji ✓ in stepper** — Swap to inline SVG checkmark. 5 minutes.
9. **Increase Pill contrast** — `border-slate-300 text-slate-700` on `Pill` component. 2 minutes.
10. **Add ACTAR/RAPEL/SEAK reference** — Copy-only addition referencing target certification standards somewhere visible on the landing page.

---

## Overall Assessment

The site is **not toy-like** — the copy is excellent, the Rule 26 / AI-disclosure framing is genuinely differentiated, and the structure is sound. The gap is purely executional: a system-font stack, a default-blue accent, rounded-SaaS card radii, and a placeholder monogram logo collectively signal "another startup template" to a forensic expert who spends their professional life in courtrooms, depositions, and expert certification circles where visual signals of seriousness matter. The fixes above are all low-effort; none require a redesign. The navy + professional typeface + tighter border radius changes alone would move this from "SaaS demo" to "legal-tech credible" in one afternoon of work.
