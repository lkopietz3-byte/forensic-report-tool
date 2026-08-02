# Audit 10 — Legal Documents & Disclaimers Gap Analysis
**Scope:** Identify every legal document and disclaimer this product needs; provide prioritized starter drafts tailored to Disclosed.; flag UPL risk; enumerate must-haves before real case data is accepted.

---

> **ATTORNEY REVIEW REQUIRED — READ THIS FIRST**
>
> Nothing in this file is legal advice. I am an AI assistant, not a licensed attorney. Every draft below is a non-final starting point for discussion with a licensed attorney who can advise on the specific jurisdiction(s), regulatory obligations, and risks of this product. Do NOT publish any of these drafts without competent legal counsel review. This caveat applies to every section of this document.

---

## 1. Complete Inventory of Legal Documents Needed

### TIER 1 — Needed NOW (waitlist / marketing page is live)

These create legal exposure the moment a person submits their email.

| # | Document | Why It's Needed Now |
|---|----------|---------------------|
| 1 | **Privacy Notice (short-form, waitlist-specific)** | Email addresses are PII. Collecting them without any disclosure of purpose, storage, and sharing violates CAN-SPAM, and may violate CCPA (California) and similar state laws. The waitlist form has no privacy link at all. |
| 2 | **Terms of Service (or Terms of Use)** | The site makes material representations about the product (no fact-origination, encryption, no training). Those representations need to be paired with disclaimers and limitations. Users already see pricing; without ToS, implied contracts may form on unfavorable terms. |
| 3 | **AI-Use Disclaimer / Expert Authorship Notice** | The marketing page already states "Nothing is invented" and "Confidential by commitment." Without a legal disclaimer, these could be read as warranties. A brief disclaimer on the marketing page is needed now. |
| 4 | **Footer "not legal advice / expert is sole author" one-liner** | UPL risk is live the moment the tool is described as producing court-usable documents. |

### TIER 2 — Needed Before MVP Accepts Real Case Data

| # | Document | Why It's Needed Then |
|---|----------|----------------------|
| 5 | **Full Privacy Policy** | Required the moment any case data (even file names) is uploaded. CCPA, state privacy laws, and common-law obligations apply. |
| 6 | **Data Processing Agreement (DPA)** | Litigation data may be under protective order or constitute attorney work product. Firm and Firm Unlimited customers will almost certainly require a DPA as a condition of use. Enterprise sales will stall without one. |
| 7 | **Acceptable Use Policy (AUP)** | Must define what case data may be submitted, prohibit use for manufacturing or fabricating evidence, prohibit submission of data from matters where the expert has been barred, etc. |
| 8 | **Limitation of Liability / Disclaimer of Warranties (in ToS)** | Before real case data: must cap liability well below the value of litigation the tool touches, disclaim fitness for a particular purpose, and disclaim any guarantee of admissibility. |
| 9 | **Expert Authorship & Responsibility Attestation** (in-app, per-report) | At report-finalization, the expert should click through a one-screen attestation confirming they have reviewed and adopt all content. This is the behavioral companion to the AI-Disclosure Appendix. |
| 10 | **Security & Confidentiality Commitments (in ToS or separate)** | The marketing page promises encryption in transit/at rest and zero-retention with the model provider. These representations must be formalized. |
| 11 | **Cookie / Tracking Notice** | Required if any analytics or tracking beyond basic server logs is used. |

---

## 2. Starter Draft Language

> All drafts below are non-final starting points. Attorney review required before publication.

---

### 2a. Terms of Service — Key Clauses

**Suggested route:** `/terms`
**Link from:** Footer, waitlist form, pricing section, in-app sign-up flow.

---

#### Clause 1 — Expert Is the Sole Author and Responsible Signer

```
EXPERT AUTHORSHIP AND RESPONSIBILITY

Disclosed. is a formatting and structuring tool only. It does not originate facts,
opinions, data, measurements, citations, or conclusions. All factual and
professional content in any output derives exclusively from materials the Expert
supplies.

By using this Service, you represent and warrant that:
  (a) you are a qualified forensic expert within your stated discipline;
  (b) you have reviewed, verified, and independently validated every statement,
      citation, and conclusion in any report before signing or disclosing it;
  (c) you, not Disclosed. or its operators, are the sole author of the finalized
      report for all purposes, including but not limited to Federal Rule of Civil
      Procedure 26(a)(2)(B) and any equivalent state rule;
  (d) you bear sole professional and legal responsibility for the accuracy,
      completeness, and admissibility of any report you produce using this
      Service.

Disclosed. makes no representation that use of this Service will make any report
admissible in any proceeding, or that any output will satisfy any court's
requirements. Admissibility determinations are exclusively within the authority
of the court and the parties.
```

---

#### Clause 2 — No Warranty of Admissibility or Accuracy

```
DISCLAIMER OF WARRANTIES

THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE." TO THE FULLEST EXTENT
PERMITTED BY APPLICABLE LAW, DISCLOSED. DISCLAIMS ALL WARRANTIES, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO:
  (a) any warranty that the Service will produce reports that are admissible,
      legally sufficient, or procedurally compliant in any jurisdiction or
      proceeding;
  (b) any warranty that the output will be free from errors, omissions, or
      inaccuracies;
  (c) any warranty of fitness for a particular purpose, including use in
      litigation;
  (d) any warranty that the AI-Disclosure Appendix will satisfy any specific
      court's disclosure requirements.

The Expert, as the reviewing and signing professional, remains solely responsible
for verifying all output before use.
```

---

#### Clause 3 — Limitation of Liability

```
LIMITATION OF LIABILITY

TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW:

  (a) IN NO EVENT WILL DISCLOSED. OR ITS OFFICERS, EMPLOYEES, AGENTS, LICENSORS,
      OR SERVICE PROVIDERS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
      CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, LOSS OF DATA,
      LOSS OF CASE, OR DAMAGE TO PROFESSIONAL REPUTATION, ARISING OUT OF OR IN
      CONNECTION WITH YOUR USE OF THE SERVICE, WHETHER BASED ON WARRANTY,
      CONTRACT, TORT (INCLUDING NEGLIGENCE), STATUTE, OR ANY OTHER LEGAL THEORY.

  (b) DISCLOSED.'S TOTAL CUMULATIVE LIABILITY TO YOU FOR ANY CLAIM ARISING OUT OF
      OR RELATED TO THESE TERMS OR THE SERVICE WILL NOT EXCEED THE GREATER OF
      (i) THE TOTAL FEES PAID BY YOU TO DISCLOSED. IN THE TWELVE (12) MONTHS
      PRECEDING THE CLAIM, OR (ii) ONE HUNDRED U.S. DOLLARS ($100).

  (c) SOME JURISDICTIONS DO NOT ALLOW CERTAIN LIABILITY EXCLUSIONS OR CAPS.
      IN THOSE JURISDICTIONS, LIABILITY IS LIMITED TO THE MINIMUM EXTENT
      PERMITTED BY LAW.

[ATTORNEY NOTE: The $100 floor is a placeholder. Counsel should advise on what
cap is defensible, enforceable, and commercially reasonable for this market.]
```

---

#### Clause 4 — Acceptable Use

```
ACCEPTABLE USE

You agree that you will NOT use the Service to:
  (a) fabricate, manufacture, or introduce into a report any fact, opinion,
      measurement, citation, or conclusion that you have not independently
      verified from the source materials you supplied;
  (b) submit materials that you are prohibited by court order, protective order,
      or professional rules from disclosing to a third-party service;
  (c) submit materials that are subject to attorney-client privilege where upload
      to a third-party service would constitute a waiver (consult your supervising
      attorney);
  (d) use output in any matter where you have been formally disqualified, barred,
      or where a conflict of interest exists that prohibits such use;
  (e) reverse-engineer, probe, or attempt to extract the underlying models,
      system prompts, or confidential logic of the Service;
  (f) submit synthetic, fabricated, or fraudulent case materials for the purpose
      of generating false expert evidence;
  (g) allow any person other than a qualified forensic expert to sign or adopt
      reports produced by the Service as their own professional opinion.

Violation of this Acceptable Use Policy may result in immediate termination of
your account, referral to relevant licensing boards, or cooperation with legal
authorities.
```

---

#### Clause 5 — IP Ownership of the Expert's Deliverable

```
INTELLECTUAL PROPERTY AND REPORT OWNERSHIP

  (a) Your Content. You retain all right, title, and interest in and to the
      source materials you upload ("Your Content") and in the finalized report
      you produce, review, and sign using the Service.

  (b) No Training Use. Disclosed. will not use Your Content or the outputs
      generated from Your Content to train, fine-tune, or improve any AI model,
      whether operated by Disclosed. or any third-party model provider.
      [ATTORNEY NOTE: Verify this is contractually enforceable against current
      and future model providers; obtain written confirmation.]

  (c) Service IP. The Service's underlying software, models, prompts, UI,
      AI-Disclosure Appendix format, and audit-log methodology are proprietary
      to Disclosed. You receive a limited, non-exclusive, non-transferable
      license to use the Service during your subscription term.

  (d) Feedback. If you voluntarily provide feedback about the Service, Disclosed.
      may use that feedback without restriction or compensation, provided it does
      not reveal Your Content.
```

---

#### Clause 6 — No Training on Customer Data (standalone callout)

```
NO TRAINING ON YOUR CASE DATA

We will not use any materials you upload, any report drafts generated, or any
content of your work sessions to train, fine-tune, or evaluate any AI or
machine-learning model. Your case data is processed solely to produce the output
you requested and is not retained beyond the period necessary for that purpose
and any legally required retention. See our Privacy Policy for retention details.
```

---

#### Clause 7 — Termination

```
TERMINATION

  (a) By You. You may terminate your account at any time by [describe process].
      Termination does not entitle you to a refund of unused credits unless
      required by applicable law.

  (b) By Us. We may suspend or terminate your access, with or without notice,
      if we reasonably believe you have violated these Terms or the Acceptable
      Use Policy, or if continued access poses a legal, regulatory, or
      reputational risk to the Service or to other users.

  (c) Effect of Termination. Upon termination, your license to use the Service
      ceases. We will delete or return Your Content in accordance with our
      Privacy Policy and, if applicable, any Data Processing Agreement in effect.
      Provisions of these Terms that by their nature should survive termination
      (including disclaimers, limitations of liability, and dispute resolution)
      will survive.
```

---

### 2b. Privacy Policy — Outline + Key Sections

**Suggested route:** `/privacy`
**Link from:** Footer, waitlist form (mandatory inline link), account sign-up, cookie banner if applicable.

---

```
PRIVACY POLICY — OUTLINE
Last updated: [DATE]

1. WHO WE ARE
   Disclosed. is operated by [Legal Entity Name], [State] [Entity Type].
   Contact: [privacy@disclosed.example.com]

2. WHAT WE COLLECT

   a. Waitlist data: email address, discipline selection, referral source.
      Stored in [Supabase / local file depending on configuration].

   b. Account data (when accounts launch): name, email, billing information,
      professional credentials (discipline, certification numbers if collected).

   c. Case materials (when data upload launches): documents, photos, notes, and
      other materials the expert uploads. These may include litigation-sensitive,
      privileged, or protective-order-covered information. See Section 5.

   d. Usage data: log data, IP addresses, session identifiers, feature usage
      patterns.

   e. Communications: any email or support correspondence.

3. HOW WE USE YOUR DATA

   - To operate and improve the Service.
   - To contact waitlist members about early access (with opt-out in every email).
   - To generate report drafts and AI-Disclosure Appendices from Your Content.
   - We do NOT use Your Content (case materials or outputs) to train any AI model.
   - We do NOT sell your personal data.

4. LEGAL BASIS (GDPR-RELEVANT — IF EU/UK USERS ARE ANTICIPATED)
   [Attorney should advise whether GDPR applies based on target market.
   For US-only: note applicable state laws — CCPA, CPA, etc.]

5. LITIGATION-SENSITIVE DATA — SPECIAL HANDLING

   We recognize that case materials may be subject to:
   - Attorney-client privilege
   - Work-product doctrine
   - Protective orders issued by courts
   - Professional confidentiality obligations (state rules of professional
     conduct, expert witness ethical codes)

   It is YOUR responsibility to confirm that uploading materials to this
   Service does not violate any applicable privilege, protective order, or
   professional obligation. We provide [describe data-handling controls:
   encryption in transit (TLS 1.2+), encryption at rest (AES-256), zero-
   retention path with model provider, etc.] but we are not a law firm and
   cannot advise you on whether upload is permissible in your specific matter.

6. SHARING AND DISCLOSURE

   We do not sell personal data.
   We share data only:
   - With infrastructure providers necessary to operate the Service (list them:
     e.g., Supabase, Vercel, Anthropic / Claude API). These are subject to
     data-processing agreements with no-training commitments.
   - If required by law, court order, or valid legal process (we will notify
     you to the extent legally permitted).
   - In connection with a sale or merger of the business (you will be notified).

7. RETENTION

   Waitlist data: retained until you request deletion or [X] months after
   the product launches without your registration converting to an account.
   Case materials: retained for [X days] after report finalization; permanently
   deleted on request or upon account termination. Audit logs supporting the
   AI-Disclosure Appendix are retained for [X period] to support discoverability.
   [ATTORNEY NOTE: Retention periods for litigation-support data may need to
   align with litigation hold obligations. Counsel should advise.]

8. YOUR RIGHTS

   Depending on your jurisdiction:
   - Access, correction, deletion of your personal data.
   - Opt out of email communications (unsubscribe link in every email).
   - For California residents: CCPA rights including right to know, right to
     delete, right to opt out of sale (we do not sell).
   [ATTORNEY NOTE: Confirm applicable state privacy law obligations.]

9. SECURITY

   [Describe actual controls: TLS in transit, AES-256 at rest, access controls,
   incident response, etc.]

10. CHILDREN

    This Service is not directed to persons under 18. We do not knowingly collect
    data from minors.

11. CHANGES TO THIS POLICY

    We will post changes here and update the "Last updated" date. For material
    changes affecting case-data handling, we will provide 30 days' notice.

12. CONTACT

    [Legal Entity Name]
    [Address]
    [privacy@disclosed.example.com]
```

---

### 2c. Expert Authorship & Responsible Use / AI-Use Disclaimer

This should appear as both:
1. A persistent, visible notice on the marketing page (see §2d below).
2. An in-app attestation the expert clicks through before each report is finalized and exported (pre-launch, can be a checkbox on the waitlist/onboarding form).

---

**IN-APP ATTESTATION — PER-REPORT FLOW (suggested checkbox + modal)**

```
EXPERT AUTHORSHIP ATTESTATION

Before exporting this report, please confirm:

[ ] I am a qualified forensic expert in [discipline] and am authorized to
    prepare and sign expert witness reports in this matter.

[ ] I have reviewed every factual statement, citation, data reference, and
    opinion in this report draft. I independently verified each against the
    source materials I supplied.

[ ] I understand that Disclosed. is a formatting and structuring tool only.
    It did not originate any fact, opinion, measurement, or citation in this
    report. All professional content is mine.

[ ] I am the sole author of this report for purposes of Federal Rule of Civil
    Procedure 26(a)(2)(B) and any applicable state equivalent. I accept full
    professional responsibility for its contents.

[ ] I understand that this tool does not constitute legal advice, and that
    Disclosed. makes no representation regarding the admissibility or
    sufficiency of this report in any proceeding.

[ ] I have confirmed with supervising counsel (if applicable) that uploading
    the materials I provided does not violate any protective order, privilege,
    or professional obligation.

By clicking "Export Report," I adopt the contents of this report as my own
professional opinion and attest to the accuracy of the AI-Disclosure Appendix.
```

---

**WAITLIST / ONBOARDING VERSION (shorter)**

```
By requesting early access, you acknowledge that Disclosed. is a formatting
tool only; you, the expert, remain the sole author and responsible signer of
any report you produce. See our [Terms of Service] and [Privacy Policy].
```

---

### 2d. Footer Disclaimer + "Not Legal Advice" Notice

**Footer disclaimer line (replace or supplement the current "You author and sign every report. We structure your findings and prove how."):**

```
You author and sign every report. We structure your findings and prove how.
Disclosed. is a formatting tool, not a law firm. Nothing here is legal advice.
Use subject to [Terms] · [Privacy].
```

**One-line "not legal advice" notice (for header, feature callouts, or anywhere the product describes court-defensibility):**

```
Not legal advice. Admissibility is determined by the court. The expert is the sole author and responsible signer.
```

**Hero / "court-defensible" callout note:**
The headline "Court-defensible expert reports" is a strong marketing claim. Counsel should advise on whether this language creates a warranty of admissibility or constitutes UPL. A nearby asterisk or sub-line clarifying that "court-defensible" refers to the structured AI-disclosure record — not a guarantee of admissibility — is strongly recommended.

---

## 3. Unauthorized Practice of Law (UPL) Risk Analysis

> This section identifies risk; it does not constitute legal advice. Consult a licensed attorney.

### The Risk

UPL statutes prohibit non-lawyers from providing "legal advice" or "legal services." The risk for Disclosed. is twofold:

1. **The product produces documents used directly in legal proceedings.** Expert witness reports are submitted to courts under FRCP 26 and are quoted in briefs, relied on by judges, and can determine case outcomes. A tool that generates these documents sits very close to the UPL line.

2. **Marketing language creates implied professional representations.** Terms like "court-defensible," "every Rule 26(a)(2)(B) element accounted for," and "AI-disclosure ready" could be read by a regulator or plaintiff's attorney as a claim that the tool produces legally adequate documents.

### How the Positioning Avoids (Most of) the Risk

The following existing design choices, if properly documented and maintained, substantially reduce UPL exposure:

| Safeguard | Why It Helps |
|-----------|-------------|
| Tool structures only; expert originates all content | The tool is more analogous to Microsoft Word than to a legal drafting service |
| Expert reviews, verifies, and signs | Professional responsibility stays with the licensed expert, not the tool |
| AI-Disclosure Appendix documents the tool's role exactly | Transparency about the tool's limited function |
| No legal conclusions, no admissibility guarantees | Tool does not advise on legal strategy or procedure |

### Remaining Risk Mitigations (attorney must advise on these)

- Add explicit "not a law firm / not legal advice" language everywhere the product is described.
- Avoid implying the tool selects legal strategy, advises on what to include or exclude from a report, or tells the expert how to answer Daubert challenges.
- The phrase "court-defensible" should be softened or qualified (e.g., "structured for court-ready AI disclosure").
- Consider a legal opinion letter from counsel confirming the tool's classification as software, not legal services, in key target states (CA, TX, NY, FL).

---

## 4. Must-Have-Before-Real-Case-Data Checklist

This is the absolute minimum gate before any user uploads case materials:

- [ ] **Terms of Service published** at `/terms`, linked from footer and sign-up flow
- [ ] **Privacy Policy published** at `/privacy`, linked from footer, waitlist form, and sign-up flow
- [ ] **In-app Expert Authorship Attestation** implemented as a required per-report checkpoint
- [ ] **AI-Use Disclaimer** visible on landing page, onboarding, and report generation screens
- [ ] **Data Processing Agreement template** ready for Firm/Firm Unlimited customers who request it
- [ ] **No-training contractual confirmation** obtained in writing from all model providers used
- [ ] **Waitlist form updated** to include inline privacy notice link ("By submitting, you agree to our [Privacy Policy]")
- [ ] **Footer updated** with Terms + Privacy links and "not legal advice" language
- [ ] **Security controls verified** before documenting them in the Privacy Policy
- [ ] **Legal counsel review** of all documents above

---

## 5. Where These Documents Should Live

| Document | Route | Also Linked From |
|----------|-------|-----------------|
| Terms of Service | `/terms` | Footer, waitlist form, pricing, sign-up flow, in-app settings |
| Privacy Policy | `/privacy` | Footer, waitlist form (inline: "See our Privacy Policy"), sign-up flow, cookie banner |
| Acceptable Use Policy | `/acceptable-use` or folded into `/terms` | Terms, onboarding |
| AI-Use Disclaimer | `/ai-disclosure` or section of `/terms` | Marketing page "AI disclosure" section, in-app header |
| DPA | On request or `/dpa` | Firm/Firm Unlimited pricing tier, sales emails |

**Waitlist form immediate fix needed:** The `Waitlist.tsx` form currently collects email and discipline with no link to any privacy notice. At minimum, add one line below the submit button:

```
By submitting, you agree to our <a href="/privacy">Privacy Policy</a>.
We'll use your email to contact you about early access only.
```

---

## 6. Summary of Critical Gaps

1. **Zero legal documents exist** — no ToS, no Privacy Policy, no disclaimers — while the site is live, collecting personal data, and making material product representations.
2. **Waitlist form has no privacy notice link**, creating immediate CCPA/CAN-SPAM exposure.
3. **"Court-defensible" headline** and feature claims are unqualified, creating potential warranty/UPL risk.
4. **No limitation of liability** means any claim defaults to potentially unlimited damages.
5. **No no-training commitment** is formalized in any user-facing document or with model providers.
6. **No per-report authorship attestation** exists for the upcoming MVP.

---

*Auditor: AI assistant (Claude Code / claude-sonnet-4-6). Not a licensed attorney. All draft language requires review and approval by a licensed attorney before publication. Date: 2026-06-08.*
