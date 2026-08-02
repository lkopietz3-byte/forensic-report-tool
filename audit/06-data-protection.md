# Audit 06 — Confidentiality & Data-Protection Posture (Claims vs. Reality)

Scope: landing-page trust claims vs. actual controls; sensitive-data flow from client upload → Supabase → Anthropic API; logging/PII exposure; retention/deletion policy; sub-processor obligations.

---

## Findings

### [CRITICAL] "Zero-retention path with our model provider" — claimed, not contracted

**File:** `src/app/page.tsx` line 37 (GUARDRAILS "Confidential by commitment")

The landing page states: *"a zero-retention path with our model provider."*

Reality: Anthropic's standard API Terms grant Anthropic a **30-day data-retention window** for inputs/outputs by default. A **Zero Data Retention (ZDR) addendum** is a separate, paid contract that must be explicitly signed with Anthropic. No such agreement exists yet (pre-launch). The `.env.example` comment says *"no-training / confidentiality terms apply"* — API terms do prohibit training on API data by default, but that is not the same as zero retention.

**Why it matters:** Forensic case files are routinely subject to protective orders. A user uploading deposition text or scene photos under a court-issued confidentiality order could be violating that order if those materials transit to and are retained by an undisclosed sub-processor. This is an existential liability for the expert and a direct breach of the product's core trust premise.

**Honest reword:** *"No training on your case data under Anthropic's API terms. We are pursuing a zero-retention agreement with our model provider and will not accept case files under protective order until that contract is in place."*

**Concrete fix:** (1) Execute Anthropic ZDR addendum before accepting real case data. (2) Until signed, gate the upload flow with an explicit advisory that materials under protective order must not be submitted. (3) Document Anthropic as a sub-processor in a public sub-processor list.

---

### [CRITICAL] Audit log stores full prompt + raw output containing case evidence — no deletion path

**Files:** `src/lib/domain/audit.ts`, `supabase/migrations/0001_init.sql` (`audit_events` table)

The `AuditLog.append()` stores the **full reconstructed prompt** (system + user, including all evidence unit content verbatim) and the **full model output** in `audit_events.prompt` and `audit_events.output`. The SQL schema and RLS policies intentionally provide **no UPDATE or DELETE** for any role — this is correct for immutability of the disclosure appendix, but it means sensitive case content (deposition excerpts, injury descriptions, financial records) is permanently retained in the database with no deletion mechanism.

**Why it matters:** Litigation-sensitive materials cannot be deleted even after case closure or client request. The "append-only" design is legally correct for the disclosure integrity purpose but must be scoped to the minimum necessary fields. The `prompt` field currently contains the entire evidence corpus verbatim.

**Honest reword / fix:** Split `audit_events` into two tables: an immutable disclosure record (section key, model, model version, input IDs, timestamp — no raw content) and a separately scoped `audit_event_content` table (full prompt/output) with a service-role-only delete path and a documented retention period. Alternatively, store only evidence IDs and hashes in the immutable table; fetch content on-demand from the primary evidence tables (which can be deleted).

---

### [HIGH] "Encryption at rest" — Supabase default, not verified; no explicit configuration

**File:** `supabase/migrations/0001_init.sql`; no Supabase project config checked in

The landing page claims *"Encryption in transit and at rest."* Supabase Pro/Enterprise encrypts data at rest (AES-256) on its managed infrastructure. However: (1) The migrations contain no `pgsodium`/`vault` column-level encryption for the most sensitive columns (`extracted_text`, `evidence_units.content`, `audit_events.prompt`, `audit_events.output`). (2) Supabase's at-rest encryption protects against disk theft, not against a compromised Supabase account, a misconfigured service-role key leak, or Supabase's own staff access. (3) No Supabase DPA has been referenced or committed. (4) The free/non-enterprise Supabase tier does **not** guarantee at-rest encryption.

**Concrete fix:** (1) Confirm you are on a Supabase tier that guarantees at-rest encryption; document it. (2) Obtain and sign Supabase's DPA. (3) Add `pgsodium`/Vault column encryption for `extracted_text`, `evidence_units.content`, and the content columns of `audit_events`. (4) Add Supabase to the sub-processor list.

---

### [HIGH] `console.error("waitlist persist failed", err)` — may log PII and connection secrets to server logs

**File:** `src/app/api/waitlist/route.ts` line 66

`err` may contain: the submitted email address (if Supabase returns a constraint-violation message quoting the value), connection details, or the service-role key in an error object from the Supabase client. Server logs on Vercel/cloud platforms are commonly forwarded to third-party log aggregators (Datadog, Logtail, etc.) with no data-classification controls.

**Concrete fix:** Replace `console.error("waitlist persist failed", err)` with a sanitized log that emits only the error code/message type — never the raw `err` object or anything derived from user input. Example: `console.error("waitlist persist failed", { code: (err as {code?: string}).code })`.

---

### [HIGH] `.data/waitlist.jsonl` — plaintext PII on filesystem, no access controls

**File:** `src/app/api/waitlist/route.ts` (`persistToFile`); `.gitignore` correctly excludes `.data/`

When Supabase is not configured, the API falls back to appending email addresses and discipline classifications to `.data/waitlist.jsonl` on the local filesystem (or server disk). This file: (1) has no encryption, (2) has no access controls beyond filesystem permissions, (3) has no documented retention or deletion policy, (4) is co-located with the application process. On a shared host or serverless platform, this path is inappropriate. The `.gitignore` entry prevents accidental commit, but that is not sufficient.

**Concrete fix:** Remove the file fallback entirely before production launch — require Supabase to be configured. If a local fallback is retained for development, add a `NODE_ENV !== 'production'` guard and document the dev-only purpose.

---

### [MEDIUM] No data-retention or deletion policy exists anywhere in the codebase or marketing copy

**Files:** All — absence of any policy document, API endpoint, or UI control

There is no privacy policy, no terms of service, no stated retention period for case data, no user-facing deletion workflow, and no DPA template for business customers. Forensic experts are often engaged by law firms operating under their own data-handling obligations. Without a DPA, firm-tier customers cannot lawfully onboard the product in jurisdictions with GDPR or CCPA requirements. More critically, any expert whose case is settled or dismissed has no mechanism to request deletion of their client's data.

**Concrete fix:** Before accepting real case data, publish: (1) a privacy policy naming all sub-processors (Anthropic, Supabase, Stripe, Vercel); (2) a data-retention schedule (e.g., case data deleted N days after account closure); (3) a user-facing "delete case" function that cascades to all related tables (the `on delete cascade` foreign keys in the migration already support this at the DB level); (4) a DPA template for firm-tier customers.

---

### [MEDIUM] `rawEvents` field in `DisclosureAppendix` exposes full prompts/outputs to the export

**File:** `src/lib/domain/disclosure.ts` lines 26–27, 57

`generateDisclosureAppendix()` includes `rawEvents: AuditEvent[]` in the returned object. `AuditEvent.prompt` is the full multi-kilobyte prompt including all evidence verbatim. If this appendix is serialized to the exported Word document or transmitted to the client, the full prompt (containing case evidence) flows to the client layer. The disclosure statement only needs model, version, section, evidence IDs, and timestamp for court purposes.

**Concrete fix:** Remove or opt-in-gate the `rawEvents` field from the default export. The court-facing appendix should contain only the `entries[]` summary. Retain raw events server-side under the separate deletion-capable store described in finding 2.

---

### [LOW] `.env.example` comment "so no-training / confidentiality terms apply" is technically misleading

**File:** `.env.example` line 5–6

The comment implies that merely using the API (not consumer products) provides confidentiality guarantees equivalent to a ZDR contract. This is an overstatement that could mislead future developers on the team about the actual contractual posture.

**Concrete fix:** Replace comment with: `# Uses the Anthropic API. By default Anthropic may retain inputs/outputs for up to 30 days. A Zero Data Retention addendum is required before accepting materials under protective order.`

---

## Top 3 Must-Fix Before Accepting Real Case Data

1. **Sign the Anthropic ZDR addendum** (or gate uploads with an explicit "no protective-order materials" advisory until signed). The "zero-retention path" claim is currently false; it exposes every user uploading court-restricted materials to a protective-order violation.

2. **Redesign `audit_events` to separate immutable disclosure metadata from deletable evidence content.** Full prompt text (which contains verbatim case evidence) currently has no deletion path. This is irreconcilable with any retention/deletion policy you could publish.

3. **Publish a privacy policy with a sub-processor list and add a user-facing case-deletion flow.** Without it, firm-tier customers cannot lawfully onboard, and no expert has a remedy for removing their client's sensitive data after case closure.
