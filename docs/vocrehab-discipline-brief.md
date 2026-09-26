# Vocational-Rehab Discipline Brief — for the design-partner conversation

Desk-research briefing (2026-07-03) to prepare the founder for discipline
validation with a practicing CRC/ABVE vocational-rehab expert. Pairs with
`discovery/vocrehab-template-spec.md`.

## Desk-research assessment: fundamentals reviewed; practitioner validation pending

A desk review checked these terminology and framing points:
- Uses **"evaluee"** (not client/patient — in forensic work a CRC has NO client).
- Attributes **RAPEL to Weed** (not McCroskey — McCroskey's system is **MVQS**, separate); getting this wrong "destroys credibility instantly."
- **Neutral** framing — no advocacy language ("strengthen your case," "maximize").
- Never claims the tool "writes/drafts/generates" the opinion.
- Correctly separates **earning capacity** (prospective ABILITY, a **range**) from **lost earnings** (retrospective wages), and **defers present-value to the economist**.

**A second, deeper multi-agent audit (2026-07-03) went past the fundamentals and found five real credibility gaps — all now fixed:**
1. The worked sample asserted a **labor-force-participation figure as a disability-category average**, mis-grounded to the physician's lifting restriction — an unsupported source relationship the ID check did not catch. → now deferred to `[Expert input needed]` (worklife source named, or hand off to the economist).
2. The sample's TSA attributed **SVP/GED worker traits to O*NET**; only the **DOT** supplies them. → rewritten to name the DOT as the source and O*NET-SOC as the cross-walk target; a template coverage prompt now enforces it.
3. The sample never stated the **evaluee's age** (load-bearing for a work-capacity opinion). → added.
4. No **apportionment** prompt (pre-existing/coexisting condition vs. the work injury — the defense's standard opening). → added to `functional_capacity`.
5. No **placeability** prompt (jobs *exist* ≠ this evaluee gets *hired*) and no **future-incapacity-needs-a-medical-anchor** guard (*Korbe*). → both added.

These fixes address the identified sample and prompt issues. The methodology is
**desk-research-reviewed, not validated by a practicing expert**; the design
partner still needs to assess it (see open questions at the end).

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

- **Elcock v. Kmart**, 233 F.3d 734 (3d Cir. 2000) — admission of vocational testimony was vacated and remanded for a Daubert hearing; the court expressed no view on that hearing's outcome. Explain and substantiate the method and its application; a methodology label alone does not establish reliability. [Court opinion](https://www2.ca3.uscourts.gov/opinarch/987472.txt)
- **Kohls v. Ellison** (D. Minn. Jan. 10, 2025) — fabricated citations undermined Hancock's declaration, which the court excluded when deciding the preliminary-injunction motion. Citation-ID checks alone cannot eliminate that risk. [Court opinion](https://www.govinfo.gov/content/pkg/USCOURTS-mnd-0_24-cv-03754/pdf/USCOURTS-mnd-0_24-cv-03754-0.pdf)
- **Matter of Weber** (N.Y. Sur. Ct. 2024) — the court declined to credit unreliable damages calculations and separately criticized unexplained, unverified Copilot use. [Court opinion](https://www.nycourts.gov/REPORTER/3dseries/2024/2024_24258.htm)
- **Korbe v. Manchester** (D. Colo. May 23, 2024) — the court excluded future lost-earning-capacity opinions lacking adequate medical predicates and reliable support, while admitting the expert's past wage-loss opinion. [Court opinion](https://www.govinfo.gov/content/pkg/USCOURTS-cod-1_23-cv-01145/pdf/USCOURTS-cod-1_23-cv-01145-0.pdf)
- **Kumho Tire / GE v. Joiner** — the **ipse dixit / "analytical gap"** doctrine: an opinion connected to data "only by the ipse dixit of the expert" is excludable. The court must assess the support for the particular opinion; no ranking of exclusion grounds is established here.
- **Dec 1, 2023 FRE 702 amendment** — proponent must show each element "more likely than not," and 702(d) now requires a **reliable APPLICATION** of the method.
- **Proposed FRE 707** — addresses reliability review for certain machine- or AI-generated evidence. It remains a rulemaking proposal; its scope and final text are unsettled. [Official committee materials](https://www.uscourts.gov/sites/default/files/document/2026-05_evidence_rules_agenda_book.pdf).

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

- **"Does it write my opinions?"** → The tool produces a structured draft from your material. You must review its wording, sources, and opinions before adopting and signing it. The prompt tells the model to use supplied material, and export blocks uncited or unknown-ID sentences.
- **"Will it invent citations like the expert in Kohls?"** → The export check rejects unknown citation IDs and uncited sentences, but a valid ID can still be attached to an invented or unsupported claim. You must verify each citation and statement.
- **"If opposing counsel asks how I used AI, am I exposed?"** → The tool produces a **tamper-evident AI-disclosure record** you can review and produce if appropriate. A recipient can check the presented record's hash consistency at `/verify`; that check cannot prove the record is complete or who authored the report.
- **"Does it do the TSA / earning-capacity / restrictions for me?"** → You remain responsible for those judgments (which occupations transfer, the capacity range, the adopted restrictions). It formats and runs a Rule-26 structural completeness check. Review the output before adopting it.
- **"Is my case data trained on / safe?"** → No training on your data (Anthropic API default); described as commitments, not certifications (honest — no SOC 2 claimed).

## Strengths an expert would respect (lead with these)

- **Citation-ID checks catch missing and unknown citations.** They do not establish that a claim follows from the cited source; expert review is essential.
- The **AI-disclosure record + `/verify`** provides an internally checkable record relevant to the risks they fear (FRE 707, Kohls, discoverable AI methodology).
- The template is **RAPEL-correct and Rule-26-mapped**; the sample **defers PV to the economist** and expresses **capacity as a range**.

## Honest limits → the open questions for the design partner

These genuinely need an expert (from `vocrehab-template-spec.md`) — bring them as *your* questions; it signals rigor + humility:
1. Is the 19-section granularity right, or do experts collapse some (e.g. merge Records Reviewed into Facts/Data Considered)?
2. Exact **TSA tier-label** wording courts/experts expect.
3. Where the **economist hand-off** actually sits (present-value of the loss).
4. Which sections are boilerplate vs. heavily customized.
5. Does the TSA section push for **specific DOT/O*NET codes + SVP levels** (not generic occupation names) in a real case? (The sample's redirect occupations are illustrative — confirm the template forces that specificity.)
