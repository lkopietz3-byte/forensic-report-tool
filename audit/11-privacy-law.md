# 11 — Privacy-Law Compliance Audit

**Scope:** Waitlist data collection (Waitlist.tsx + /api/waitlist/route.ts) and future product handling of litigation-sensitive case data / claimant PII. Laws assessed: GDPR/UK-GDPR, CCPA/CPRA, US state privacy acts (VA, CO, CT, TX, OR, MT, IA, etc.), CAN-SPAM, UK Privacy and Electronic Communications Regulations (PECR).

---

## Findings

### [CRITICAL] Gap 1 — No notice-at-collection near email field
**Laws implicated:** CCPA/CPRA §1798.100(b) (notice at or before collection); GDPR Art. 13 (transparency at time of collection); UK-GDPR Art. 13; VA CDPA §59.1-578; CO CPA §6-1-1308; and substantially all US state privacy acts that took effect 2023–2025.  
**Why it matters:** Every US state privacy law with an active enforcement date requires a conspicuous link to a privacy notice at or before the point of data collection. GDPR/UK-GDPR impose the same obligation. Currently the waitlist form has no privacy-policy link anywhere on the page. A supervisory authority or state AG could treat every signup as a non-compliant collection.  
**Fix:** Add the ready-to-paste microcopy (below) directly under the email input / submit button. Also publish a privacy policy at `/privacy` before any public traffic reaches the form. Counsel required to draft the full policy.

---

### [CRITICAL] Gap 2 — No lawful basis / consent for marketing follow-up
**Laws implicated:** GDPR Art. 6 (lawful basis) + Art. 7 (consent conditions); UK-GDPR same; PECR Reg. 22 (UK electronic marketing consent); CASL s. 6 (Canada express or implied consent); CAN-SPAM (opt-out mechanism required in every commercial email, but does not require prior consent for B2B — lower bar for US-only B2B audiences).  
**Why it matters:** The success message says "We'll reach out about early access and design-partner slots." For any EU/UK/Canadian signups, this is a marketing communication and requires a positive consent signal (unticked checkbox or equivalent) and a linked privacy notice before the contact. Even under CAN-SPAM the first email must contain an unsubscribe mechanism. There is no checkbox, no opt-out link, and no mechanism in the route to record consent or timestamp.  
**Fix for GDPR/UK-GDPR/CASL:** Add an explicit opt-in checkbox (pre-unchecked) with the microcopy below. Store consent timestamp + IP in the Supabase row or `.data/waitlist.jsonl`. For CAN-SPAM: add an unsubscribe link to every outbound email; the route.ts must record a `can_email: boolean` field.  
**Note:** Whether "early access" constitutes a commercial email or a transactional/service notification is a legal judgment call — flag for counsel. If it is purely transactional (they asked to be notified), CAN-SPAM consent requirements are lower, but GDPR consent still applies.

---

### [HIGH] Gap 3 — No data-retention or deletion policy for waitlist entries
**Laws implicated:** GDPR Art. 5(1)(e) (storage limitation); UK-GDPR same; CCPA/CPRA §1798.105 (right to delete); VA CDPA §59.1-578(5); CO CPA §6-1-1308(1)(d); all other US state acts with deletion rights.  
**Why it matters:** Waitlist data collected today has no defined retention limit and no deletion path. Under GDPR, personal data must not be kept longer than necessary for the original purpose. Under CCPA/CPRA and most US state acts, individuals have a right to deletion and must be able to exercise it via a verifiable consumer request. There is no `DELETE /api/waitlist` endpoint, no deletion email address, and nothing in the UI that discloses retention duration or how to request deletion.  
**Fix:** (a) Define retention: waitlist emails should be deleted 24 months after the launch date or 12 months after last contact, whichever is earlier — or at the point the person is converted to a paying user (at which point the legal basis shifts to contract). (b) Add a deletion-request path: minimally, publish `privacy@[domain]` as the contact email in the privacy policy, and commit to honoring deletion requests within 45 days (CCPA/CPRA standard). (c) For GDPR: deletion requests must be honored within 30 days (extendable by 2 months with notice). (d) Implement a Supabase `DELETE FROM waitlist WHERE email = $1` endpoint behind an authenticated internal route, or a simple admin script, so deletion can actually be executed when requested.  
**Retention recommendation:** 18 months from signup, or 30 days after product launch invitation is declined, whichever is sooner. Batch-delete expired entries with a cron job.

---

### [HIGH] Gap 4 — No sub-processor disclosure
**Laws implicated:** GDPR Art. 13(1)(e) (recipient categories); UK-GDPR same; CCPA/CPRA §1798.110 (categories of third parties data is shared with); most US state acts require disclosure of third-party sharing.  
**Why it matters:** Waitlist emails flow into Supabase (a US/EU sub-processor). The future product will send case narrative text — potentially containing claimant names, diagnoses, and vocational histories — to Anthropic's API. Neither sub-processor is currently disclosed anywhere. Supabase is SOC 2 Type II and offers a DPA; Anthropic offers a data processing addendum for API customers. Both DPAs must be executed and both processors must be listed in the privacy policy before any personal data or case data is processed through them.  
**Fix:** (a) Execute Supabase DPA now. (b) Execute Anthropic API DPA before the product goes live. (c) List both in the privacy policy under "Sub-processors / Third parties." (d) For EU/UK users specifically, confirm Anthropic's API data is processed within an adequacy-decision country or under SCCs — counsel required.

---

### [HIGH] Gap 5 — Future product: third-party claimant PII and protective-order obligations
**Laws implicated:** HIPAA (if any medical-record data is included in uploaded documents — counsel must assess whether the forensic expert qualifies as a "business associate"); state medical-privacy laws; court protective orders that may cover the underlying case data; ABA Model Rule 1.6 (confidentiality, if any attorney uploads data — not directly applicable to the expert, but may be contractually imposed); GDPR/UK-GDPR if the claimant is EU/UK-resident.  
**Why it matters:** Forensic vocational-rehab reports routinely contain claimant SSN, date of birth, diagnosis codes, wage history, and rehabilitation prognosis — all sensitive PII. When a user pastes or uploads this data to draft a report, it will be sent to the Anthropic API. If any of this data is covered by a protective order, transmitting it to a cloud AI without court approval and/or opposing-counsel notice could constitute a violation of the order. Even absent a protective order, sending PHI to a third-party AI without a signed Business Associate Agreement is a HIPAA violation if the expert meets the "business associate" definition.  
**Fix:** (a) Display a prominent case-data warning before any document upload or paste (see microcopy below). (b) Add a checkbox requiring the user to confirm they have authority to submit the data and that no protective order prohibits third-party processing. (c) Execute a HIPAA BAA with Anthropic before launch if counsel determines HIPAA applies. (d) Consider a "data minimization" mode that strips PII tokens before sending to the API and re-inserts them client-side (reduces sub-processor exposure). Counsel is required for the HIPAA and protective-order analysis.

---

### [MEDIUM] Gap 6 — CAN-SPAM compliance for outbound emails
**Laws implicated:** CAN-SPAM Act 15 U.S.C. §7704; CASL s. 6 (Canada).  
**Why it matters:** The promise "We'll reach out" implies outbound commercial email. CAN-SPAM requires: (a) accurate From/subject, (b) physical mailing address in every email, (c) a functioning opt-out mechanism honored within 10 business days, (d) no deceptive subject lines. None of these are enforced by the current route or any email template visible in the codebase.  
**Fix:** Ensure every outbound waitlist email (whether sent via Resend, SendGrid, or manual tool) includes a physical address and one-click unsubscribe. Store `unsubscribed_at` in the waitlist table. This is operational hygiene, not just legal: ISPs will block a domain that generates unsubscribe complaints.

---

### [LOW] Gap 7 — No cookie/tracking notice
**Laws implicated:** GDPR/UK-GDPR/ePD if analytics or tracking cookies are set; CCPA if "selling" or "sharing" for targeted advertising.  
**Why it matters:** If the deployed site uses Vercel Analytics, Google Analytics, or any third-party script that sets cookies, a cookie banner is required for EU/UK visitors. Not currently visible in the codebase but worth confirming at deployment.  
**Fix:** Audit deployed scripts before launch. If analytics are present, add a consent banner for EU/UK visitors. For US-only audiences, a cookie policy in the privacy notice is sufficient unless data is sold/shared for targeted ads.

---

## Ready-to-Paste Consent Microcopy

### A. Below the waitlist email field (required, no checkbox — covers CAN-SPAM + CCPA notice)

```
By submitting, you agree to receive emails about early access and product updates.
We store your email securely and never sell it. See our <a href="/privacy">Privacy Policy</a>.
You can unsubscribe at any time.
```

### B. Below the waitlist email field (GDPR/UK-GDPR/CASL variant — requires explicit opt-in checkbox)

Add an unchecked checkbox above the submit button:

```html
<label>
  <input type="checkbox" name="marketing_consent" required />
  I agree to receive emails about early access and product updates from Disclosed.
  I can withdraw consent at any time. See the
  <a href="/privacy">Privacy Policy</a> for details on how we store and use your data,
  sub-processors (Supabase, Anthropic), and your right to deletion.
</label>
```

**Store in DB:** `marketing_consent: boolean`, `consent_ts: timestamp`, `consent_ip: string`.

### C. Practical compromise (single microcopy, covers both regimes for a pre-launch waitlist where volume is tiny)

Place this text — verbatim, in ≥12px font — directly under the submit button:

```
Your email is used only to notify you about Disclosed early access. We use Supabase
to store it. You can request deletion at any time by emailing privacy@[yourdomain].
View our <a href="/privacy">Privacy Policy</a>.
```

For EU/UK/Canadian visitors, add the unchecked opt-in checkbox (Option B above). The cleanest implementation: show the checkbox unconditionally — it removes GDPR risk, and most B2B SaaS products include it globally rather than geo-fencing.

### D. Future product — case-data warning before any report generation

```
Before you proceed: this tool uses Anthropic's AI API to draft your report.
Any case narrative, claimant information, or medical/vocational data you enter
will be transmitted to Anthropic for processing. Do not enter data covered by a
court protective order without first confirming that third-party AI processing
is permitted. You are responsible for verifying that you have authority to submit
this data. See our <a href="/privacy">Privacy Policy</a> and
<a href="/dpa">Data Processing Agreement</a>.
```

---

## Top 3 Must-Fix (pre-launch blockers)

1. **Add notice-at-collection + privacy-policy link under the email field** — every active US state privacy law and GDPR Art. 13 require this before the first byte of personal data is collected. Zero-cost fix; blocks all collection-phase enforcement risk. Use microcopy C above; publish a /privacy page (counsel-drafted).

2. **Capture and store marketing consent / provide unsubscribe path** — the "we'll reach out" promise is a marketing email trigger. Without recorded consent (GDPR) and a functional unsubscribe (CAN-SPAM), the first outbound email creates multi-jurisdiction liability. Implement Option B checkbox, store `marketing_consent` + `consent_ts` in the waitlist table, and add `unsubscribed_at` for opt-outs.

3. **Execute Anthropic and Supabase DPAs; publish sub-processor list** — before case data (future product) touches the Anthropic API, a signed DPA is legally required for EU/UK users and operationally prudent for CCPA compliance. Supabase DPA is self-serve in their dashboard. Anthropic DPA requires contacting Anthropic sales/legal. Do both now — they take days, not weeks, and the future product cannot launch without them.

---

*This audit identifies legal risks but does not constitute legal advice. A qualified privacy attorney with US state + GDPR expertise should review the privacy policy, DPAs, and HIPAA applicability before product launch.*
