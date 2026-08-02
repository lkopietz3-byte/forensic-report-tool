# Disclosed. business, product, and pricing audit

Date: 2026-07-27

## Executive decision

**Do not pivot away from Disclosed. Do narrow the bet and change the sales
motion.**

The product has a credible wedge: expert-authored report assembly, evidence
traceability, and an independently verifiable AI-use record. The application is
substantially stronger than the evidence that a business exists. The next
milestone is not another broad product module; it is one paid production pilot
after the confidentiality gate clears.

For the next 60–90 days:

1. Sell only to vocational-rehabilitation / earning-capacity experts.
2. Treat retaining counsel as a referral and standards-setting channel, not a
   second product buyer.
3. Offer a founding expert pilot first.
4. Test $250 per report and then a $1,000 five-pack.
5. Do not sell the $1,500 unlimited annual membership.
6. Do not build the next discipline until the go/no-go gates below are met.

## Why this is worth continuing

### The problem is real enough to test

- Federal Rule 26(a)(2)(B) requires a written expert report with the complete
  opinions, bases and reasons, facts or data considered, exhibits,
  qualifications/publications, prior testimony, and compensation:
  https://www.law.cornell.edu/rules/frcp/rule_26
- Rule 702 puts the burden on the proponent to demonstrate that expert testimony
  is sufficiently supported and reliably applied:
  https://www.law.cornell.edu/rules/fre/rule_702
- In *Conservation Law Foundation v. Shell*, a magistrate ordered production of
  prompts used in an expert's AI-assisted document review. The district court
  stayed the order while reviewing the objection. That is a useful warning and
  demand catalyst, not a settled universal disclosure rule:
  https://www.dechert.com/knowledge/re-torts/2026/6/Magistrate-Judge-Orders-Production-of-AI-Prompts-Used-by-Expert-Witness.html
- *Kohls v. Ellison* gives the market a vivid failure mode: fabricated citations
  in an expert declaration. Disclosed.'s strongest product response is the hard
  evidence-grounding gate, not generic "AI drafting":
  https://www.law.berkeley.edu/wp-content/uploads/archive/2025/12/Kohls-v-Ellison.pdf

### Buyers in this vertical already pay for workflow software

- SkillTRAN lists OASYS Web at $1,199/year and the PC product at $3,910. OASYS is
  a vocational data and transferable-skills engine, not a cohesive expert-report
  authoring and disclosure layer:
  https://skilltran.com/index.php/products/pc-based-solutions/oasys
- SkillTRAN also sells a standardized TSS + PREPOST analysis for $127 per case.
  This is useful willingness-to-pay evidence for per-matter vocational workflow,
  but not proof that buyers will pay Disclosed. $250:
  https://skilltran.com/index.php/products/web-based-services/sos-prices
- SEAK's 2024 survey of more than 1,600 expert witnesses reports a $450 median
  file-review/preparation rate. A $250 report tool therefore needs to return less
  than one hour at that median to be economically legible, but Disclosed. must
  validate actual time saved rather than advertise it as a fact:
  https://blog.seakexperts.com/expert-witness-fees-how-much-should-an-expert-witness-charge-2/

### The addressable channel is reachable but not enormous

- IARP says it has 2,500+ rehabilitation-professional members:
  https://connect.rehabpro.org/newwww/membership
- SEAK's directory contains more than 2,000 cross-discipline expert witnesses:
  https://seakexperts.com/
- SEAK charges $655/year for an expert listing and reports 100,000+ monthly page
  views. That shows a concentrated attorney-to-expert discovery channel:
  https://www.seakexperts.com/content/expertsapplication

These counts are channel indicators, not a defensible TAM. Not every
rehabilitation professional writes federal expert reports, and not every listed
expert is a fit.

## Competitive audit

| Alternative | What it proves | What Disclosed. must not do |
| --- | --- | --- |
| Microsoft Word + a personal template | The default is flexible, trusted, and already paid for. | Compete on prose generation alone. |
| General AI / legal AI | Cheap structuring is a commodity. CaseMark starts at $100/user/month and includes 800+ legal skills. | Claim that "AI drafting" is a moat. |
| SkillTRAN OASYS | Vocational experts pay four figures for a defensible data workflow. | Replace the data/methodology engine. Disclosed. should sit after it and ingest its outputs. |
| ExpertDraft.ai | A counsel-side service now advertises expert-reviewed reports from $1,995. This validates high litigation budgets and creates a direct attention competitor. | Drift into outsourced opinions or "court-ready/Daubert compliant" promises. |
| ExpertPractice | Expert-specific practice management is becoming occupied, including Rule 26 testimony history and challenge tracking. | Build a generic expert CRM, invoicing, or practice-management suite. |

Primary source pages:

- CaseMark pricing: https://casemark.com/pricing
- CaseMark expert designation workflow:
  https://casemark.com/workflows/expert-witness-designation
- ExpertDraft.ai pricing: https://www.expertdraft.ai/pricing
- ExpertPractice: https://www.myexpertpractice.com/

## Product audit

### What is unusually strong

- The product has a coherent trust architecture: closed-world citations, a hard
  export gate, affirmative authorship, a no-AI mode, and a tamper-evident
  disclosure manifest.
- The downloadable sample is a real artifact, not a screenshot.
- The current hero communicates the product outcome and shows the evidence map
  immediately.
- Browser-side document parsing creates a meaningful confidentiality advantage:
  original file bytes need not leave the device.
- The product is much closer to production than the historical audit says:
  authentication, persistence, RLS, exports, billing primitives, and
  end-to-end tests now exist.

### What blocks revenue

1. **Real-matter readiness.** The site correctly tells users not to upload real
   or protected case files until final privacy/confidentiality terms and a
   written model-retention commitment exist. A paid report product cannot be
   considered launched while its intended input is prohibited.
2. **No domain sign-off.** The vocational template is desk-researched but has not
   been red-teamed by a practicing vocational expert.
3. **No demand evidence.** There is no confirmed distribution of reports per
   year, time spent, willingness to pay, or adoption objections.
4. **Too much activation surface.** Loading the worked example expanded ten
   evidence cards before the user reached the product outcome. This audit
   changes the example to keep those items summarized until the user chooses to
   inspect them.
5. **The landing page is long.** The information is good but repetitive. The
   next conversion test should compare the current page against a shorter
   variant containing only: hero, deliverables, interactive proof, how it works,
   pilot/pricing, and objections.

### What not to build next

- Another expert discipline.
- A general practice-management system.
- Firm administration before at least three experts in one firm ask for it.
- A broad "AI legal" assistant.
- More visual polish without evidence from recordings/interviews that a specific
  screen is blocking activation.

## Pricing audit

### Current decision

Keep the list-price test; remove the unlimited plan.

| Offer | Decision | Reason |
| --- | --- | --- |
| Founding de-identified pilot | Free, application-based | Charging before the product permits real matter data would create the wrong trust signal. The pilot purchases feedback, not revenue. |
| First production report | Free | Removes adoption risk once confidentiality is ready and gives an observable activation event. |
| Single report | Test $250 | Legible against a $450 median preparation hour and a $127 narrow vocational analysis, while preserving premium positioning. Still unvalidated. |
| Five-report pack | Test $1,000 after single-report conversion | A 20% discount is simple and keeps credits aligned with usage. |
| Unlimited annual | Stop selling | It becomes cheaper than the five-pack after six reports, attracts the highest-usage/highest-support users, and is based on no volume data. |
| Firm plan | Conversation only | The team product is not built and pricing without seats, controls, and support evidence is fiction. |

### Unit-economics guardrails

Model cost is unlikely to determine the list price. Claude Sonnet-class API
pricing is $3 per million input tokens and $15 per million output tokens:
https://platform.claude.com/docs/en/about-claude/models/overview

At $250/report, support time, acquisition cost, payment fees, insurance, and
security/legal work will dominate inference cost. Instrument actual input/output
tokens and founder-support minutes per report before introducing any bundle.

Use these gross-margin gates:

- Single report: target at least 85% contribution margin after payment,
  inference, and direct support.
- Five-pack: target at least 80%.
- No annual plan until the 75th-percentile user's report count and support load
  are known.

### Revenue reality

At an illustrative eight paid reports per active expert per year and a blended
$200/report, annual revenue per active expert is $1,600:

- $100k ARR requires about 63 active experts.
- $250k ARR requires about 157 active experts.
- $1m ARR requires about 625 active experts.

Because IARP's 2,500+ members are not all forensic report writers, a seven-figure
business probably requires adjacent disciplines or additional per-matter
modules. The vocational beachhead can still support a strong initial business
and establish the trust/distribution asset needed to expand.

## Expansion strategy: one platform, not separate apps

Keep one Disclosed. account, case file, evidence graph, and disclosure record.
Add modules only after the core report is validated:

1. **Core report** — expert-authored report, evidence map, disclosure appendix.
2. **Supplement / rebuttal** — reuse the same case evidence for a new paid
   deliverable.
3. **Challenge preparation** — convert the private readiness check into a
   structured deposition/Daubert preparation module after expert review.
4. **Reusable expert profile** — qualifications, publications, testimony
   history, compensation, and preferred report style.
5. **Counsel review link** — a read-only preproduction view and verification
   workflow.
6. **Firm governance** — shared templates, approval controls, pooled credits,
   and reporting.

These should feel like paid modules inside one system of record. Separate apps
would fragment trust, data, distribution, and cross-sell.

## Go-to-market audit

The fastest credible motion is founder-led and referral-based:

1. Recruit 10 vocational experts from ABVE/IARP/SEAK and warm introductions.
2. Ask about their last completed report before showing Disclosed.
3. Record report hours, annual volume, tools, reimbursement, security bar, and
   unaided willingness to pay.
4. Show only the sample body, evidence map, and disclosure appendix.
5. Convert one person into the de-identified pilot.
6. After the confidentiality gate clears, charge for the next real production
   report.

Counsel is the demand-side channel: give retaining attorneys a short expert-AI
questionnaire and the free verifier, then let them refer experts who need a
repeatable answer. Do not split the product into separate counsel and expert
apps yet.

## 30/60/90-day gates

### Day 30 — problem evidence

- 10 interviews completed.
- At least 4 describe report assembly/citation/disclosure as a top-three pain.
- At least 3 agree to run a de-identified pilot.
- Median stated willingness to pay is at least $150/report.

If these fail, stop feature work and test the counsel-side report-review pivot
below.

### Day 60 — product evidence

- One practicing vocational expert signs off on the template's structure.
- Three de-identified reports complete end to end.
- Median time to first useful preview is under 20 minutes after sources are
  prepared.
- At least 80% of sections need editing rather than wholesale replacement.
- Privacy terms and model-retention posture are ready for a controlled real
  matter.

### Day 90 — revenue evidence

- One paid real-matter pilot.
- At least two referrals from participating experts or counsel.
- One repeat purchase or explicit next-matter commitment.
- Direct support plus model/payment cost stays below 20% of price.

If these pass, build the five-pack and the reusable expert profile. If they do
not, do not add another discipline.

## Contingent pivot, not the default

If experts do not feel enough report-writing pain or refuse AI-assisted
structuring even with the controls, pivot the same technology toward **counsel
review of an expert's existing draft**:

- Rule 26 coverage check.
- Unsupported-assertion and missing-source map.
- Expert AI-use questionnaire and disclosure packet.
- Read-only verification link.

That moves the buyer to the person already responsible for vetting the expert
without discarding the evidence, grounding, export, and verification work.

## Changes made from this audit

- Replaced the public three-plan pricing grid with a founding-pilot path and a
  clearly labeled post-pilot $250/report test.
- Removed the public $1,500 unlimited annual offer and its workspace upsell.
- Updated pricing answers in the help center and help widget.
- Added a direct anchor from pricing to the design-partner application.
- Collapsed the ten worked-example evidence cards by default.
- Removed the README's unsupported claim that experts hate report writing and
  clarified that business validation is still open.

## Controlled discipline expansion

The codebase already supported three computed samples but used one generic
placeholder structure for engineering and reconstruction. That was enough to
exercise the pipeline, but not enough to demonstrate discipline depth.

The smart expansion is two **preview modules**, not two additional live
products:

- **Forensic engineering preview** — versioned against the active ASTM E3176-24
  informational guide and the Rule 26 backbone. It now asks neutral review
  questions about inspection conditions, instruments and calibration, methods,
  assumptions, limitations, alternative explanations, and the
  data-to-opinion path.
- **Accident reconstruction preview** — the fictional matter uses a
  critical-speed analysis, so the preview references SAE J2969 (2024) where
  applicable. It now surfaces calculation inputs and units, method
  applicability, uncertainty, and comparison with an independent
  reconstruction method.

Neither preview is wired into live drafting, saving, or export. Public copy
labels both as design-partner previews, sends each one to a preselected expert
application, and keeps vocational rehabilitation as the only founding pilot.
That captures adjacent-market demand without creating three weak products or
claiming validation that has not happened.

## Lead-funnel hardening

The post-preview funnel had two implementation defects that could lose the most
valuable prospects:

- The form allowed roughly 3,000 characters of discovery answers, while the API
  rejected request bodies over 2,048 bytes. Thoughtful applications could
  therefore fail after the browser accepted them. The route now accepts an
  8,192-byte bounded body, aligned with the validated fields.
- Supabase used `ignoreDuplicates: true` on email. If an expert joined the
  lightweight waitlist and later submitted the full design-partner application,
  the richer submission was silently discarded. Repeat submissions now merge:
  a full application upgrades the lead, while a later lightweight signup cannot
  erase the application.

Engineering and reconstruction preview entries now carry a constrained source
slug so conversion can be attributed without arbitrary tracking parameters.
Successful persistence logs only discipline, source, application status, and
whether an existing lead was upgraded—never the email or answer text. If storage
fails, the form exposes a direct founder-email fallback rather than leaving the
prospect at a dead end.
