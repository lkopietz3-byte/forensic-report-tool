# Forensic Vocational Earning-Capacity Report — Template Spec (DRAFT)

> Status: **DRAFT, desk-research only.** Encoded as `VOCREHAB_TEMPLATE`
> (`src/lib/domain/template.ts`, version `0.1.0-draft-rapel`). NOT validated by an
> expert. This document exists to be red-teamed by the beachhead design partner
> (plan Must-Have #2) before it becomes the live product template. Source: Wave-3
> deep-research agent (2026-06-08); citations at bottom.

## Framework: RAPEL (Weed)

The dominant peer-reviewed methodology for earning-capacity opinions; courts
treat it as a recognized method supporting Daubert reliability. Five components,
written in sequence (each builds on the prior):

- **R — Rehabilitation plan** — vocational profile + realistic interventions / retraining / costs / duration. → section `rehabilitation_plan`
- **A — Access to labor market** — how much of the labor market remains reachable; this is where the **TSA** lives. → section `transferable_skills`
- **P — Placeability** — real-world likelihood of being hired (restrictions, licensing, local hiring, economy); where the **labor-market survey** is applied. → section `labor_market_survey`
- **E — Earning capacity** — pre- vs. post-injury income potential as a **range** (never a single number). → section `earning_capacity`
- **L — Labor force participation** — realistic work consistency over the work-life; work-life-expectancy reductions. → section `labor_force_participation`

## Section order (encoded skeleton)

1. Referral and Assignment — `scope_of_assignment` (Daubert: scope must be explicit)
2. Identifying Data and Background — `background`
3. Records Reviewed — `records_reviewed` (feeds Rule 26 "facts/data considered")
4. Interview and Vocational Evaluation — `interview` (self-report flagged as self-report)
5. Vocational Testing — `vocational_testing`
6. Functional and Residual Capacity — `functional_capacity` (adopted restrictions + source; Daubert requires driving assumptions visible)
7. Transferable Skills Analysis — `transferable_skills` (RAPEL A)
8. Labor Market Survey — `labor_market_survey` (RAPEL P)
9. Rehabilitation Plan — `rehabilitation_plan` (RAPEL R)
10. Pre-Injury vs. Post-Injury Earning Capacity — `earning_capacity` (RAPEL E)
11. Labor Force Participation / Work-Life — `labor_force_participation` (RAPEL L)
12. Loss of Earning Capacity — `loss_of_earning_capacity` (differential; present-value usually the economist's role → `[Expert input needed: ...]`)
13. Opinions — `opinions` (Rule 26 i)
14. Basis and Reasons — `basis_and_reasons` (Rule 26 i; show the data→opinion path — principal Daubert shield)
15. Facts or Data Considered — `facts_or_data_considered` (Rule 26 ii; includes DOT/O*NET/BLS/Census)
16. Exhibits — `exhibits` (Rule 26 iii; TSA tables, LMS logs, wage printouts)
17. Qualifications — `qualifications` (Rule 26 iv; CRC/ABVE + 10-yr publications)
18. Prior Testimony (4 yrs) — `prior_testimony` (Rule 26 v)
19. Statement of Compensation — `compensation` (Rule 26 vi)

## Transferable Skills Analysis (TSA) detail

- **Inputs:** past relevant work coded to the **DOT**, with worker traits — **SVP**, **GED** (Reasoning/Math/Language), aptitudes, temperaments, physical demands, environmental conditions, Data/People/Things, plus **Work Field** and **MPSMS** codes.
- **Tools:** **OASYS** / **SkillTRAN** (TSS, PREPOST for pre/post-injury); **O*NET** via the O*NET–DOT crosswalk to SOC for updated content; **BLS/Census** for wage/employment data. Rules of thumb: occupations below SVP 3 aren't "transferable"; matches fail if GED/aptitude levels are exceeded.
- **Report output:** a table of target occupations tiered by transferability strength (Direct-Closest → Closely → Generally-Good → Fair → Potential), each with wage data and any training required. Evidentiary spine of the Access and earning-capacity opinions.

## Daubert / admissibility failure modes (build validators against these)

- No visible **data→opinion path** ("unsupported leaps" from broad government data to a narrow conclusion).
- Generic job titles **disconnected from the evaluee's actual circumstances**.
- Weak **labor-market-survey methodology** (non-representative sampling; the discredited "equal distribution method" — *Hohman v. Kijakazi*).
- Over-reliance on **uncorroborated self-report** instead of medical/FCE sourcing.
- **Functional assumptions or qualifications not stated** / not tied to the specific opinion.
- **Apportionment omitted** — failing to separate injury-caused loss from a pre-existing/degenerative or prior-injury baseline; the defense's standard opening attack. *(Now a `functional_capacity` coverage prompt.)*
- **Future-incapacity not anchored to a physician/FCE** — the VE deciding future inability to work without a medical opinion (*Korbe v. Manchester*). *(Now a `functional_capacity` prompt + instruction.)*
- **Worker traits (SVP/GED) attributed to O*NET** — only the **DOT** supplies SVP/GED; O*NET is the current classification/cross-walk target. *(Now a `transferable_skills` prompt.)*
- **Placeability collapsed into Access** — a survey that proves jobs *exist* but never states the expert's real-world *hireability* judgment. *(Now a `labor_market_survey` prompt.)*
- **Category-average worklife generalization** (Gamboa-Gibson/LPE) mis-grounded to a non-worklife source — worklife reduction must trace to a work-life-expectancy source (e.g. Skoog-Ciecka-Krueger) or defer to the economist.

Shields: RAPEL's peer-reviewed status, transparent methodology, recognized government data sources, explicit assumptions.

> **2026-07-03 audit hardening.** A multi-agent expert audit found the worked sample shipped three of the errors above (mis-grounded category-average worklife, SVP/GED attributed to O*NET, missing evaluee age) and the template lacked the apportionment/medical-anchor/placeability/DOT-reconciliation coverage prompts. All fixed: the sample now defers worklife + placeability + apportionment to `[Expert input needed]`, names the DOT as the worker-trait source, and states the evaluee's age; the template adds the four coverage prompts above and wage-handling guidance (median over mean; no cross-occupation percentile averaging). Full findings: the workflow briefing (task `wy7h9o4yr`).

## Hard guardrail — expert-only vs. mechanical

**Tool must NEVER originate (capture & structure the expert's own words only):**
adopted functional/residual restrictions; vocational-test interpretation;
placeability judgment; earning-capacity ranges and the pre/post differential;
labor-force-participation / work-life reductions; all opinions + basis; which TSA
occupations are realistic.

**Tool MAY scaffold/format:** section ordering & headings; Rule 26 placement &
completeness checks; records-reviewed itemization; exhibit/appendix assembly; TSA
table formatting & tier labels (matching is OASYS/SkillTRAN-assisted, *selection*
is expert judgment); CV / publications / prior-testimony / fee boilerplate;
Daubert/Rule-702 readiness checklist enforcement.

## Open questions for the design partner

- Is the 19-section encoding the right granularity, or do experts collapse some (e.g. merge Records Reviewed into Facts/Data Considered)?
- Standard tier labels for the TSA table — confirm exact wording experts/courts expect.
- Where does the economist hand-off actually sit (present-value of the loss)?
- Which sections do ABVE/D experts treat as boilerplate vs. heavily customized?

## Sources

- RAPEL Model — KWVRS · https://kwvrs.com/rapel-model-explained/
- Daubert/Rule 702 Readiness Checklist — KWVRS · https://kwvrs.com/daubert-rule-702-readiness-checklist/
- Daubert & Earning Capacity — Stokes & Associates · https://www.stokes-associates.com/blog/2022/2/17/daubert-standard-for-admissibility-when-assessing-earning-capacity
- TSA Defined — SkillTRAN · https://skilltran.com/index.php/support-area/transferable-skills
- TSA Data Resources (DOT/SVP/MPSMS) — SkillTRAN PDF · https://www.skilltran.com/pubs/SkillTRAN_DataResources.pdf
- Rule 26(a)(2)(B) Disclosure Guide — Expert Institute · https://www.expertinstitute.com/resources/insights/rule-26-federal-rules-of-civil-procedure-a-disclosure-guide-for-expert-witnesses/
- *Hohman v. Kijakazi* analysis — Expert Witness Blog · https://www.expertwitnessblog.com/employment-expert-witness-testimony-under-scrutiny-vocational-analysis-and-judicial-review-in-hohman-v-kijakazi/
