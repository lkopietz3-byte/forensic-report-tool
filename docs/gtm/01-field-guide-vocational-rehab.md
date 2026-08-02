# 01 · Field guide — forensic vocational rehabilitation

> **Who this is for.** You, the founder of **Disclosed.** — a solo software
> builder, **not** a credentialed vocational-rehabilitation expert. The goal of
> this document is to make you fluent enough to hold a discovery or design-partner
> call with a real CRC/ABVE earning-capacity expert without sounding hollow. It is
> a crash course in *their* world so you can ask good questions and recognize good
> answers — not a script for pretending to be one of them.
>
> **The honest frame, up front.** Your value on that call is the tool and your
> willingness to listen and build. It is never a claim of vocational-rehabilitation
> expertise. A real expert can smell a faked credential instantly, and faking one
> is the fastest way to lose a referral community that runs entirely on trust. Lead
> with the part you genuinely understand — the AI-disclosure problem — and let the
> expert be the expert on everything else.
>
> **Two caveats that ride along with every fact in here.**
> 1. The methodology detail below traces to `discovery/vocrehab-template-spec.md`,
>    which is **DRAFT desk-research, not yet validated by a practicing expert.** The
>    template gets red-teamed by the design partner before it's gospel. Say so on
>    the call — it's a strength, not a weakness, that you know what hasn't been
>    confirmed yet.
> 2. The case-law summaries are **summaries, not legal advice.** Verify against the
>    official reporter. *Conservation Law Foundation v. Shell* in particular is a
>    **non-final** order under review and may change. This is general information;
>    Disclosed. is a software company, not a law firm; verify the rules for any
>    given jurisdiction.

---

## 1. What forensic vocational rehabilitation *is*

Vocational rehabilitation, in its everyday clinical form, helps an injured or
disabled person return to work — assessing what they can still do, what retraining
would help, and which jobs are realistic. **Forensic** vocational rehabilitation is
that same expertise pointed at a courtroom question: *because of this injury or
event, how much of this person's ability to earn a living has been lost, and what
is that loss worth in vocational terms?*

The deliverable is an **earning-capacity opinion** — typically a written report
under the expert's signature, often followed by deposition and trial testimony. The
expert is a neutral-in-method, retained-by-a-party witness whose job is to show a
defensible, reproducible chain of reasoning from the evidence to the conclusion.

Where it shows up in litigation:

- **Personal injury** — the core market. An accident leaves someone unable to do
  their old job; the question is the lost earning capacity.
- **Wrongful termination / employment** — lost earning capacity and the
  reasonableness of mitigation (did the plaintiff make a realistic effort to find
  comparable work).
- **Workers' compensation** — vocational capacity, retraining, and return-to-work.
- **Marital dissolution (divorce)** — imputed income / earning capacity of a
  spouse for support calculations.
- **FELA** (Federal Employers' Liability Act — railroad worker injury) and similar
  statutory schemes that turn on a worker's diminished capacity.
- **Medical malpractice, product liability, Social Security disability**, and other
  matters where what a person can still earn is contested.

The through-line: a contested dollars-and-cents question about *future ability to
earn*, where someone needs an expert to translate medical and vocational facts into
a defensible economic-vocational opinion.

---

## 2. Who these experts are, and their credentials

These are not interchangeable letters after a name. Knowing the difference is the
single fastest way to signal you've done your homework — and the fastest way to
look like a poser if you blur them.

### The vocational-rehabilitation experts

- **CRC — Certified Rehabilitation Counselor.** The foundational credential,
  granted by the **CRCC** (Commission on Rehabilitation Counselor Certification).
  This is the baseline professional certification in rehabilitation counseling.
  Many forensic experts hold it, but holding a CRC does **not** by itself mean
  someone does forensic earning-capacity work — plenty of CRCs work in clinical or
  state vocational-rehabilitation settings and never touch litigation.
- **ABVE — American Board of Vocational Experts.** This is the **forensic-specific**
  board. Its credentials are the **Diplomate (ABVE/D)** and **Fellow (ABVE/F)**.
  When you want the cohort that actually testifies on earning capacity, ABVE is the
  tighter, more forensic signal than CRC alone. ABVE maintains a forensic-oriented
  directory.
- **IARP — International Association of Rehabilitation Professionals**, and its
  **forensic section** (often associated with the *RehabPro* / forensic & SSA-VE
  community). This is a professional association and gathering place — listservs,
  document libraries, conferences — rather than a certification board.

> **Honest population note** (from the research, carry the caveat): there are on the
> order of **15,000+ active CRCs**, but the genuinely *forensic-active* subset — the
> people who write earning-capacity reports for litigation — is much smaller,
> roughly **ABVE-level, low-thousands.** Do not quote "16,500 forensic experts" on a
> call; the headline CRC count is not the forensic count. `[VERIFY: exact current
> ABVE membership / forensic-active count — research gives "low thousands" as a
> range, not a precise figure.]`

### The neighbors they are *not* (do not confuse these)

- **Life-care planner** — credentials like **CLCP** (Certified Life Care Planner,
  via **ICHCC**). A life-care planner builds the **future-cost-of-care** plan:
  medications, surgeries, equipment, therapy — the cost tables for a catastrophic
  injury. That is a *different deliverable* from an earning-capacity opinion. Some
  professionals do both, but the products are distinct. (In tooling terms,
  life-care-plan software — LCP Builder, ActiveLCP, Lifecarewriter — automates cost
  tables, not earning-capacity narratives.)
- **Forensic economist** — usually a PhD economist (sometimes a "vocational
  economist" who bridges both). The economist takes the vocational expert's
  earning-capacity *range* and does the **money math**: projecting the loss over the
  work-life, reducing it to **present value**, accounting for growth and discount
  rates. The vocational expert generally hands the present-value computation **off**
  to the economist — this hand-off point is a real seam in the work, and asking
  about it is a great call question (see §11).

A clean way to hold it in your head: **the vocational expert says *what kinds of
work this person can realistically still do and what that pays*; the economist says
*what the lifetime dollar loss is in today's money*; the life-care planner says
*what the future care will cost.*** They often appear in the same case and cite each
other.

---

## 3. What an earning-capacity report actually *does*

An earning-capacity report is an argument with a spine. Its job is to walk a reader
— ultimately a judge deciding admissibility, and a jury weighing it — from raw facts
to a defensible conclusion, with every step visible. The chain of reasoning it must
show, roughly:

1. **What was I asked?** The precise vocational/earning-capacity question and who
   retained the expert (scope must be explicit).
2. **Who is this person?** Demographics, education, work history, the injury, the
   relevant local labor market (commuting area).
3. **What did I review?** Every record considered — the raw material of the opinion.
4. **What can this person still do?** The adopted physical/cognitive restrictions
   and **where they came from** (treating physician, FCE, IME). These are the
   *driving assumptions*, and they must be visible.
5. **What work remains reachable?** The **Transferable Skills Analysis** — which
   occupations the person's skills still open up.
6. **Would they actually get hired?** The **labor-market survey** — real-world
   hireability in the local economy.
7. **What's the earning-capacity range, before vs. after?** Always a **range**,
   never a single point.
8. **How consistently can they work over a career?** Work-life / labor-force
   participation.
9. **What's the loss?** The pre-vs-post differential — with present-value math
   typically deferred to the economist.
10. **What are my opinions, and on what basis?** Each opinion tied back to the data
    that supports it.
11. **Who am I, and what's the housekeeping?** Qualifications, prior testimony, fee
    — the Rule 26 disclosure elements.

The single most important property of a good report is that the **data-to-opinion
path is visible at every step.** A reader should never have to take an "unsupported
leap" on faith from broad government data to a narrow conclusion about this specific
person. That visibility is what survives a Daubert challenge (see §6). It is also,
not coincidentally, exactly what Disclosed.'s grounding contract is built to make
mechanical: every factual sentence traces to a piece of evidence the expert
supplied, or it gets flagged.

---

## 4. The RAPEL methodology (Weed), component by component

**RAPEL** is the dominant peer-reviewed framework for earning-capacity opinions,
associated with **Dr. Roger Weed**. Courts treat it as a *recognized method*, which
is why grounding an opinion in RAPEL is itself a Daubert reliability point. It's an
acronym for five components, written **in sequence**, each building on the last.

> Carry the draft caveat: this is our desk-research reading of RAPEL, not an
> expert's. On a call, the move is "here's how I understand RAPEL maps to the
> sections — tell me where I have it wrong," not "RAPEL works as follows."

| Letter | Component | In plain English | Why a court cares |
| --- | --- | --- | --- |
| **R** | **Rehabilitation plan** | The vocational profile plus realistic interventions: retraining, therapy, their cost and duration. What would it actually take to get this person back to work? | Shows the expert considered *mitigation* — the person isn't simply written off; the loss is net of realistic recovery. |
| **A** | **Access to labor market** | How much of the labor market remains *reachable* given the person's residual abilities. **This is the home of the Transferable Skills Analysis (TSA).** | Quantifies the *shrinkage* of opportunity with a reproducible method, not a gut feeling. |
| **P** | **Placeability** | The real-world likelihood of actually being *hired* — accounting for restrictions, licensing, local hiring conditions, the economy. **This is where the labor-market survey is applied.** | "Could do the job" ≠ "would get the job." Placeability keeps the opinion honest about the actual labor market. |
| **E** | **Earning capacity** | Pre-injury vs. post-injury income potential, expressed as a **range — never a single number.** | A single point number invites cross-examination on false precision; a sourced range is defensible. |
| **L** | **Labor force participation** | Realistic work consistency over the remaining work-life — full-time, part-time, intermittent — and any **work-life-expectancy** reduction. | Capacity on paper isn't the same as a full career of steady work; this captures the difference. |

The reason RAPEL is a shield and not just a checklist: each component forces the
expert to *show their work* on a contested sub-question, and the whole thing is
peer-reviewed, so an opponent can't easily call it junk science. The standard
critique an opponent will reach for is not "RAPEL is bad" — it's "you didn't
actually *do* one of the RAPEL steps rigorously for *this* person."

In the Disclosed. template, the RAPEL components map to named sections like this:

- **R** → `rehabilitation_plan` (§ "Rehabilitation Plan")
- **A** → `transferable_skills` (§ "Transferable Skills Analysis")
- **P** → `labor_market_survey` (§ "Labor Market Survey")
- **E** → `earning_capacity` (§ "Pre-Injury vs. Post-Injury Earning Capacity")
- **L** → `labor_force_participation` (§ "Labor Force Participation and Work-Life")

---

## 5. The Transferable Skills Analysis (TSA) — the evidentiary spine

If RAPEL is the skeleton, the **TSA** is the backbone. It is the most technical,
most data-driven, most *checkable* part of the report — and therefore the part an
opponent attacks first and the part that, done well, anchors the whole opinion. When
an earning-capacity opinion gets excluded, it's very often because the TSA (or the
labor-market survey on top of it) had a hole.

### What a TSA actually does

It takes the person's **past relevant work**, breaks each job down into the skills
and worker traits it required, and then asks: *given the residual functional
capacity, which other occupations do those same transferable skills open up?* The
output is a defensible list of target occupations the person could move into.

### The coding system and worker traits

Past work is coded to the **DOT** (Dictionary of Occupational Titles) and described
with a standard set of worker traits. The ones you'll hear:

- **SVP — Specific Vocational Preparation.** How long it takes to learn to do a job
  competently. A key rule of thumb: occupations below **SVP 3** generally aren't
  considered to carry "transferable" skills (they're learned too quickly to
  represent acquired skill).
- **GED — General Educational Development.** *Not* the high-school equivalency
  diploma — in this world GED is a three-part **Reasoning / Math / Language**
  developmental scale describing a job's general demands. A skill match *fails* if a
  target occupation's GED or aptitude levels are **exceeded** by what the person can
  do — i.e., you can't transfer someone *up* into work beyond their measured levels.
- **Aptitudes, temperaments, physical demands, environmental conditions**, and the
  **Data / People / Things** framework — additional trait dimensions in the DOT
  worker-trait profile.
- **Work Field** and **MPSMS** codes — MPSMS is *Materials, Products, Subject
  matter, Services* — the *content* of the work (what's being worked on / produced),
  used to find genuinely related occupations.

### The data sources

- **DOT** — the classic occupational coding system (older, but still the forensic
  lingua franca for worker-trait detail).
- **O\*NET** — the modern U.S. Department of Labor occupational database, reached
  from DOT codes via the **O\*NET–DOT crosswalk** (and on to **SOC** codes) for
  updated occupational content.
- **BLS / Census** — Bureau of Labor Statistics and Census data for **wages and
  employment** numbers attached to the target occupations.

### The tools

- **OASYS** and **SkillTRAN** — the standard software engines that run the TSA
  matching. (SkillTRAN's products include **Job Browser Pro** and the **OASYS**
  TSA system; functions you'll hear named include **TSS** and **PREPOST** for
  pre/post-injury comparison.) **McCroskey MVQS** is another job-person matching /
  TSA engine in this space.

> Important nuance for the call, and for the product line: these tools do the
> **matching**, but the **selection** — deciding which matched occupations are
> *genuinely realistic for this specific person* — is **expert judgment**, not
> something the software (or Disclosed.) should originate. The incumbents (OASYS,
> Job Browser Pro, MVQS) are **data engines that output modular labor-market data
> and TSA tables — they explicitly do not generate the integrated narrative report
> or the forensic conclusions.** That gap is precisely the lane Disclosed. sits in:
> structuring the expert's *own* selections and reasoning into the report, never
> picking the occupations for them.

### The report output

A **table of target occupations tiered by transferability strength** — from
strongest to weakest, with labels along the lines of **Direct-Closest → Closely →
Generally-Good → Fair → Potential** — each row carrying wage data and any training
required. This table is the **evidentiary spine** of the Access (A) and
earning-capacity (E) opinions: it's the concrete, sourced bridge from "here's what
this person did" to "here's what they can still earn."

> `[VERIFY: the exact tier labels courts/experts expect on the TSA table — the
> spec lists "Direct-Closest → Closely → Generally-Good → Fair → Potential" but
> flags confirming the precise wording as an open question for the design partner.]`

---

## 6. How Rule 26(a)(2)(B) and Daubert / Rule 702 apply

Two legal frameworks govern the report. Neither is an "AI rule" — they're the
ordinary rules every expert report has always lived under.

### Rule 26(a)(2)(B) — *what a report must contain*

Federal Rule of Civil Procedure **26(a)(2)(B)** lists the **six required elements**
of a retained expert's written report. Disclosed. is **"Rule 26(a)(2)(B)-structured"**
— organized to this format, tracking every element — but note the honesty line:
*structured to the format* is the claim, **never** "compliant" or "guaranteed."
Compliance is a legal conclusion, not the tool's to assert.

The six elements:

1. **(i)** All **opinions** the witness will express, and the **basis and reasons**
   for them.
2. **(ii)** The **facts or data** the witness considered in forming the opinions.
3. **(iii)** Any **exhibits** that will be used to summarize or support the opinions.
4. **(iv)** The witness's **qualifications**, including all **publications in the
   previous 10 years**.
5. **(v)** A list of all other cases in which the witness **testified** (at trial or
   deposition) in the previous **4 years**.
6. **(vi)** A statement of the **compensation** to be paid for the study and
   testimony.

### Daubert / Rule 702 — *whether the opinion is reliable enough to come in*

**Federal Rule of Evidence 702** (amended **December 1, 2023**) is the gatekeeping
standard. As amended, it requires that the opinion rest on **sufficient facts or
data** and reflect a **reliable application of reliable methods**, and it puts the
**burden on the party offering** the expert. The *Daubert* line of cases is the
judicial framework courts use to apply that reliability screen.

The practical point for a vocational expert: an opinion can be excluded — kept out
entirely — if the methodology doesn't hold up. The specific **failure modes** that
get vocational opinions excluded (these are the validators Disclosed. is built to
guard against):

- **No visible data→opinion path** — "unsupported leaps" from broad government data
  straight to a narrow conclusion about this person, with the reasoning steps
  missing.
- **Generic job titles disconnected from the evaluee's actual circumstances** — a
  list of occupations that could apply to anyone, not tied to *this* person's real
  restrictions and history.
- **Weak labor-market-survey methodology** — non-representative sampling. The
  classic discredited example is the **"equal distribution method,"** criticized in
  ***Hohman v. Kijakazi.***
- **Over-reliance on uncorroborated self-report** — leaning on what the evaluee
  *said* about their limitations instead of grounding restrictions in medical / FCE
  sourcing.
- **Functional assumptions or qualifications not stated** — the driving assumptions
  (what restrictions were adopted, from where) left invisible, or not tied to the
  specific opinion.

The **shields** against all of this: RAPEL's peer-reviewed status, transparent
methodology, recognized government data sources (DOT/O\*NET/BLS/Census), and
**explicit assumptions**. Notice that every shield is about *showing your work* —
which is the same thing the grounding-and-disclosure layer of the product makes
automatic.

---

## 7. The AI-disclosure legal moment (the part *you* own)

This is the section you understand best and should lead with. It's the genuine
reason Disclosed. exists, and it's a topic where you can speak with real (if
carefully bounded) authority — as someone who has read the cases closely, not as a
lawyer.

The headline: for two years the AI-in-litigation story was about *lawyers* filing
briefs citing cases that don't exist. **It has now moved to the expert witness
stand.** Five decisions frame the moment. Note the contrast — what *sank* experts
vs. the one **safe-harbor** pattern that held — and the critical caveat on the fifth.

**The ones that got experts hurt** (in each, the AI introduced something the expert
didn't supply and didn't catch — the *unverified output*, not "using AI," did the
damage):

- **Kohls v. Ellison** (D. Minn., Jan. 10, 2025) — an expert used GPT-4o to expand
  his notes and let it **fill in citations**; it produced articles that don't exist
  and misattributed another. The court **struck the entire declaration**, writing
  the fabrications **"shatter[ed] his credibility with this Court"** — and noted the
  irony of a *misinformation* expert failing to verify AI output.
- **Concord Music Group v. Anthropic** (N.D. Cal., May 2025) — a declaration cited a
  **real journal** (right volume, page, year, link) but with a **title and authors
  the AI invented.** The court struck the paragraph: there is **"a world of
  difference between a missed citation and a hallucination generated by AI."**
- **Matter of Weber** (N.Y. Surrogate's Court, 2024) — an expert used a chatbot to
  **"check" his valuation math** but couldn't recall the prompts or explain the
  tool's methodology. The valuation was found **unreliable.**

**The one that was fine — the safe-harbor pattern Disclosed. is built to support:**

- **Ferlito v. Harbor Freight Tools** (E.D.N.Y., Apr. 2025) — a long-experienced
  expert **drafted his report independently** and used AI only to **confirm
  conclusions he had already reached on his own.** The testimony was **allowed.** The
  difference wasn't whether AI touched the work — it was that the **expert's own
  judgment drove the opinion**, the AI originated nothing, and he could stand behind
  every word.

**The new frontier — discoverability — with the caveat you must always state:**

- **Conservation Law Foundation v. Shell Oil** (D. Conn.) — a **magistrate judge**
  ordered an expert to produce the **AI prompts** she used to narrow a document
  production, holding the prompts were **"part of that methodology and therefore
  discoverable"** under Rule 26, and rejecting the argument they were protected
  "notes."
  **The non-final caveat (say this every single time):** this is a **magistrate**
  decision that has been **objected to under Rule 72(a) and stayed pending the
  district judge's review.** It is a **signal of direction, not settled law**, and it
  **may change.** Never present it as a binding rule.

The synthesis — and the honest pitch — is: *the safe posture is the one good experts
have always had, "own your methodology," extended to a new tool you should expect to
be asked to explain.* That's not fearmongering and it's not a compliance mandate;
it's "get ahead of an emerging discovery risk." Background you can cite: **Fed. R.
Evid. 702** (amended Dec. 1, 2023) and **ABA Formal Opinion 512** (AI use is
**permitted** with competence + disclosure). Lead with the *permission and the fix*,
not the threat.

> Every time you discuss these on a call or in writing: *these are summaries, not
> legal advice; verify against the official reporter; CLF v. Shell is non-final and
> may change; Disclosed. is not a law firm.*

---

## 8. How to talk on a call when you're a builder, not an expert

This is the most important section in the document. Internalize the posture and the
specific phrasings; they're the difference between a second call and a polite
brush-off.

### The posture, in five rules

1. **Lead with humility and the part you own.** You understand the AI-disclosure
   problem and you've built a tool. You do **not** understand earning-capacity
   methodology the way they do. Open from there. It disarms the skepticism instantly
   because it's *true*, and they can tell.
2. **Ask, don't assert.** Every domain statement should be a question or a
   check-my-understanding, not a pronouncement. You're there to learn how *they*
   work, not to teach them their field.
3. **Never fake a credential or a war story.** Don't imply you've written reports,
   testified, sat for a Daubert hearing, or "worked with a lot of vocational
   experts" if you haven't. One fabricated detail and the trust is gone — and in a
   referral community, it doesn't come back.
4. **Your value is the tool plus listening.** You're not selling expertise you lack;
   you're offering to *build the thing that makes their existing expertise faster to
   put on paper, with a disclosure trail.* That's a legitimate, valuable offer. Say
   it plainly.
5. **Let them be the expert.** The most productive call is one where they talk 70%
   of the time and you take notes. Treat being corrected as the **best** outcome —
   it's exactly the validation the draft template needs.

### Concrete phrasings — good vs. bad

**On your own background:**

- ✅ "I'm a software builder, not a vocational expert — so I'm going to be asking you
  a lot of questions today, and correcting me is the most useful thing you can do."
- ✅ "I've spent a lot of time on the AI-disclosure side, because that's where I
  think the real risk is heading. The vocational methodology I've only read about,
  so tell me where my reading is naïve."
- ❌ "Our RAPEL-based engine handles your earning-capacity analysis." *(Implies the
  tool originates the opinion — violates the product's core invariant **and** marks
  you as someone who doesn't understand the field's ethics.)*
- ❌ "I've worked with a lot of vocational experts on this." *(If you haven't, this is
  the lie that ends the relationship.)*

**On the methodology:**

- ✅ "My understanding is that the TSA is really the evidentiary spine — the
  occupations table is what an opponent attacks first. Is that how you'd put it?"
- ✅ "I've encoded a 19-section structure around RAPEL, but honestly I don't know if
  that's the right granularity or whether you'd collapse some sections. Where would
  you push back?"
- ❌ "RAPEL requires five sections and we've automated all of them." *(Overclaims
  certainty on a draft you haven't validated, and again implies the tool does the
  analysis.)*

**On what the tool does (stay inside the honesty rules):**

- ✅ "The tool **structures your own findings** into the Rule 26 format and keeps a
  record of how AI was used. The prompt is restricted to the evidence you supply,
  source IDs are checked, and you independently verify, prepare, adopt, and sign."
- ✅ "Where there's a gap, it flags it for you — `[Expert input needed]` — instead of
  silently filling it in. A valid source marker still needs your substantive
  verification."
- ❌ "It drafts your report / generates your findings / writes it for you." *(Banned
  verbs. To this audience these are not just inaccurate — they're the exact thing
  that gets experts struck on cross-examination, so the phrasing actively
  *frightens* them.)*
- ❌ "It's court-defensible / admissible / Rule 26-compliant." *(Admissibility is the
  court's call. Say "Rule 26(a)(2)(B)-structured," "designed to support
  disclosure.")*

**On the draft template (turn the caveat into credibility):**

- ✅ "This template is desk-research right now — it hasn't been validated by a
  practicing expert. That's exactly why I'm talking to you. I'd rather have you
  red-team it than ship something that sounds right and isn't."
- ❌ "Our template is the standard earning-capacity format." *(It isn't yet, and
  claiming so is precisely the overstatement this audience is trained to catch.)*

**When you don't know something (this will happen often — handle it well):**

- ✅ "I don't know — that's outside what I understand. Can you walk me through how
  *you* do it?"
- ✅ "Tell me if I'm using that term wrong."
- ❌ Bluffing a term you half-remember. If you're not sure whether GED means the
  diploma or the developmental scale, **ask** — guessing wrong in front of an expert
  is a tell.

The meta-point: this audience punishes hype and rewards precision and candor. The
voice of the product — **precise, calm, accountable** — is also the right voice for
the call. You are not at a disadvantage by being "only" a builder; you're at a
disadvantage only if you *pretend not to be one.*

---

## 9. Go-deeper reading list

Curated from the sources in `discovery/vocrehab-template-spec.md`, the resources
article, and the named associations. Treat these as *primary-ish* desk sources to
deepen your fluency — not as expert validation.

### Methodology — RAPEL, TSA, Daubert

- **RAPEL Model explained** — KWVRS · <https://kwvrs.com/rapel-model-explained/>
- **Daubert / Rule 702 Readiness Checklist** — KWVRS ·
  <https://kwvrs.com/daubert-rule-702-readiness-checklist/>
- **Daubert & Earning Capacity** — Stokes & Associates ·
  <https://www.stokes-associates.com/blog/2022/2/17/daubert-standard-for-admissibility-when-assessing-earning-capacity>
- **TSA Defined** — SkillTRAN ·
  <https://skilltran.com/index.php/support-area/transferable-skills>
- **TSA Data Resources (DOT / SVP / MPSMS)** — SkillTRAN (PDF) ·
  <https://www.skilltran.com/pubs/SkillTRAN_DataResources.pdf>

### Rule 26 and the case law

- **Rule 26(a)(2)(B) Disclosure Guide for Expert Witnesses** — Expert Institute ·
  <https://www.expertinstitute.com/resources/insights/rule-26-federal-rules-of-civil-procedure-a-disclosure-guide-for-expert-witnesses/>
- ***Hohman v. Kijakazi* analysis** (vocational analysis under judicial review) —
  Expert Witness Blog ·
  <https://www.expertwitnessblog.com/employment-expert-witness-testimony-under-scrutiny-vocational-analysis-and-judicial-review-in-hohman-v-kijakazi/>
- **The AI-disclosure article on our own site** —
  `src/app/resources/ai-disclosure-in-expert-reports/page.tsx` — has the full,
  honesty-checked write-ups of all five cases (Kohls, Concord, Weber, Ferlito,
  CLF v. Shell) with citations and the non-final caveat. This is your canonical
  reference for talking about the legal moment; it's already been through the voice
  and honesty review.

### The associations (know the names; these are the distribution channels too)

- **CRCC** — Commission on Rehabilitation Counselor Certification (grants the CRC).
- **ABVE** — American Board of Vocational Experts (the forensic-specific board;
  Diplomate / Fellow; forensic directory).
- **IARP** — International Association of Rehabilitation Professionals, and its
  **forensic / SSA-VE section** (*RehabPro* community; listservs; 2026 Washington
  conference).
- **ICHCC** — International Commission on Health Care Certification (grants the
  **CLCP** for life-care planners — the adjacent expansion market, *not* the same
  deliverable).

### Internal references worth re-reading before any call

- `docs/gtm/00-content-brief.md` — the governing brief; the only grounded facts you
  may state, and the honesty rules.
- `docs/VOICE.md` — the canonical voice (the call voice, too).
- `discovery/vocrehab-template-spec.md` — the full draft template spec, with the
  open questions for the design partner at the bottom (those open questions are
  *excellent* call material — they're the things a real expert can settle for you).
- `src/lib/domain/template.ts` — the actual encoded 19-section template, so you can
  speak accurately about the section names and order.
- `docs/gtm/02-cheatsheet-and-glossary.md` — the one-screen quick reference to keep
  open *during* the call.

---

> **Final reminder.** Everything methodological here rides on draft, not-yet-expert-
> validated desk research, and everything legal here is a summary, not advice. The
> point of this guide is not to let you *perform* expertise — it's to let you ask
> sharp questions, recognize good answers, and be honest about the line between what
> you've built and what you've read. That honesty is the asset. Don't trade it for a
> credential you don't have.
