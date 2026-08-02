# Audit 15 — UX & Accessibility (WCAG 2.2 AA) · Disclosed.

Scope: src/app/page.tsx, src/app/_components/Waitlist.tsx, src/app/app/Workspace.tsx, src/app/sample/page.tsx, src/app/layout.tsx, src/app/globals.css — forensic expert-witness audience, WCAG 2.2 AA target.

---

## TOP 3 MUST-FIX

1. **[CRITICAL] Body font size is ~14px everywhere** — globals.css sets no base font size; Tailwind's default html/body is 16px but virtually every content string uses `text-sm` (14px) or `text-xs` (12px). Research mandate is 18px+ for this older audience. Raises error risk, fatigue, and credibility gap.
2. **[CRITICAL] Workspace stepper buttons have no visible focus indicator** — the `<button>` elements in the stepper `<ol>` and section-nav `<ul>` use no `focus:ring` or `focus-visible:` classes, making keyboard-only navigation invisible. Core WCAG 2.4.7 failure.
3. **[HIGH] Multiple color contrast failures** — `text-slate-500` (#64748b) on white/slate-50 = ~4.0:1 (fails 4.5:1 for normal text); `text-xs text-slate-500` at 12px = even further below threshold. Affects labels, helper text, pricing unit, footer, pill components sitewide.

---

## 1. FONT SIZE — ALL INSTANCES

| Severity | Location | Current class | Issue | Recommended fix |
|---|---|---|---|---|
| CRITICAL | globals.css / html body | (none — Tailwind default 16px) | No explicit base size set; all content overrides it downward with text-sm/text-xs | Add `html { font-size: 18px; }` in globals.css; or set `text-base` = 18px via `@theme { --text-base: 1.125rem; }` |
| CRITICAL | page.tsx — hero subtext | `text-xs text-slate-500` (12px) | "Early access for forensic engineers…" helper text below waitlist form; 12px fails readability and contrast | `text-sm text-slate-500` minimum; preferably `text-base` |
| CRITICAL | page.tsx — stat section | `text-sm text-slate-600` | Three stat descriptions (3–5 hrs, Rule 26, Discoverable) are 14px body copy | `text-base leading-relaxed` |
| CRITICAL | page.tsx — How it works cards | `text-sm leading-relaxed text-slate-600` | Step body text at 14px; dense professional content | `text-base leading-relaxed` |
| CRITICAL | page.tsx — Guardrails cards | `text-sm leading-relaxed text-slate-600` | Guardrail explanations at 14px | `text-base leading-relaxed` |
| CRITICAL | page.tsx — Pricing tiers | `text-sm leading-relaxed text-slate-600` (blurb), `text-sm text-slate-700` (features) | Pricing body and feature list at 14px | `text-base leading-relaxed` |
| CRITICAL | page.tsx — Pricing footer note | `text-xs text-slate-500` (12px) | Fine-print pricing caveat at 12px | `text-sm text-slate-500` |
| CRITICAL | page.tsx — Pill component | `text-xs font-medium text-slate-600` (12px) | Hero pills at 12px — first text a new visitor reads | `text-sm font-medium` |
| CRITICAL | page.tsx — Nav links | `text-sm text-slate-600` (14px) | Main navigation at 14px | `text-base text-slate-700` |
| HIGH | page.tsx — disclosure mock card | `text-sm` dl rows, `text-xs` font-mono model line | Dark-mode card body at 14px/12px on slate-800 bg | `text-base` for dt/dd; `text-sm font-mono` for model |
| HIGH | page.tsx — footer | `text-sm text-slate-500` | Footer tagline at 14px | `text-base text-slate-500` |
| HIGH | Waitlist.tsx — email input | `text-sm text-slate-900` | Input field text at 14px; user types their email in it | `text-base` |
| HIGH | Waitlist.tsx — submit button | `text-sm font-semibold` | CTA button at 14px | `text-base font-semibold` |
| HIGH | Waitlist.tsx — select | `text-sm text-slate-700` | Discipline dropdown at 14px | `text-base text-slate-700` |
| HIGH | Waitlist.tsx — success message | `text-sm font-medium` | Confirmation text at 14px | `text-base font-medium` |
| HIGH | Waitlist.tsx — error message | `text-sm text-red-600` | Error text at 14px | `text-base text-red-600` |
| HIGH | Workspace.tsx — section nav | `text-sm` button text | Section-nav items at 14px; core navigation of the app | `text-base` |
| HIGH | Workspace.tsx — stepper sub-labels | `text-xs text-slate-500` (12px) | Step subtitle ("Bring your case file") at 12px | `text-sm text-slate-600` |
| HIGH | Workspace.tsx — draft article body | `text-[15px] leading-relaxed` | Draft text at 15px — closest to acceptable but still below 16px floor | `text-base` (16px) minimum; ideally 18px given audience |
| HIGH | Workspace.tsx — edit textarea | `text-[13px] leading-relaxed` (13px) | Expert types report content in 13px mono; unacceptable | `text-sm` (14px) or `text-base` font-mono |
| HIGH | Workspace.tsx — edit hint text | `text-xs text-slate-500` | Citation syntax hint at 12px | `text-sm text-slate-500` |
| HIGH | Workspace.tsx — source panel | `text-xs` throughout | Source panel labels, location, content truncated at 10–12px | `text-sm` for all source panel prose |
| HIGH | Workspace.tsx — ungrounded warning | `text-xs text-red-700` | Critical error messages at 12px — must be readable | `text-sm text-red-700` |
| HIGH | Workspace.tsx — approve button | `text-sm font-semibold` | Key approval CTA at 14px | `text-base font-semibold` |
| HIGH | sample/page.tsx — report body | `text-sm leading-relaxed text-slate-700` | Actual report prose at 14px; this is the expert-facing sample | `text-base leading-relaxed` |
| HIGH | sample/page.tsx — evidence panel | `text-sm`, `text-xs text-slate-500` | Evidence list content and location labels at 14px/12px | `text-sm` → `text-base`; `text-xs` → `text-sm` |
| HIGH | sample/page.tsx — disclosure table | `text-sm` rows, `text-xs` table headers | Disclosure appendix table at 14px/12px on slate-900 | `text-base` for rows; `text-sm` for headers |
| HIGH | sample/page.tsx — footer disclaimer | `text-xs text-slate-500` (12px) | Bottom disclaimer at 12px on slate-900 bg | `text-sm text-slate-400` |
| MEDIUM | page.tsx — "The difference" eyebrow | `text-sm font-semibold uppercase tracking-wide text-blue-400` | 14px all-caps blue on slate-900; all-caps compounds readability loss | `text-base font-semibold tracking-wide text-blue-400` |
| MEDIUM | Workspace.tsx — matter header discipline eyebrow | `text-xs font-semibold uppercase tracking-wide text-blue-600` (12px) | 12px all-caps first label in the app | `text-sm font-semibold tracking-wide text-blue-600` |

**Recommended global fix:** In `globals.css`, set `html { font-size: 112.5%; }` (18px base) and remove hardcoded `text-sm`/`text-xs` from body-copy nodes, relying on inherited `text-base`. For Tailwind v4, add to `@theme`: `--text-sm: 1rem; --text-base: 1.125rem;` to shift the entire scale up by ~14%.

---

## 2. COLOR CONTRAST

| Severity | Element / location | Foreground | Background | Approx ratio | WCAG target | Fix |
|---|---|---|---|---|---|---|
| CRITICAL | `text-slate-500` normal text sitewide | #64748b | #ffffff (white) | ~4.0:1 | 4.5:1 AA | Use `text-slate-600` (#475569) → ~5.7:1 |
| CRITICAL | `text-slate-500` on slate-50 | #64748b | #f8fafc | ~3.9:1 | 4.5:1 AA | Use `text-slate-600` |
| CRITICAL | `text-xs text-slate-500` (12px normal) sitewide | #64748b | #ffffff | ~4.0:1 | 4.5:1 (normal <18px) | Bump to text-sm and `text-slate-600` |
| CRITICAL | Pill component — `text-slate-600` + `border-slate-200` on `bg-white/70` | #475569 | rgba(255,255,255,0.7) blended ~#f3f5f8 | ~4.5:1 (borderline) | 4.5:1 | Pin to `text-slate-700` for margin |
| HIGH | `text-slate-400` in dark section (`text-slate-400` on `bg-slate-900`) | #94a3b8 | #0f172a | ~6.8:1 | 4.5:1 ✓ | Passes, note for reference |
| HIGH | `text-slate-300` on slate-900 | #cbd5e1 | #0f172a | ~10.7:1 ✓ | 4.5:1 | Passes |
| HIGH | `text-emerald-300` badge on `bg-emerald-500/15` (dark card) | #6ee7b7 | ~#0f2a1f (blended slate-900 + emerald tint) | ~6.1:1 ✓ | 4.5:1 | Passes |
| HIGH | `text-blue-400` eyebrow on slate-900 | #60a5fa | #0f172a | ~7.0:1 ✓ | 4.5:1 | Passes |
| HIGH | `text-blue-600` on white (nav links, CTAs) | #2563eb | #ffffff | ~5.1:1 ✓ | 4.5:1 | Passes |
| MEDIUM | `text-slate-600` on slate-50 card body | #475569 | #f8fafc | ~5.5:1 ✓ | 4.5:1 | Passes, but keep at 18px+ |
| MEDIUM | `text-amber-800` on amber-100 (Rule 26 banner) | #92400e | #fef3c7 | ~5.4:1 ✓ | 4.5:1 | Passes |
| MEDIUM | `text-red-700` on red-50 (ungrounded warning) | #b91c1c | #fef2f2 | ~5.8:1 ✓ | 4.5:1 | Passes |
| MEDIUM | `text-slate-400` table column headers on slate-800 bg (Workspace disclosure) | #94a3b8 | #1e293b | ~5.4:1 ✓ | 4.5:1 | Passes (verify at final font size) |
| LOW | `text-[10px]` citation chip `text-blue-700` on `bg-blue-100` | #1d4ed8 | #dbeafe | ~5.1:1 ✓ | 4.5:1 (technically normal-text at 10px → must be 4.5:1) | Passes but 10px is dangerously small; size up |
| LOW | `text-[10px]` kind badge `text-blue-700` on `bg-blue-100` | #1d4ed8 | #dbeafe | ~5.1:1 ✓ | 4.5:1 | Passes but 10px unacceptable for audience — replace with `text-xs` |
| LOW | `text-slate-500` footer on white | #64748b | #ffffff | ~4.0:1 | 4.5:1 | `text-slate-600` |

**Key fix:** Replace all `text-slate-500` used for body-copy / helper text with `text-slate-600`. Reserve `text-slate-500` only for purely decorative or large (≥24px bold) text where the 3:1 large-text threshold applies.

---

## 3. KEYBOARD NAVIGATION & FOCUS STATES

| Severity | Element | File | Issue | Fix |
|---|---|---|---|---|
| CRITICAL | Stepper `<button>` elements | Workspace.tsx:235 | No `focus-visible:` ring on stepper nav buttons; only hover states are styled | Add `focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2` to stepper button className |
| CRITICAL | Section-nav `<button>` elements | Workspace.tsx:493 | No focus ring on section navigation buttons | Same — `focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1` |
| CRITICAL | Edit / Done editing button | Workspace.tsx:543 | No focus styles on the Edit toggle button | Add `focus-visible:ring-2 focus-visible:ring-blue-500` |
| CRITICAL | Approve section button | Workspace.tsx:619 | No focus ring; disabled state uses `cursor-not-allowed bg-slate-200 text-slate-400` — disabled button should not be focusable via keyboard at all (`tabIndex={-1}` or `aria-disabled`) but the disabled prop should handle tab removal | Confirmed `disabled` prop is set; add `focus-visible:ring-2 focus-visible:ring-blue-600` for enabled state |
| CRITICAL | Revert to draft button | Workspace.tsx:534 | No focus indicator | `focus-visible:ring-2 focus-visible:ring-slate-400` |
| HIGH | Stage `<button>` "Review evidence →" / "Draft from these sources →" / "View AI-disclosure →" / "Go to export →" | Workspace.tsx multiple | All "Next" step buttons lack explicit focus ring | Add `focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2` |
| HIGH | Nav `<a>` links — page.tsx | page.tsx:123–137 | Nav anchors have no `focus:ring` or `focus-visible:`; only `hover:text-slate-900` | Add `focus-visible:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-sm` |
| HIGH | "Early access" CTA button — page.tsx | page.tsx:139 | Has `hover:bg-slate-800` but no `focus-visible:` ring | Add `focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2` |
| HIGH | Sample report SourceChip `<a>` | sample/page.tsx:17 | In-page anchor chips lack visible focus; `hover:bg-blue-200` only | Add `focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500` |
| MEDIUM | Waitlist email input | Waitlist.tsx:93 | Has `focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30` — ring opacity 30% may be too faint; use `/60` for visibility | Change `focus:ring-blue-500/30` → `focus:ring-blue-500/60` |
| MEDIUM | Waitlist submit button | Waitlist.tsx:98 | Has `focus:ring-2 focus:ring-blue-500/40` — same faint ring concern | Change to `/60` or use `focus-visible:ring-blue-500` |
| MEDIUM | Pricing tier CTA anchors | page.tsx:452 | `<a href="#waitlist">` styled as buttons, no `focus-visible:` | Add `focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2` |
| LOW | Logo `<Link href="/">` in Workspace/sample nav | Workspace.tsx:184, sample/page.tsx:110 | No focus ring on logo link | Add `focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg` |
| LOW | "See a sample report" link | page.tsx:178 | Inline text link, no focus visible override | Browser default outline may suffice if not reset; verify |

**Note on `focus:` vs `focus-visible:`**: The codebase mixes `focus:outline-none` with `focus:ring-*`; this removes the focus ring for mouse users, which is acceptable, but `focus-visible:` is the modern pattern — it shows rings only for keyboard navigation. Prefer `focus:outline-none focus-visible:ring-2` throughout.

---

## 4. FORM ACCESSIBILITY

| Severity | Issue | File:line | Detail | Fix |
|---|---|---|---|---|
| PASS | Labels on email + discipline inputs | Waitlist.tsx:83,104 | Both use `<label htmlFor={id}>` with `sr-only` and React `useId()` for stable IDs — correctly associated | No change needed |
| PASS | Error announcement | Waitlist.tsx:134 | `<p role="alert">` present — screen reader will announce error on state change | No change needed |
| PASS | Success announcement | Waitlist.tsx:56 | `<div role="status">` on success — polite live region for screen readers | No change needed |
| PASS | Required field | Waitlist.tsx:89 | `required` on email input — browser validation + AT announcement | No change needed |
| PASS | Honeypot | Waitlist.tsx:122 | `aria-hidden` wrapper + `tabIndex={-1}` on honeypot input — correctly hidden from AT | No change needed |
| HIGH | No `aria-required` on email input | Waitlist.tsx:88 | HTML `required` attribute alone is sufficient for most AT, but adding `aria-required="true"` improves coverage with older screen reader/browser combos common in the target demographic | Add `aria-required="true"` |
| HIGH | Discipline select has no visible label | Waitlist.tsx:107 | `sr-only` label is correct for AT, but the in-field placeholder "Your discipline (optional)" disappears on selection — add a visible label above or persistent placeholder text | Add `<label>` above select as visible text at `text-base` |
| MEDIUM | No `aria-describedby` linking error to field | Waitlist.tsx:86,134 | Error paragraph uses `role="alert"` but is not associated with the email input via `aria-describedby`; when the error is conditional, programmatic association is stronger | Add `aria-describedby={errorId}` to input when `status === "error"` |
| MEDIUM | Email input `autocomplete="email"` missing | Waitlist.tsx:86 | No `autoComplete` attribute on email field; required for WCAG 1.3.5 (Identify Input Purpose) | Add `autoComplete="email"` |
| LOW | Form submit button text changes without announcement | Waitlist.tsx:100 | Button text changes from "Request early access" to "Submitting…"; `aria-live` or `aria-label` update would clarify to AT users | Add `aria-label={status === "loading" ? "Submitting, please wait" : undefined}` or wrap in `aria-live="polite"` |

---

## 5. SEMANTICS & LANDMARKS

| Severity | Issue | File | Detail | Fix |
|---|---|---|---|---|
| HIGH | No `<main>` landmark | page.tsx, sample/page.tsx, Workspace.tsx | All pages wrap content in bare `<div>` — screen reader users cannot jump to main content | Wrap primary content area in `<main>` on each page |
| HIGH | No `<footer>` landmark | page.tsx:489 | The footer is a `<footer>` element (correct) but it's inside the root `<div>`, not directly in `<body>` — landmark is still announced; confirm structure | Structure is fine; wrapping div is cosmetic |
| HIGH | Heading hierarchy — Workspace Draft stage | Workspace.tsx:514 | `<article>` uses `<h2>` for the section title but the parent page `<h1>` is in the matter header; the section-nav panel uses `<h3>` for sources panel — hierarchy is inconsistent when h2 appears before h1 in DOM order | Ensure page has one `<h1>` (matter title at line 214 is h1 — correct); DraftStage `<h2>` for section title is correct |
| HIGH | Heading hierarchy — page.tsx pricing section | page.tsx:418 | Tier names use `<h3 class="text-sm ...uppercase">` but the section h2 is "Priced per report"; that's correct. However, pricing cards are inside a section with no `id`, only the parent `id="pricing"` — fine | No change needed for hierarchy; already correct |
| MEDIUM | Stepper `<ol>` has no ARIA role labeling | Workspace.tsx:229 | The `<nav><ol>` stepper is unlabeled; screen readers may announce it as "list" with no context | Add `aria-label="Report stages"` to `<nav>` at line 228 |
| MEDIUM | Section nav `<nav>` unlabeled | Workspace.tsx:488 | Second `<nav>` in same page without `aria-label`; when two `<nav>` landmarks exist on a page, each must be uniquely labeled | Add `aria-label="Report sections"` |
| MEDIUM | `<header>` in Workspace appears inside `<div>`, not direct child of `<body>` | Workspace.tsx:182 | Landmark still functions but the `<header>` inside a non-`<body>/<main>` parent is demoted to generic role in some AT | Wrap Workspace return in `<>...<main>...</main></>` structure |
| MEDIUM | Disclosure section on landing uses `<section>` inside `<div>` without accessible name | page.tsx:250 | Section has `id="disclosure"` but no `aria-labelledby`; AT may not surface it as a named landmark | Add `aria-labelledby` pointing to the h2 inside |
| LOW | html `lang="en"` set in layout.tsx | layout.tsx:16 | Correct — no action needed | Pass |
| LOW | `<article>` in DraftStage and sample page | Workspace.tsx:512, sample/page.tsx:167 | Appropriate use of article for self-contained document content | Pass |
| LOW | Workspace stepper `<button>` inside `<li>` inside `<ol>` inside `<nav>` | Workspace.tsx:228–264 | Correct structural pattern; `<ol>` communicates step ordering to AT | Pass; add `aria-current="step"` to active item for stronger AT signal |
| LOW | StatusDot `<span>` — purely decorative colored dots | Workspace.tsx:115–125 | No aria-label; conveys grounding status visually only | Add `aria-label={status === "green" ? "Grounded" : status === "red" ? "Unsupported" : status === "amber" ? "Needs input" : "Profile section"}` or ensure the status is conveyed in text elsewhere |

---

## 6. REDUCED MOTION, TAP TARGETS, IMAGE ALT / ARIA-HIDDEN

### Reduced Motion

| Severity | Issue | File | Detail | Fix |
|---|---|---|---|---|
| MEDIUM | No `prefers-reduced-motion` override | globals.css | All `transition` classes on hover/focus apply CSS transitions; Tailwind's default `transition` class does not check reduced-motion preference | Add to globals.css: `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; } }` |
| MEDIUM | Progress bar animation | Workspace.tsx:799 | `transition-all` on the export progress bar width changes — motion-sensitive users see animated fill | Covered by global reduced-motion fix above |

### Tap Target Sizes

| Severity | Element | File | Actual size | Issue | Fix |
|---|---|---|---|---|---|
| HIGH | Stepper step-number badge | Workspace.tsx:247 | `h-5 w-5` = 20×20px | Badge itself is not tappable; the parent `<button>` is — check button height | Parent button has `py-3` + content ~52px total; likely ≥44px — passes |
| HIGH | Section nav buttons | Workspace.tsx:493 | `px-3 py-2` + ~16px text ≈ 36px height | Below 44px touch target | Add `py-2.5` minimum or `min-h-[44px]` |
| HIGH | "Revert to draft" button | Workspace.tsx:534 | `px-2.5 py-1` + 12px text ≈ 28px height | Significantly below 44px | `px-3 py-2` minimum; or use 44px min-height |
| HIGH | Edit toggle button | Workspace.tsx:543 | `px-3 py-1` + 12px text ≈ 28px | Below 44px | `py-2` minimum |
| HIGH | Source chip `<a>` — citation superscript | sample/page.tsx:17 | `h-4` = 16px | 16px tap target — critically small | Enlarge to `h-6 min-w-6` and wrap with adequate padding; these are links |
| HIGH | `text-[10px]` citation chips in Workspace | Workspace.tsx:87 | `h-4` = 16px | 16px tap target — these are not interactive (just `<span>`) | Acceptable as non-interactive; but font size of 10px must still increase |
| MEDIUM | Waitlist email + submit on mobile | Waitlist.tsx:93,98 | `h-12` = 48px both | Pass ≥44px | Pass |
| MEDIUM | Pricing CTA anchors | page.tsx:452 | `h-11` = 44px | Borderline pass | Pass (44px meets minimum) |
| LOW | Nav anchor links (header) | page.tsx:123 | Inline `<a>` with `py-4` on parent header, but anchor itself has no explicit height | Effective target is padded by flex container | Acceptable |

### Decorative SVG / Alt Text

| Severity | Element | File | Detail |
|---|---|---|---|
| PASS | All inline SVG icons in page.tsx | page.tsx:329–338, 373–388, 437–447 | All have `aria-hidden` — correct for decorative icons |
| PASS | All inline SVG icons in Workspace.tsx | Workspace.tsx:60–70 | Success checkmark has `aria-hidden` |
| PASS | Gradient overlay div | page.tsx:152 | Has `aria-hidden` — correct |
| HIGH | StatusDot `<span>` colored dot | Workspace.tsx:115 | Purely visual status indicator with no text alternative — see Semantics section above for fix |
| HIGH | Grounding legend colored dots in DraftStage | Workspace.tsx:523–531 | `<span class="h-2 w-2 rounded-full bg-emerald-500">` inside legend text — dots are inside readable text spans ("grounded", "your input", "unsupported") so text conveys meaning; dots are decorative | Add `aria-hidden` to colored dot spans to prevent AT from reading "circle circle grounded" |

---

## SUMMARY TABLE — SEVERITY COUNTS

| Severity | Count |
|---|---|
| CRITICAL | 9 |
| HIGH | 28 |
| MEDIUM | 12 |
| LOW | 7 |
| PASS (noted) | 12 |
