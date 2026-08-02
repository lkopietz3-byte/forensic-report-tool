# Market & Discovery Research — Online Desk Research

> Compiled 2026-06-08 from parallel public-web research (read-only; no outreach).
> This is **desk research to de-risk and focus** the plan's validation — it does NOT
> replace the 5–10 human discovery interviews + paid design partner (still gating
> per `~/.claude/plans/do-deep-research-to-greedy-sutton.md`).

## TL;DR verdict

- **Niche is genuinely open AND defensible 12–24 mo.** No funded startup owns expert-side,
  court-defensible Rule 26(a)(2)(B) *narrative drafting from the expert's own findings*.
  Nearest threats are adjacent (CaseMark, Expert Institute) — neither drafts the original
  report or ships a disclosure trail; CaseMark is even drifting *away* from experts.
- **The moat (AI-disclosure/audit trail) is real but EARLIER-stage than "compliance
  mandate."** CLF v. Shell is confirmed real, but it's one magistrate discovery order.
  Honest pitch = "get ahead of an emerging discovery risk," not "comply with a rule."
- **Pricing: lead with per-report / credits, NOT per-seat.** Most experts are part-time
  and write only a handful of reports/year — monthly seats churn.
- **SELL TO THE INDIVIDUAL EXPERT, not the law firm.** Experts own the deliverable and
  expense the tool back to the firm as a litigation cost; no evidence firms buy software
  seats for their experts. Self-serve motion confirmed.
- **NEW (wave 2): vocational rehabilitation may be a STRONGER beachhead** than
  engineering/recon — ~16,500 credentialed CRCs (~10x the base), templated earning-
  capacity reports, Rule 26 native, low PHI, and no funded report-drafting competitor.
  Forensic-accounting report-drafting lane is also open. Fire/explosion (NFPA 921) is a
  *displacement* play (Blazestack/921Docs already there, but bootstrapped). Construction
  defect (InspectMind/YC), DFIR (crowded), and IME (HIPAA fortress) are traps.
- **Intake is hard but tractable, not existential.** Multimodal Claude ingests typed
  depos/reports natively; even imperfect-but-cited extraction beats 8+ hrs/depo of manual
  summarizing. Long tail = scanned/handwritten exhibits, redaction integrity, Bosch CDR.
- **Confidentiality is a solved checklist, not a blocker:** SOC 2 + AES-256 + no-training
  + **pursue Anthropic Zero-Data-Retention (ZDR)** so you can truthfully say the model
  provider retains nothing. Anthropic API does not train on commercial inputs by default.
- **Biggest unknowns remaining:** (1) reports-per-expert-per-year STILL unresolved and the
  "most cases settle + part-time common" context cuts *against* high volume; (2) first-
  person burning-pain voice is still thin (Reddit/Forensic Focus infrastructurally
  unfetchable — absence ≠ proof); (3) whether any single discipline clears $20k/mo alone.
- **Discipline pick: now a 3-way** — accident reconstruction (cleanest drafting gap),
  forensic engineering (louder pain, looser template), **vocational rehab (biggest base,
  most templated, wide-open)**. Decide in human interviews.

---

## 1. Competitive landscape

- **Niche is open.** No funded startup core-owns expert-witness report drafting.
- **CaseMark** = closest, but **attorney-side**: an "Expert Witness Designation"
  workflow that *summarizes/designates an existing report* into an FRCP-26 disclosure
  (~$25/run). Does NOT draft the expert's original narrative; no AI-disclosure feature.
  Real adjacent threat, could move down-funnel.
  https://casemark.com/workflows/expert-witness-designation
- **InspectMind AI (YC W24)** = **inspection-focused, not litigation**. Photos/voice →
  construction/forensic *inspection* reports (1hr→10min). ~$500K pre-seed; ~$2.1M rev
  reported. Not a direct threat. https://www.ycombinator.com/companies/inspectmind-ai
- **Sim suites** (FARO Zone, Virtual CRASH, PC-Crash, Crash Zone) = diagrams/physics/
  animation only; **no narrative drafting**. Genuine prose gap confirmed.
- **General legal-AI** (Harvey, CoCounsel/Casetext, Clearbrief, Spellbook) — none drafts
  expert reports today; could add shallow feature.
- **"WitnessAI" ($85M)** = AI-security firm, **unrelated name collision**. Confirmed.
- **EsquireTek** = discovery responses, unrelated.

## 2. Forensic engineering discipline (ASTM E3176 / E620)

- **Standards are guides, not mandatory.** E3176 (forensic eng reports), E620 (expert
  opinion reports) + Rule 26. Core principle: **separate fact from opinion**.
- **Pain: real but under-vocalized.** Reports take "one week to eight weeks"; called
  "tedious"; "countless hours." Loudest complaints come from vendors/associations, not
  raw practitioner venting. IEEE-CNSV consultants openly discuss AI to cut report time.
  https://www.expertinstitute.com/resources/insights/drafting-expert-witness-reports-pitfalls-best-practices/
  https://californiaconsultants.org/opinion-use-ai-write-expert-witness-report/
- **Economics:** ~$300–600/hr; report writing billed at the *lower* prep rate (~$450
  median, SEAK 2024). Report-volume/yr: **no public data** (key gap).
- **Communities:** NAFE (~400 members; needs PE + NSPE), ASCE Forensic Engineering
  Division, SEAK directory (2,000+). Tight, qualified, reachable.
- **Tooling:** Microsoft Word from scratch. No E3176/E620-specific drafting tool exists.

## 3. Accident reconstruction discipline (IPTM / ACTAR)

- **Format:** IPTM "topical format" (de-facto standard 25+ yrs) + Rule 26. More
  standardized than forensic engineering.
- **Pain: latent/quiet.** CrashForum public board = technical threads only, **no
  report-writing complaints**. IPTM markets report-writing as a *skill to teach*, not a
  pain to automate. No first-person venting found.
- **Economics:** ~$254 review / $353 depo / $385 testimony per hr. Report prep is their
  *cheapest* billable hour → slow writing is opportunity-cost drag, not lost revenue.
- **Tooling gap is CLEAR:** FARO/Virtual CRASH/PC-Crash make exhibits + numbers but
  **the expert hand-writes every word of the Rule 26 narrative.** Best drafting wedge.
- **Communities:** ACTAR (credential gatekeeper), IPTM/UNF, NUCPS/NUTI, SATAI,
  CrashForum.info. Concentrated, reachable via conferences + ACTAR CEUs.
- **Verdict vs engineering:** better template fit + clearer drafting gap, but weaker/
  quieter demand signal. Validate willingness-to-pay before building.

## 4. AI-disclosure legal wedge (the moat)

- **CLF v. Shell — CONFIRMED REAL.** *Conservation Law Foundation v. Shell Oil*, D.
  Conn., Mag. J. Thomas Farrish, ~May 18 2026: an expert's **AI prompts are
  discoverable "methodology" under Rule 26(b)**. BUT: single magistrate discovery
  order, fact-specific, **not binding precedent**.
  https://www.arnoldporter.com/en/perspectives/blogs/edata-edge/2026/05/court-rules-experts-ai-prompts-are-fair-game-under-rule-26
- **Kohls v. Ellison** (D. Minn. Jan 2025): expert declaration **struck** for ChatGPT
  hallucinated citations — "shatters his credibility." Vivid "do it wrong, get struck"
  story. https://hlli.org/kohls-v-ellison/
- **300+ federal judges** have AI standing orders — but target **attorney filings**,
  not expert reports specifically.
- **FRE 707** (machine-generated evidence → Daubert): approved for public comment Jun
  2025, comment closed Feb 2026, **not yet enacted**; governs AI-as-evidence, not
  expert AI-use disclosure.
- **Expert-specific bar guidance is nascent.** UK Bond Solon survey: 89% of experts
  *want* AI guidance that doesn't exist; expert AI use 11%→20% YoY.
- **Honest wedge framing:** anticipatory risk-mitigation early-mover, NOT existing
  compliance requirement. Risk: experts may just rely on counsel until a binding rule
  lands. Own the SEO topic "AI disclosure expert witness report" now.

## 5. Pricing & economics

- **Rates (absolute $ support WTP):** all-expert median ~$450/hr review, ~$500 testify
  (SEAK 2024, ~1,600 experts). Report writing ≈ **5–10 hrs/report**.
- **Reports/expert/year = THE risk number, and data confirms the fear:** most experts
  are **part-time** (~12–16 cases/yr typical; not all yield a Rule 26 report; consulting/
  non-testifying experts produce none; most cases settle). **Working estimate: ~5–20
  formal reports/yr** for a typical solo. Low end breaks per-seat SaaS.
- **SaaS norm = usage/credits wrapped in a seat.** CaseMark $60/$150/$500 tiers are
  really AI-credit buckets. Pure per-seat is fading for low-frequency users.
- **WTP proven:** experts already pay big for tooling — HVE ~$2,900 + $2–6k/yr; PC-Crash/
  Virtual CRASH licenses in the thousands. A tool saving 5–10 billable hrs ($1.5–4k) has
  obvious **per-report** ROI.
- **TAM is narrow:** ACTAR ~700; NAFE ~400; accredited core ~1,000–1,500 US. $20k/mo
  needs near-double-digit penetration of a tiny market → **adjacent verticals likely
  required** to clear it.
- **Verdict:** price **per-report / credits**, not per-seat. $20k/mo is a stretch on one
  discipline alone.

## 6. Distribution / GTM

- **SEAK is the wedge.** Dominant training + directory since 1980; runs the **National
  Expert Witness Conference (Apr 30–May 1 2026, Clearwater FL)**; directory 2,000+;
  podcast; fee surveys. Pitch a session/sponsorship there.
- **Other orgs:** NAFE (2 conf/yr + journal), ACTAR (CEU gatekeeper), IPTM Symposium
  (May 18–21 2026), ASCE Forensic Congress (Oct 22–25 2026). Referral middlemen:
  ForensisGroup, JurisPro, Round Table Group, **Expert Institute** (PE-owned, *already
  building AI tooling* — watch as potential incumbent).
- **Online:** LinkedIn = best lead source (FEWA group); CrashForum.info (public);
  podcasts (The Expert Witness Podcast, Forensics Talks). Reddit/FB recon communities
  thin/private.
- **SEO opening:** own "AI disclosure expert witness report" + "Rule 26 report" — current
  rankers are beatable (SEAK, Expert Institute, PDF-filler sites).
- **Adoption = referral + peer/association endorsement + conference speaking.** Lands
  only when framed "defensible & disclosure-compliant," never "let AI write it."

## 7. Voice-of-customer (pain validation)

- **Core pain only PARTIALLY validated in public, first-person terms.** The *cost* is
  real & quantified (20–40 hrs/case; "consumes a lot of man-hours"); trainers sell
  "save time on reports." But clean first-person "I hate this / I write off unpaid
  hours" quotes from courtroom experts are **thin** — strongest venting is adjacent DFIR.
  (Tooling gap: Reddit + Forensic Focus were not fetchable — absence ≠ proof.)
- **AI-in-court FEAR is loud & well-documented → validates the moat AND names the #1
  objection:** experts believe outsourcing the writing is unethical / cross-exam-fatal.
  - "shatters his credibility with this Court" (Kohls v. Ellison).
  - "Using an AI program to generate an expert report that the expert claims to have
    authored would be unethical." / "the expert will look like a fool if forced to admit
    on cross-examination that she didn't write the report." (T.C. Kelly, ExpertPages)
  - This is exactly why positioning = "structures YOUR findings, you author & sign,"
    with the disclosure trail as proof.

---

---

## Wave 2 — gap-fill research

### 8. Adjacent verticals / TAM expansion (same Rule-26 + disclosure backbone)

Screened 7 verticals; critical screen = "is a funded AI startup already here?"

| Vertical | US base | Templated? | Funded AI competitor? | Verdict |
|---|---|---|---|---|
| **Vocational rehab** (earning-capacity) | ~16,500 CRCs | Yes (structured) | **None found** | **BEST open adjacency — maybe better beachhead** |
| **Forensic accounting / econ damages** | ~3–4k CFF + more | Semi | Valid8 ($8.5M) does fund-tracing, NOT drafting | Open report lane; numbers-heavy = weaker prose fit |
| **Fire/explosion O&C** (NFPA 921) | ~10–14k certified | Highly (921 ≈ checklist) | Blazestack, 921Docs, APX — **bootstrapped** | Displacement play; fast-follow, not wedge |
| **Premises liability / human factors** | small | Least | None | Open but small; bolt-on |
| **Construction defect** | thousands | Semi | **InspectMind (YC)**, T2D2 | TRAP |
| **DFIR** | tens of thousands | Loose | Crowded (CrowdStrike etc.) | TRAP / poor Rule-26 fit |
| **IME / medical-legal** | $2B+ market | Highly | ExamWorks/Maximus/Sedgwick | FORTRESS (HIPAA) — founder right to avoid |

Best TAM-extenders: **vocational rehab (#1)** and **forensic-accounting report lane**.
Vocational rehab plausibly a *stronger* beachhead: ~10x base, templated, low PHI, empty
field. ("Open" = absence-of-evidence — do a targeted competitive sweep before committing.)

### 9. Competitive-threat depth & who-pays

- **CaseMark:** $1.7M seed (Gradient, Jun 2024), ~14 employees, no Series A. Its expert
  workflow only *summarizes* an uploaded report into a disclosure — "cannot generate
  original expert opinions," no audit trail. 2026 roadmap drifting to court-reporter
  white-label + a dev platform → **away** from experts. Could add drafting in 1–2 quarters
  *if they chose*, but would have to flip buyer (attorney→expert). Moderate, not imminent.
- **Expert Institute:** PE-owned (Levine Leichtman, Oct 2024); AI today = expert *vetting*
  (Expert IQ/Radar), not drafting. Biggest **distribution** threat (claims 1M+ experts) but
  structural disincentive to commoditize its experts' core deliverable. Latent.
- **No YC (W24–W26)/Product Hunt/legal-AI incumbent** targeting expert-report drafting.
  Harvey, CoCounsel/TR, Clio, Filevine, Everlaw all attorney-side. 2025–26 news is all
  demand-side tailwind (prompt-discoverability rulings).
- **Who pays:** the **individual expert** buys/expenses the tool (passed through to the
  firm as a litigation cost). Firms don't buy software seats for experts. → self-serve.

### 10. Intake friction & confidentiality

- **Inputs per case:** deposition transcripts (200+ pages each; a paralegal summarizes only
  ~20–25 pg/hr → 8+ hrs/depo), police/crash reports, scene photos (dozens–hundreds), EDR/
  "black box" via Bosch CDR (proprietary PDF, ~90% of US vehicles), measurements, prior
  reports, medical records, interrogatories.
- **Hardest ingestion:** scanned-image PDFs needing OCR (handwriting ~50–70% accuracy),
  Bates/exhibit stamps (must preserve as citation anchors), OCR text/image-layer drift
  (redaction-leak liability), Bosch CDR format, photo EXIF/GPS.
- **Approach for a solo:** lean on multimodal Claude for native PDF ingestion of typed
  docs; add a vision/OCR pass for scanned exhibits + handwriting; preserve Bates numbers as
  structured citation anchors; thin parser for Bosch CDR. Win = imperfect-but-cited draft
  in minutes vs 8+ hrs manual.
- **Confidentiality checklist (table-stakes):** SOC 2 Type II, AES-256 at rest + TLS,
  **no-training-on-data** (prominent), tenant isolation, RBAC, SSO/MFA, audit trails.
  Differentiating-but-heavy: ISO 27001, FedRAMP. **Anthropic:** no training on commercial
  inputs by default; 30-day standard retention; **pursue Zero-Data-Retention agreement.**

---

## Decisions this research supports

1. **Keep building the audit/disclosure layer as the headline** — confirmed open + timely.
2. **Pricing model = per-report / credit packs** (optional seat for high-volume firms).
3. **Sell self-serve to the individual expert** (confirmed buyer; expensed to the firm).
4. **Lead discipline = now a 3-way** (accident reconstruction / forensic engineering /
   **vocational rehab**), decided in human interviews. Add vocational rehab to discovery
   outreach — it may be the biggest, most-templated, most-open option.
5. **Plan for adjacent-vertical expansion from day one** — single discipline likely caps
   below $20k/mo MRR. Natural ladder: beachhead → fire/explosion + voc-rehab + forensic-
   accounting (all share the Rule-26 + disclosure backbone).
6. **Messaging = "you author & sign; we structure + prove it,"** directly disarming the
   "AI-authored report is unethical/cross-exam-fatal" objection (the loudest VoC signal).
7. **Confidentiality is cost-of-entry:** commit SOC 2 + AES-256 + no-training + pursue
   Anthropic ZDR. Make it a stated selling point, not fine print.

## Open questions for human interviews (sharpened)

- Reports/expert/year (STILL no public data; "most settle + part-time" cuts against high
  volume — this is the #1 number to confirm, it drives both pricing and TAM).
- Is report-writing pain *burning* or merely *annoying*? (public first-person venting is
  thin — the strongest evidence is cost/time data + vendors selling "save time," not
  practitioners venting).
- Would they trust/pay, given the strong "AI-authored = unethical" instinct?
- Among recon / engineering / **vocational rehab**, which has the most acute pain + most
  standardized template + best willingness to pay?
- (Confirmed by desk research, verify in interview: expert is the buyer, not the firm.)

---

## Wave 3 — deep validation (vocational-rehab sweep · pricing/volume · product UX)

> Compiled 2026-06-08 from three focused research sweeps. Net effect: **vocational
> rehabilitation is promoted from "candidate" to the recommended lead beachhead**, the
> per-report pricing model is concretely validated (and matches the tiers now live on the
> landing page), and the product-UX spec is anchored to named legal-AI products.

### 11. Vocational-rehab competitive sweep — lane CONFIRMED open

- **Incumbents are data engines, not narrative drafters.** SkillTRAN **OASYS / Job Browser
  Pro** outputs *modular* labor-market data, TSA tables, occupational lists — and explicitly
  does **not** generate comprehensive narrative reports with integrated analysis or forensic
  conclusions. McCroskey **MVQS** is a job-person matching/TSA engine over ~12,775 DOT/O*NET
  profiles (data, not prose). Life-care-plan tools (LCP Builder, ActiveLCP, Lifecarewriter)
  automate cost tables, a different deliverable.
- **The one AI entrant is clinical, not forensic:** **VocRehabTools** offers free AI
  casenote/report generation but targets state-VR/clinical counselors — no Rule 26, no RAPEL,
  no forensic positioning. (PAR's AI Report Writer is psychoeducational, saves ~6 hrs/wk —
  proves the time-savings thesis in an adjacent field.)
- **Verdict: no funded competitor drafts court-defensible forensic vocational/earning-capacity
  narratives.** Caveat/risk: **SkillTRAN owns the data layer and could bolt on narrative
  generation** — a real platform-incumbent risk; move fast.
- **Standards are MORE templated than engineering/recon** → AI drafting is both safer and
  easier to standardize. Dominant framework: **RAPEL** (Rehabilitation plan, Access,
  Placeability, Earnings capacity, Labor force participation) + TSA + Vocational Quotient.
  RAPEL is peer-reviewed and Daubert-tuned. Bodies: CRCC, **ABVE** (the forensic-specific
  board), IARP; ICHCC/CLCP for life-care planning. Low PHI (records/depos/wage data).
- **Population — honest correction:** ~15,000+ active CRCs, BUT the true *forensic-active*
  subset is **ABVE-level, low-thousands** (smaller than the 16,500 CRC headline used in Wave 2).
  CLCP life-care planners = adjacent expansion market.
- **Economics favor a drafting SaaS:** experts bill $200–$500+/hr; current tool spend is LOW
  (Job Browser Pro ~$549 + $149/yr; OASYS Web $1,199/yr) → a **$1–3k/yr drafting SaaS is
  in-budget and would dwarf incumbent ARPU.**
- **Distribution is concentrated/reachable:** IARP/RehabPro (forensic & SSA-VE section,
  listservs, doc library, 2026 Washington Conf), ABVE (forensic-only directory), CRCC, ICHCC.
- **Pain is inferred-strong, not loudly voiced** (same caveat as other disciplines): report
  writing called "the hardest part"; PAR data shows assessment pros write ~25 hrs/wk, AI saves
  ~6. **Confirm report-writing pain in direct interviews before committing.**

### 12. Pricing & report-volume validation (validates the live pricing tiers)

- **Reports/expert/year — best public anchor yet:** ExpertPages 2019 survey of the
  SEAK-type population: **54% take <10 cases/yr; 27% take 1–3; 27% take 4–9; 8% take 50+.**
  These are *cases, not reports* — roughly half to two-thirds of retained engineering/recon
  cases reach a written report. Workforce skews part-time (**19% full-time; 35% semi/retired
  part-time; 27% spend ≤10% of time**). **Plan against the active full-time cohort: ~8–15
  written reports/yr; use ~10/yr as the planning anchor.** Do NOT price against the 1–3 median.
- **Existing software spend de-risks WTP:** recon HVE renewal **$2,000–$6,000/yr**; voc
  SkillTRAN **$73–$127/report**, OASYS annual ~$1,200+ above ~17 reports/yr (**this profession
  already pays per-report**); adjacent legal-AI seats Briefpoint $89/mo, Spellbook ~$99–$350,
  Clearbrief $300. A serious expert spends **$1,500–$6,000/yr** on software and earns **~$13k
  per case** → a tool saving hours/report has obvious ROI.
- **Per-report beats per-seat:** at ~10 reports/yr a $150–$300/mo seat is dead weight 11
  months out of 12 → churn. Winning structure = **value-priced per-report + an annual credit
  commitment** to smooth lumpiness (mirrors SkillTRAN, InspectMind plan-check, depo-summary
  tools). Competitor benchmark: CaseMark credit tiers $60/$150/$500; InspectMind $100/check +
  $100/user/mo; Clearbrief $300/seat; SkillTRAN $73–$127/report.
- **Recommended model (now LIVE on the landing page, validated):**
  - **Pay-as-you-go: $150–$250/report** (current page: **$200/report**). Anchored above
    SkillTRAN $73–$127 and InspectMind $100/check (higher-stakes deliverable).
  - **Annual: ~$1,800/yr for ~12 credits (~$150/report), overage ~$175** (current page:
    **$1,800/yr "Active expert"**). Targets the 8–15 reports/yr cohort; below existing
    HVE/recon spend.
  - **Firm: ~$3,600/yr for ~30 credits** (current page: **$3,600/yr "Firm"**).
  - **Land-and-expand:** 1 free report → per-report → annual upsell once they cross ~10/yr.
- **$20k/mo MRR = $240k ARR is reachable but non-trivial:** ~**133 active accounts** at $1,800
  ACV, or ~**96** at a ~$2,500 blended ACV (~10 reports/yr @ $250). Requires near-total focus
  on the ~19% full-time/high-volume cohort; per-seat pricing would make this much harder.

### 13. Product UX spec (anchored to Clearbrief / CaseMark / InspectMind / Spellbook)

- **Matter-centric workspace, not chat-first** (CaseMark). Build the whole app around a single
  **Case** object; intake, evidence, drafting, disclosure all live under it.
- **Persistent staged stepper** mirroring the expert's mental model (InspectMind's
  Capture→Extract→Check): **Intake → Evidence Review → Draft → AI-Disclosure → Export.**
- **Messy-intake ingestion** (the make-or-break surface): drag-drop mixed litigation docs →
  auto-OCR → auto-classify (deposition/exhibit/photo/report) → **user confirms**; never manual
  tagging (CaseMark "Organize").
- **Two-pane document + source editor** (Clearbrief/Spellbook): editable report section
  center, evidence/source panel right that **highlights the cited passage**.
- **Citation/grounding UI = the product's defensibility (model on Clearbrief):**
  hyperlinked inline citations that **jump to the exact page** of the depo/exhibit/photo with
  the grounding span highlighted; **per-sentence confidence flag (green=grounded / amber=weak /
  red=no/unverified source)**; images as **first-class citation targets**; independent
  **quotation verification.** (Our sample page's numbered source-chips + grounding badges are a
  v0 of exactly this.)
- **Human-authorship affordances (liability framing + trust):** AI suggestions as Word-style
  **accept/reject redlines** (Spellbook) — never silent insertion; **mandatory per-section
  "Approve" gate** before export with "Reviewed & approved by [Expert]" stamps; an exportable
  **"Cite Check Report"** audit trail capturing every suggestion, who accepted it, and reviewer
  notes (Clearbrief) — the court-defensibility artifact and a sales centerpiece. NB: SOC 2
  expects every privileged action attributable to a **named human actor** — bake that into the
  audit log.
- **Onboarding for low-tech, older professionals:** guided wizard with **discipline templates**
  + sensible defaults; minimal jargon, high white space, validated inputs, progress bar,
  pause/resume.
- **Design-system baseline:** sans-serif body (Inter/Lato/Open Sans) at **18px+** for the older
  audience; serif reserved for the rendered report preview (signals formality); **WCAG AA**
  (4.5:1 body / 3:1 large), target AAA 7:1 where feasible; **200% text resize**; flags must
  carry **text/icon labels, not color alone**; **DOCX export is table stakes** with citations
  preserved as live hyperlinks/footnotes.
- **Top-5 build priorities:** (1) per-sentence grounding indicator + click-to-source; (2)
  exportable audit-trail/Cite Check Report; (3) mandatory per-section approval gate with
  "authored by the expert" framing; (4) messy-intake ingestion; (5) older-user-first design.

### Wave-3 decision deltas

1. **Lead beachhead = vocational rehabilitation** (was a 3-way). Most templated (RAPEL/TSA,
   Daubert-tuned), wide-open drafting lane, low PHI, in-budget, concentrated distribution
   (IARP/ABVE). Keep recon/engineering as fast-follows. Still confirm pain in interviews.
   *(The live `/sample` already models a voc-rehab earning-capacity report.)*
2. **Pricing tiers are validated and shipped** ($200/report · $1,800/yr · $3,600/yr). Add a
   **1-free-report** land-and-expand and an annual-upsell nudge at ~10 reports/yr.
3. **Single-discipline $20k/mo is a stretch (~100–135 active accounts)** — reinforces the
   adjacent-vertical expansion plan; depends on capturing the ~19% full-time cohort.
4. **Two named platform risks to watch:** SkillTRAN bolting narrative onto its voc data moat;
   CaseMark/Clearbrief adding a shallow expert-report template. Counter = discipline depth +
   the disclosure/audit layer they won't build, shipped as the headline.
5. **UX north star:** Clearbrief-grade per-sentence grounding + click-to-source and an
   exportable Cite Check Report are the two surfaces that *are* the moat — prioritize over
   draft polish.
