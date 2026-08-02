# Disclosed. liability, security, usability, and launch audit

**Date:** July 27, 2026  
**Scope:** Disclosed. repository, public marketing pages, de-identified intake,
report workspace, exports, authentication, billing, database policies, privacy
notice, terms, disclaimer, and automated tests.

This is a product and engineering risk assessment, not legal advice. Product
terms, privacy obligations, professional-responsibility duties, enforceability,
governing law, and launch eligibility require review by licensed counsel in the
jurisdictions where Disclosed. and its customers operate.

## Executive decision

**Do not accept real-matter data or open public billing yet.** The product is
appropriate for fictional and properly de-identified design-partner evaluation
after the code changes in this audit are deployed. Real-matter use should remain
blocked until the launch blockers below are completed.

The audited application code was deployed to
`https://disclosed-zeta.vercel.app` after the verification suite passed. The
correct Supabase project, `disclosed`, was confirmed in the dashboard but is
paused. Supabase warns that resuming it restarts compute billing, so it was not
resumed without owner approval. Migration `0014` therefore remains unapplied and
database-backed production flows remain unavailable.

The business should remain **one platform with discipline modules**, not several
separate apps. The shared evidence-linking, export, AI-use record, verification,
accounts, and billing infrastructure is the valuable core. Vocational
rehabilitation should remain the first validated workflow. Forensic engineering
and accident reconstruction should remain clearly labeled design-partner
previews until practicing experts validate their methodology, terminology,
required inputs, and output structure.

The current commercial sequence is sound:

1. free founding pilot using fictional or properly de-identified work;
2. target post-pilot price of **$250 per report**;
3. planned **five-report pack for $1,000**;
4. no unlimited annual plan until real usage establishes unit economics,
   support burden, and report volume;
5. a firm product only after shared templates, roles, matter controls,
   retention, and billing actually exist.

## Risk register

| Severity | Finding | Audit result | Residual action |
| --- | --- | --- | --- |
| Critical | Public database policies let browser clients insert into waitlist and feedback tables, bypassing server validation and abuse controls | Fixed in migration `0014_lock_public_capture_tables.sql` | Apply and verify the migration in the correct production Supabase project |
| Critical | Early product posture could invite privileged, protected, identifiable, or health data before contractual and vendor safeguards exist | UI, Terms, and Privacy now limit early access to fictional or properly de-identified material | Counsel review; vendor DPAs; approved retention posture; BAA before any PHI use |
| High | AI-extracted “evidence” could contain model paraphrases or hallucinated spans | Live extraction now accepts only text that matches source material in substance and falls back to deterministic extraction | Maintain adversarial extraction tests; add human expert validation |
| High | Marketing implied the software could not invent, reach outside sources, or pass unsupported content | Public and operator copy now distinguishes citation-ID checks from semantic support and truth | Keep the shipping guard test and approve future claims centrally |
| High | Request limits counted JavaScript characters after buffering the full body | Streaming byte-bounded parsing now stops oversized requests early | Add edge/WAF limits and production load tests |
| High | Nested log objects and error strings could leak case content, email, tokens, or secrets | Recursive structured redaction added, including arrays, circular data, and secret-like strings | Send only scrubbed operational metadata to any future monitoring service |
| High | Cookie-authenticated mutations lacked a consistent same-origin check | Checkout, billing portal, save, and delete now reject cross-origin mutations | Retain SameSite cookies and add live cross-origin integration tests |
| High | Saved-report deletion promised by privacy copy did not exist | Authenticated, owner-checked deletion now removes the case and cascaded report data | Test against a production-like Supabase project and document backup deletion timing |
| High | Checkout and portal return URLs trusted request host data | Return URLs now use the configured public site origin | Verify production `SITE_URL` and custom-domain redirects |
| High | A hidden legacy Pro route could sell an old unlimited subscription | New Pro checkout removed; existing legacy subscription recognition and portal access retained | Reconcile any existing Stripe price/products and disable unintended public payment links |
| Medium | Auth callback accepted scheme-relative/backslash redirect variants | Redirects now pass through a strict internal-path validator | Preserve redirect regression tests |
| Medium | Deep-health secret could be supplied in a URL query, leaking through logs/history | Secret is now header-only | Rotate the token if it was ever used in a URL |
| Medium | Stripe webhook body was unbounded | Streaming byte cap added before signature processing | Confirm Stripe retries and production webhook observability |
| Medium | Sensitive routes relied mainly on dynamic rendering for cache behavior | Explicit `Cache-Control: no-store` added to auth, intake, verify, draft, and report surfaces | Verify production response headers after deployment |
| Medium | Default export labeled all reports as litigation work product | Default changed to factual `DRAFT — NOT SIGNED` | Counsel/customer chooses any matter-specific legend |
| Medium | Form labeling, error announcement, checkbox/help interactions, and keyboard focus had gaps | Labels, IDs, descriptions, alerts, and focus coverage improved | Complete manual screen-reader and 200% zoom testing |
| Medium | Legal notices lacked usable allocation of responsibility and accurate data disclosures | Terms, Privacy, and Disclaimer substantially rewritten | Licensed counsel must replace the early-access banner with reviewed, jurisdiction-specific terms |

## Legal and professional-responsibility posture

The product now says the expert **prepares, independently verifies, adopts, and
signs** the report. It does not make a legal determination that the expert is the
“sole author” or “author of record.” That tracks the text of Federal Rule of
Civil Procedure 26(a)(2)(B), which says a covered report must be prepared and
signed by the witness.

The product also states that:

- a recognized citation ID proves only that the ID resolves to a source the user
  supplied;
- it does not prove the source is true, admissible, complete, or semantically
  supportive;
- the expert must verify each statement, source relationship, calculation,
  method, and opinion;
- no software can promise admissibility or satisfaction of a particular court;
- AI-assisted output can be wrong despite a valid source marker;
- tool-use disclosure is fact- and court-specific;
- the service is not a law firm and does not provide legal advice.

The Terms now cover the early-access data boundary, customer content license,
account security, acceptable use, billing, termination, warranty disclaimer,
liability limitation, indemnity, changes, and contact. The Privacy Notice now
discloses application answers, feedback content, authentication and billing
records, request metadata, providers, browser-side file parsing, server-side
confirmed text, optional Anthropic processing, standard Anthropic retention,
cookies, retention, deletion, rights requests, and lack of a current BAA,
zero-data-retention arrangement, or formal security certification.

These are risk controls, not a substitute for counsel. Before public billing or
real-matter use, counsel must add or approve:

- the operator's full legal name, address, and contact details;
- governing law, venue, dispute process, and any arbitration/class-waiver terms;
- enforceability of the limitation, indemnity, refund, renewal, and termination
  provisions in target jurisdictions;
- state privacy notices and request mechanics appropriate to actual users and
  thresholds;
- a DPA and subprocessor schedule;
- professional-responsibility and unauthorized-practice-of-law review;
- sector-specific restrictions, including health, employment, biometric, export,
  and litigation confidentiality rules as applicable;
- an acceptable marketing-claims substantiation file.

Relevant authorities reviewed:

- [Federal Rule of Civil Procedure 26](https://www.law.cornell.edu/rules/frcp/rule_26)
- [Federal Rule of Evidence 702](https://www.law.cornell.edu/rules/fre/rule_702)
- [ABA Formal Opinion 512](https://www.americanbar.org/content/dam/aba/administrative/professional_responsibility/ethics-opinions/aba-formal-opinion-512.pdf)
- [FTC Operation AI Comply](https://www.ftc.gov/news-events/news/press-releases/2024/09/ftc-announces-crackdown-deceptive-ai-claims-schemes)
- [FTC guidance on AI privacy and confidentiality commitments](https://www.ftc.gov/policy/advocacy-research/tech-at-ftc/2024/01/ai-companies-uphold-your-privacy-confidentiality-commitments?page=1)
- [FTC guidance on changing data-use terms](https://www.ftc.gov/policy/advocacy-research/tech-at-ftc/2024/02/ai-other-companies-quietly-changing-your-terms-service-could-be-unfair-or-deceptive?page=1)

## Security and privacy engineering

Implemented controls include:

- server-only privileged database writes for capture tables;
- database row-level isolation for customer records, with an additional explicit
  owner check for destructive deletion;
- bounded streaming request parsing;
- same-origin checks on cookie-authenticated mutations;
- strict internal redirect validation;
- configured-origin Stripe returns;
- header-only health secrets;
- Stripe webhook size limits and signature verification;
- recursive log redaction;
- nonce-based CSP on case-data and auth routes;
- frame denial, HSTS, MIME sniffing prevention, referrer control, permissions
  restrictions, opener isolation, and same-origin resource policy;
- explicit no-store headers on sensitive routes;
- local parsing of original document bytes;
- verified model-extraction spans;
- duplicate evidence and section-key rejection;
- dependency and source-secret scanning.

The controls align directionally with the
[NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework),
[NIST SP 800-218A](https://www.nist.gov/publications/secure-software-development-practices-generative-ai-and-dual-use-foundation-models-ssdf),
[OWASP LLM Top 10](https://genai.owasp.org/llm-top-10/), and
[Supabase row-level security guidance](https://supabase.com/docs/guides/database/postgres/row-level-security).

Remaining security work before real-matter use:

1. Apply migration `0014` and prove that anonymous and authenticated browser
   roles cannot insert directly into capture tables.
2. Run the skipped Supabase isolation suite against a disposable,
   production-like project and retain the results.
3. Replace process-local rate limiting with distributed rate limiting or a WAF
   policy that works across serverless instances.
4. Commission an independent penetration test and remediate findings.
5. Establish least-privilege production access, MFA, break-glass procedures,
   secrets rotation, and access-review cadence.
6. Create a written incident-response and breach-notification process with
   severity, ownership, evidence preservation, customer communication, and
   tabletop exercises.
7. Define backups, recovery objectives, restore testing, retention schedules,
   and deletion propagation into backups.
8. Negotiate vendor DPAs. Obtain approved zero-data-retention terms for
   real-matter use. Do not permit PHI without a complete HIPAA analysis and every
   required BAA.
9. Consider cyber and technology E&O insurance sized to litigation-workflow risk.
10. Add production security monitoring with strict event allowlists and PII/case
    content scrubbing.

Anthropic's published standard commercial API posture says inputs and outputs
are automatically deleted within 30 days, subject to its stated exceptions:
[Anthropic retention documentation](https://privacy.anthropic.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data).
Zero data retention is a separate approved arrangement:
[Anthropic ZDR documentation](https://privacy.anthropic.com/en/articles/8956058-i-have-a-zero-data-retention-agreement-with-anthropic-what-products-does-it-apply-to).

## Usability and accessibility

The primary user journey is now:

1. understand the product through a fictional worked example;
2. load the example in one click or use de-identified intake;
3. add or confirm evidence;
4. keep source details and formatting options collapsed until needed;
5. build a concise preview that surfaces action-needed sections first;
6. inspect clean sections only on demand;
7. acknowledge independent review;
8. export the report package and verification record.

The prior overwhelming checklist is collapsed into one “Final review” control,
clearly marked private and not part of the report. Evidence items, source lists,
deliverable formatting, and clean report sections are summarized rather than
expanded by default. The result remains information-dense—as litigation work
must—but no longer asks a first-time user to parse every control before seeing
the product's output.

Accessibility changes cover explicit labels and IDs, required-state and error
associations, live error/status announcements, keyboard focus visibility,
document language, non-nested help controls, and labeled early-access consent.
The target is WCAG 2.2 AA, but automated/source checks are not a conformance
claim. Complete keyboard-only, screen-reader, reflow, contrast, touch-target,
and 200%/400% zoom testing before declaring conformance.

References:

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [Labels or Instructions](https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html)
- [Error Identification](https://www.w3.org/WAI/WCAG22/Understanding/error-identification)
- [Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible)

## Business and positioning audit

The strongest value proposition is not “AI writes an expert report.” It is:

> Turn confirmed findings into a reviewable report package whose source links and
> AI-use record can be explained later.

That package has four saleable deliverables:

1. an editable Rule 26(a)(2)(B)-organized report;
2. a sentence-level source map;
3. an AI-use disclosure appendix;
4. an independently verifiable, tamper-evident manifest.

The product can serve several entry points without fragmenting into separate
apps:

- an expert with an idea or desired report structure can start from the worked
  example and discipline template;
- an expert with source material can use intake and evidence confirmation;
- an expert with a draft can map and restructure it in the workspace;
- a practice seeking consistent process can later use shared discipline
  templates and controls;
- an existing user can reuse the workflow for new reports, identify unsupported
  sections, improve review efficiency, and adopt future modules.

Do not market the product as eliminating hallucination, guaranteeing compliance,
preventing every unsupported statement, or making a report admissible. The FTC
has challenged unsupported claims that AI services perform like professionals
or guarantee legal validity. Premium positioning here comes from specificity,
traceability, honest limits, and a workflow a serious expert can inspect—not
absolute claims.

## Test strategy and audit evidence

New regression coverage added in this audit includes:

- UTF-8 byte limits and early stream cancellation;
- same-origin acceptance and rejection;
- nested, array, circular, and error-string log redaction;
- exact source-span verification and hallucinated/paraphrased extraction
  rejection;
- safe redirect variants;
- database capture-policy revocation;
- configured-origin billing returns;
- saved-report deletion and irreversible confirmation;
- health-token query rejection and header acceptance;
- hidden legacy subscription removal;
- privacy and terms load-bearing disclosures;
- draft legend and export certification;
- strict CSP route scope;
- sensitive-route no-store policy;
- label, error-announcement, focus, upload, consent, and nested-control
  accessibility posture;
- marketing guardrails against unprovable grounding guarantees.

The final verification record must include:

- targeted high-risk tests;
- the complete single-worker test suite;
- TypeScript typecheck;
- production build;
- dependency audit;
- source-secret scan;
- local browser smoke test;
- production smoke test after deployment;
- production response-header checks;
- production database-policy verification.

### Completed verification

- Targeted high-risk suite: **89 passed**.
- Full single-worker suite: **547 passed, 12 skipped**. The skipped tests are
  Supabase integration tests that require a configured test project.
- TypeScript typecheck: passed.
- Local production build: passed; `/intake`, `/verify`, `/signin`, `/sample`,
  and `/workspace` are dynamically rendered.
- Vercel production build and deployment: passed; deployment
  `dpl_Ek1X7nVv4Vma6refXwUvxVAPV4SS` reached `READY` and was aliased to the
  production URL.
- Dependency audit: zero known vulnerabilities at moderate-or-higher threshold.
- Source-secret scan excluding environment files and build/dependency output:
  no matches.
- Production browser smoke test: home rendered; workspace loaded the fictional
  example; the no-AI report build completed; the report package and
  tamper-evident record rendered; Terms and Privacy showed the new disclosures;
  no framework issue badge appeared.
- Production header checks: sensitive pages returned nonce CSP and no-store;
  API health returned no-store; HSTS, frame denial, MIME sniffing prevention,
  permissions policy, opener/resource isolation, and referrer policy were
  present; the framework branding header was absent.
- Production database-policy verification: **not completed because the project
  is paused**.

## Launch blockers

The following are release gates for **real-matter use or public billing**, not
nice-to-have backlog:

1. Apply and verify Supabase migration `0014`.
2. Obtain licensed-counsel approval of Terms, Privacy, Disclaimer, operator
   identity, jurisdiction terms, billing terms, and the early-access boundary.
3. Complete vendor DPAs and an approved retention posture appropriate to the
   data; no PHI without required BAAs.
4. Pass live RLS and ownership-isolation tests.
5. Add distributed abuse controls and an independent penetration test.
6. Establish incident response, access governance, backup/restore, retention,
   and verified deletion operations.
7. Validate each discipline with practicing experts and document the review.
8. Complete manual accessibility testing.
9. Create substantiation records for quantified time-savings and other outcome
   claims before presenting them as measured facts.
10. Verify production configuration, headers, monitoring, billing, webhook,
    deletion, and recovery behavior.

## Monitoring note

The earlier request to add `@sentry/react` with `VITE_PUBLIC_SENTRY_DSN` belongs
to a Vite application, not this Next.js repository. It was intentionally not
added to Disclosed. If Disclosed. later adopts Sentry, use the supported Next.js
integration, load the DSN only from environment configuration, disable or scrub
request bodies and report content, send only allowlisted operational metadata,
execute a DPA, and update the Privacy Notice before enabling it.
