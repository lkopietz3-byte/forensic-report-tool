# MVP Technical Spec — Court-Defensible Forensic Report Drafting

Build-ready spec for when discovery locks a beachhead discipline. Written discipline-agnostic so the template is the only thing that swaps. **Do not start discipline-specific drafting logic until a design partner is secured** (plan Must-Have #2) — the rest of the scaffold can be built in parallel with discovery.

## Design principles (non-negotiable — straight from the plan)

1. **Never generate facts or opinions.** The pipeline only *structures, formats, and organizes* expert-supplied inputs. Every sentence in a generated section must be grounded in a specific input the expert provided. No invented facts, no invented citations, no model "knowledge" leaking into the report. (Must-Have #1 — this is existential, it's court evidence.)
2. **Audit layer is built alongside the pipeline, not bolted on after.** Every model call records prompt, model+version, inputs referenced, and output, linked to the report section it produced. This is the moat.
3. **Expert is the author.** The product produces a *draft* the expert edits, verifies, and signs. UX and ToS reinforce this everywhere.
4. **Grounding + traceability over fluency.** A correctly-cited, slightly-stiff draft beats a fluent one that might hallucinate.

## Stack (optimized for a solo + Claude Code, fast + scalable)

- **Framework:** Next.js (App Router) + TypeScript — one repo, server + UI.
- **UI:** Tailwind + shadcn/ui. (Matches the "modern, scalable components" bar.)
- **DB/Auth/Storage:** Supabase (Postgres + row-level security + auth + file storage). RLS keeps each expert's case files isolated.
- **LLM:** **Anthropic Claude API** (latest Sonnet for drafting; latest Opus for the hardest synthesis if needed). Use the API, not consumer plans — needed for confidentiality terms / no-training (Must-Have #6) and prompt caching.
  - **Prompt caching** on the template + standard text + expert profile (large, stable) → big cost/latency win per report.
- **Doc parsing:** server-side extraction for PDFs (depositions, police reports) + image handling for scene photos. Claude's document/vision input for messy files; keep raw files in storage and pass structured excerpts.
- **Export:** DOCX (primary — experts live in Word) via `docx`; PDF secondary.
- **Billing:** Stripe — metered per-report credits first; optional seat plan later (pricing decided by discovery Q5).
- **Hosting:** Vercel (app) + Supabase (data). Cheap to run, scales without ops.

## Architecture (the audit layer is the spine)

```
Intake (structured form + file uploads)
        │  every input gets a stable input_id
        ▼
Normalize  → extract text/data from messy files into citable "evidence units"
        │
        ▼
Draft pipeline (Claude API, section by section)
        │  each section prompt = template + ONLY the relevant evidence units
        │  output must cite the input_ids it used; reject ungrounded sentences
        ▼
Audit log  ← records {prompt, model, version, input_ids, output} per section
        │
        ▼
Editor (expert reviews/edits; sees which inputs back each section)
        │
        ▼
Export → DOCX report + AI-Disclosure Appendix (generated from the audit log)
```

### Why this shape
- Feeding each section **only the relevant evidence units** (not the whole case file) is what prevents fabrication and keeps the model grounded — and it's cheaper.
- The **AI-Disclosure Appendix is a pure projection of the audit log**, so "court-ready disclosure" is free once logging is correct. That's the moat, and it costs you almost nothing per report because it's already captured.

## Data model (Postgres / Supabase)

- `users` — expert profile, CV, prior-testimony list, billing.
- `cases` — engagement metadata (matter, retaining counsel, case number, role).
- `inputs` — every supplied item: `{id, case_id, type[note|photo|deposition|police_report|calc|measurement|doc], raw_file_url, extracted_text}`.
- `evidence_units` — citable atoms extracted from inputs: `{id, input_id, content, location}` (e.g. "Depo p.42 ln.10").
- `reports` — `{id, case_id, discipline, template_version, status}`.
- `report_sections` — `{id, report_id, section_key, draft_text, final_text, cited_evidence_ids[]}`.
- `audit_events` — `{id, report_id, section_key, prompt, model, model_version, input_ids[], output, created_at}`. **Append-only.**
- `templates` — `{discipline, version, section_schema}` (e.g. ASTM E3176 sections / IPTM topical sections + Rule 26(a)(2)(B) required elements).

## Rule 26(a)(2)(B) checklist (enforced before export)
Every report must contain, and the app must verify presence of:
1. A complete statement of all opinions + the basis and reasons.
2. The facts or data considered.
3. Exhibits used to summarize/support.
4. Qualifications + publications (last 10 yrs).
5. List of cases testified in (last 4 yrs).
6. Statement of compensation.
Export is blocked (or warns hard) if any element is missing.

## Build phases

**Phase 0 — parallel with discovery (safe to start now, no discipline lock-in):**
- Repo scaffold, auth, DB schema above, file upload + storage, Stripe test mode.
- Audit-log primitive + a generic "evidence-unit grounded section drafter" against a *placeholder* template.
- DOCX export skeleton + AI-Disclosure Appendix generator from the audit log.

**Phase 1 — after design partner + discipline locked:**
- Real discipline template (ASTM E3176 *or* IPTM/ACTAR section schema), co-designed with the partner.
- Discipline-specific intake form + evidence extraction tuned to that discipline's inputs.
- Grounding guardrails tuned; design partner red-teams 3–5 real reports.

**Phase 2 — expansion (only after beachhead proven):**
- Second discipline (template-additive).
- Adjacent modules reusing the case file: rebuttal reports, deposition prep Q&A, demonstratives.

## Hard guardrails to implement (Must-Have #1, in code)
- Section prompts instruct: use only provided evidence units; if evidence is insufficient, output a flagged placeholder ("[Expert input needed: …]") instead of inventing.
- Post-generation check: flag any sentence with no linked `evidence_id` for expert review before it can be marked final.
- No web/tool browsing in the drafting path — closed-world over the case file only.
- Every export carries the disclosure appendix; expert must check an attestation ("I have reviewed and verified") before DOCX is finalized.

## Confidentiality posture (Must-Have #6 — wire in from day one)
- Anthropic API with no-training terms; document it on the marketing site.
- Supabase RLS; encryption at rest/in transit; per-case isolation.
- Clear data-deletion + export controls (protective-order friendly).
