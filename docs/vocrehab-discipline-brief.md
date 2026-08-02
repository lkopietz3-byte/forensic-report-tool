# Vocational-Rehab Discipline Brief — for the design-partner conversation

Research-backed briefing (fact-checked web research, 2026-07-03) so the founder can
(a) verify Disclosed. is discipline-correct and (b) sound credible to a CRC/ABVE
vocational-rehab expert. Pairs with `discovery/vocrehab-template-spec.md`.

## Verdict: the product is discipline-SOUND on the fundamentals (and hardened past a deeper audit)

An audit against the field's "coder-wandered-in" tells came back clean:
- Uses **"evaluee"** (not client/patient — in forensic work a CRC has NO client).
- Attributes **RAPEL to Weed** (not McCroskey — McCroskey's system is **MVQS**, separate); getting this wrong "destroys credibility instantly."
- **Neutral** framing — no advocacy language ("strengthen your case," "maximize").
- Never claims the tool "writes/drafts/generates" the opinion.
- Correctly separates **earning capacity** (prospective ABILITY, a **range**) from **lost earnings** (retrospective wages), and **defers present-value to the economist**.

**A second, deeper multi-agent audit (2026-07-03) went past the fundamentals and found five real credibility gaps — all now fixed:**
1. The worked sample asserted a **labor-force-participation figure as a disability-category average**, mis-grounded to the physician's lifting restriction — i.e., the demo contained the exact ipse-dixit defect the product exists to prevent. → now deferred to `[Expert input needed]` (worklife source named, or hand off to the economist).
2. The sample's TSA attributed **SVP/GED worker traits to O*NET**; only the **DOT** supplies them. → rewritten to name the DOT as the source and O*NET-SOC as the cross-walk target; a template coverage prompt now enforces it.
3. The sample never stated the **evaluee's age** (load-bearing for a work-capacity opinion). → added.
4. No **apportionment** prompt (pre-existing/coexisting condition vs. the work injury — the defense's standard opening). → added to `functional_capacity`.
5. No **placeability** prompt (jobs *exist* ≠ this evaluee gets *hired*) and no **future-incapacity-needs-a-medical-anchor** guard (*Korbe*). → both added.

Confidence is HIGH on the fundamentals and materially higher after these fixes. The honest limit is unchanged: it is **desk-research-validated, not expert-validated** — final methodology sign-off is exactly what the design partner is for (see open questions at the end).

## Terminology & concepts you MUST get right

- **Evaluee**, not client/patient. Load-bearing single word.
- **Earning capacity ≠ lost earnings.** Capacity = the ability to earn over the remaining worklife, expressed as a **range**, "regardless of what the pay stub shows." Lost earnings = documented past wage loss. Never imply a paystub-driven number.
- **RAPEL is Roger Weed's** five-part framework (R Rehabilitation plan · A Access/transferable skills · P Placeability · E Earning capacity · L Labor-force participation). **McCroskey = MVQS** (a separate computerized job-person matching system). Don't blend them.
- **Present value of the loss is the economist's job**, not the vocational expert's — the report should hand off with `[Expert input needed: …economist…]`.

## The methodology (so you can follow an expert's reasoning)

- **RAPEL (Weed)** — the dominant, peer-reviewed, court-accepted organizing framework; cited as satisfying Daubert.
- **TSA (Transferable Skills Analysis)** — a formal, data-driven procedure (NOT a judgment call): maps prior work to occupations via **DOT worker traits** (SVP, GED, aptitudes, MPSMS, Data/People/Things), using **OASYS/SkillTRAN** and the **O*NET–DOT crosswalk**. Rule of thumb: occupations below SVP 3 aren't "transferable."
- **LMS (Labor Market Survey)** — the critical distinction: job **INCIDENCE** (how many such jobs exist, from BLS OEWS) is NOT job **AVAILABILITY** (are openings actually open/accessible for THIS person — requires documented sources, date ranges, and **direct employer contact**).
- **Data sources:** DOT (1991, officially abandoned by DoL for O*NET — but STILL used for SVP/GED worker traits because O*NET can't do defensible person-job matching; don't call O*NET a simple "upgrade"). **BLS OEWS** wages → report **percentiles** and the **median** (not mean). Records review draws on **multiple** sources (tax returns, W-2s, SSA earnings statement, FCE, medical) — never single-source.

## Case law to know BY NAME (experts and opposing counsel do)

- **Elcock v. Kmart**, 233 F.3d 734 (3d Cir. 2000) — the seminal voc-rehab exclusion; a self-made "hybrid" method was excluded. Lesson: name a **recognized** method (RAPEL), don't invent one.
- **Kohls v. Ellison** (2025) — an expert used ChatGPT; the report had **hallucinated citations** and his testimony was **excluded entirely**. THE cautionary tale — and precisely the risk Disclosed. neutralizes.
- **Matter of Weber** (2025) — expert's LLM use scrutinized.
- **Korbe v. Manchester** (D. Colo. 2024) — voc opinion **struck for lacking medical foundation** (restrictions must trace to a medical source).
- **Kumho Tire / GE v. Joiner** — the **ipse dixit / "analytical gap"** doctrine: an opinion connected to data "only by the ipse dixit of the expert" is excludable. **Ipse dixit is the #1 exclusion ground.**
- **Dec 1, 2023 FRE 702 amendment** — proponent must show each element "more likely than not," and 702(d) now requires a **reliable APPLICATION** of the method.
- **Proposed FRE 707** — would subject machine-generated evidence to the same 702/Daubert bar (why AI-disclosure matters now).

## Ethics (CRCC Code — experts live by this)

- **No contingency fees** (G.4.a); fee via retainer.
- **Decline** cases that ask you to support a predetermined position (G.3.a) → **objectivity/neutrality** is mandatory.
- **Validity of resources** consulted must be "valid, current, and cited" (G.2.d).
- The opinion is the expert's **"personal, nondelegable responsibility"** — nobody/nothing else can author it.
- Dual-role restrictions (a treating counselor generally shouldn't be the retained forensic evaluator).

## Credentials (credibility signals)

CRC (via CRCC) · **ABVE/F** (Fellow — 3 yrs forensic) · **ABVE/D** (Diplomate) · CVE · CLCP · IARP membership.

## The AI red flags that instantly LOSE an expert

- Any implication the software **"writes / drafts / generates / authors"** the opinion → triggers "did a machine write this?" + violates nondelegable responsibility. Say **"structures/organizes the expert's own analysis and evidence."**
- **Advocacy** framing → signals you don't understand their required neutrality.
- Any fluent, authoritative-sounding conclusion with **no cited data** underneath → the ipse-dixit / Kohls failure mode.

## The killer questions an expert WILL ask — and your answers

- **"Does it write my opinions?"** → No. It structures *your* findings; you author every word. It cannot originate a fact, number, or citation — closed-world grounding blocks it and the export **refuses** any ungrounded sentence.
- **"Will it invent citations like the expert in Kohls?"** → It *can't*. It may only cite evidence you supplied; every factual sentence must trace to a source or it's flagged, and export is hard-blocked on any ungrounded/invalid cite.
- **"If opposing counsel asks how I used AI, am I exposed?"** → That's the whole point: it produces a **tamper-evident AI-disclosure record** you can produce in discovery — and anyone (opposing counsel, the court) can **independently verify** it at `/verify`. You get ahead of the Kohls/FRE-707 risk.
- **"Does it do the TSA / earning-capacity / restrictions for me?"** → No. You make every judgment (which occupations transfer, the capacity range, the adopted restrictions). It formats and runs a Rule-26 completeness check. (This is the hard guardrail in the spec.)
- **"Is my case data trained on / safe?"** → No training on your data (Anthropic API default); described as commitments, not certifications (honest — no SOC 2 claimed).

## Strengths an expert would respect (lead with these)

- **Closed-world grounding is the direct antidote to the #1 exclusion (ipse dixit) and to Kohls-style hallucination.** This is your strongest, most discipline-literate feature.
- The **AI-disclosure record + `/verify`** gets ahead of the exact risk they fear (FRE 707, Kohls, discoverable AI methodology).
- The template is **RAPEL-correct and Rule-26-mapped**; the sample **defers PV to the economist** and expresses **capacity as a range**.

## Honest limits → the open questions for the design partner

These genuinely need an expert (from `vocrehab-template-spec.md`) — bring them as *your* questions; it signals rigor + humility:
1. Is the 19-section granularity right, or do experts collapse some (e.g. merge Records Reviewed into Facts/Data Considered)?
2. Exact **TSA tier-label** wording courts/experts expect.
3. Where the **economist hand-off** actually sits (present-value of the loss).
4. Which sections are boilerplate vs. heavily customized.
5. Does the TSA section push for **specific DOT/O*NET codes + SVP levels** (not generic occupation names) in a real case? (The sample's redirect occupations are illustrative — confirm the template forces that specificity.)
