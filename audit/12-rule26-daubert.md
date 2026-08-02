# Audit 12 — Rule 26(a)(2)(B) / Daubert / RAPEL Substantive Accuracy

Scope: `src/lib/domain/rule26.ts`, `src/lib/domain/template.ts`, `src/lib/domain/sample.ts`, `src/lib/domain/types.ts`, `src/app/page.tsx`, `discovery/vocrehab-template-spec.md`.

---

## Findings

### [CRITICAL] Rule 26(a)(2)(B)(i) is split into two separate keyed elements — structural misrepresentation of the rule

**What's wrong:** `RULE_26_ELEMENTS` in `rule26.ts` lists `opinions` and `basis_and_reasons` as two distinct Roman-numeral items, both labeled `(i)`. The actual rule has exactly **six** numbered elements, (i)–(vi). Element (i) is a single, unified requirement: *"a complete statement of all opinions the witness will express and the basis and reasons for them."* Splitting it into two separately-keyed items with both labeled `(i)` creates a confusing and technically inaccurate display. A forensic expert reviewing the Rule 26 checklist panel on the landing page (or the export gate) will see two `(i)` rows, which looks like a drafting error and could invite adverse counsel to argue the report was built on a misunderstanding of the rule.

**Precise correction:**

Option A (preferred — preserves separate sections for drafting convenience while fixing the legal label): Keep the two section keys for internal workflow but merge them into **one** `RULE_26_ELEMENTS` entry:

```ts
{
  key: "opinions",           // primary anchor key
  label: "(i) A complete statement of all opinions and the basis and reasons for them",
},
```

Add a comment explaining that the `basis_and_reasons` section is the second half of element (i) and is validated together. Update `validateRule26` to check both `opinions` and `basis_and_reasons` under that single element entry, or add `basis_and_reasons` as a sub-check with a note rather than a separate Roman-numeral item.

Option B (alternative): Relabel the second entry as `(i, cont.) The basis and reasons for those opinions` to make clear it is not a separate numbered element.

---

### [HIGH] RAPEL section ordering: `rehabilitation_plan` is placed *after* TSA and labor-market survey in the template but RAPEL's `R` component comes *first* in the acronym

**What's wrong:** RAPEL = R-A-P-E-L. The `R` (Rehabilitation plan) is the **first** component; it describes the vocational profile and the realistic retraining/intervention path that anchors the subsequent Access and Placeability analyses. In `VOCREHAB_TEMPLATE`, `rehabilitation_plan` (section 9) is placed after `transferable_skills` (section 7) and `labor_market_survey` (section 8). The template and spec comment acknowledge this ordering (`discovery/vocrehab-template-spec.md` section 9 places R at position 9, after A and P), justifying it implicitly by data flow (A and P generate the occupations that the R plan targets).

**Why this matters:** An expert or opposing counsel familiar with published RAPEL methodology will immediately notice the R-component is out of order. While some practitioners do place the rehabilitation plan later for narrative flow, the tool explicitly names its version `0.1.0-draft-rapel` and cites `standardRef: "RAPEL (Weed)"`. Presenting the framework as RAPEL while silently reordering its first component, without noting the deviation, is methodologically misleading and will erode trust with the exact audience the tool targets.

**Precise correction:** Either (a) reorder the template to place `rehabilitation_plan` first among the RAPEL sections (before `transferable_skills`) to match the acronym's conventional narrative sequence, or (b) add an explicit note in the template's instructions and in `discovery/vocrehab-template-spec.md` acknowledging the deviation: *"Note: this template places R after A and P for narrative coherence (restrictions and accessible occupations must be established before the rehabilitation plan can be scoped); this is a recognized structural variant — confirm with the design partner."*

---

### [HIGH] Daubert overclaim — "A clearly scoped assignment is a Daubert checklist item" and "Showing the data-to-opinion path is the principal Daubert shield"

**What's wrong:** Two template section instructions make normative Daubert sufficiency claims that overstate what compliance with this tool guarantees:

1. `scope_of_assignment` instructions: *"A clearly scoped assignment is a Daubert checklist item."*
2. `basis_and_reasons` instructions: *"Showing the data-to-opinion path is the principal Daubert shield."*

These framings tell the expert that following these template steps *is* the Daubert protection. That is an overclaim. Daubert/Rule 702 admissibility is a judicial gatekeeping determination that involves multiple factors (testability, peer review, error rate, general acceptance) applied by a judge. Structural clarity and a documented data-to-opinion path are *necessary but not sufficient* for admissibility. Framing them as "the Daubert shield" or a "Daubert checklist item" could cause an expert to underestimate the admissibility risk and to over-rely on the tool's structure as a substitute for independent methodological rigor.

The `discovery/vocrehab-template-spec.md` is more careful, listing Daubert "failure modes" without promising that avoiding them guarantees admissibility. The template instructions are less careful and contradict that nuance.

**Precise correction:**

- `scope_of_assignment`: Change *"A clearly scoped assignment is a Daubert checklist item."* → *"A clearly scoped assignment supports a Daubert reliability inquiry by limiting the opinion to what the expert was actually retained to address."*
- `basis_and_reasons`: Change *"Showing the data-to-opinion path is the principal Daubert shield."* → *"Showing the data-to-opinion path directly addresses the Daubert reliability inquiry; admissibility remains a judicial determination."*

---

### [HIGH] Landing page hero step 02 — implicit guarantee that the report satisfies Rule 26

**What's wrong:** `page.tsx`, STEPS array, step 02 body text reads:

> *"Your report assembles in your discipline's standard format with every Rule 26(a)(2)(B) element."*

The phrase "with every Rule 26(a)(2)(B) element" is stated as a factual outcome, not a structural scaffold. A court — or opposing counsel — reviewing this marketing copy could argue the tool represented that the resulting report *satisfies* Rule 26(a)(2)(B). The rule requires substantive completeness (e.g., *all* opinions, *all* prior testimony), not merely the presence of labeled sections. If a section is present but substantively thin, the report does not comply with Rule 26, regardless of the tool's structural guarantee.

**Precise correction:** Change the body to: *"Your report assembles in your discipline's standard format with every Rule 26(a)(2)(B) element accounted for — you fill each one with your own complete findings before export."*

---

### [MEDIUM] `qualifications` section instructions reference only "CRC/ABVE credentials" — understates Rule 26(a)(2)(B)(iv)'s full scope

**What's wrong:** The `qualifications` section instructions in `VOCREHAB_TEMPLATE` read: *"Expert profile boilerplate: CRC/ABVE credentials and publications (last 10 years), from the expert profile, not case evidence."* Rule 26(a)(2)(B)(iv) requires *"the witness's qualifications, including a list of all publications authored in the previous 10 years."* The rule's qualifications requirement is not limited to credentials and publications — it encompasses the full CV that a court needs to assess competency. More importantly, the instructions do not prompt the expert to include *all* publications (only the most significant ones might make it into a profile if it is treated as "boilerplate"). The qualifier "boilerplate" is subtly misleading; Rule 26(iv) requires a complete publication list, not a curated highlight reel.

**Precise correction:** Change the instructions to: *"Expert qualifications: full CV including CRC/ABVE credentials. Per Rule 26(a)(2)(B)(iv), this section MUST include a list of ALL publications authored in the previous 10 years — not a curated selection. Populated from the expert profile."*

---

### [MEDIUM] Sample `opinions` section states a specific dollar loss figure as a "midpoint" — risks becoming the expert's stated opinion rather than a formatting scaffold

**What's wrong:** In `sample.ts`, the `opinions` draft text reads:

> *"His post-injury earning capacity is reduced to a midpoint of approximately $48,000 per year, against a pre-injury average of $72,400, indicating an annual loss of earning capacity of approximately $24,400."*

The `[Expert input needed: ...]` caveat follows, but the $24,400 annual loss figure is already stated as a concluded opinion in the sentence before it. The template's hard guardrail states the tool must *never* originate earning-capacity ranges or differentials — but this sample draft does exactly that: it computes and states the midpoint of a range ($44K–$52K) and the resulting differential ($24.4K) as if the expert supplied those numbers. An expert who copies this scaffold without verifying it has adopted a figure the tool generated.

**Precise correction:** Replace the midpoint computation in the opinions draft with a placeholder: *"His post-injury earning capacity is reduced to a range of [Expert to confirm: $44,000–$52,000/yr per the labor market survey] against a pre-injury average of $72,400, indicating an annual loss of earning capacity of approximately [Expert to confirm range endpoints and midpoint]."* The `loss_of_earning_capacity` section has the same issue — it states "$48,000" as "the midpoint" even though that figure is derived by the tool from the survey range.

---

### [MEDIUM] `records_reviewed` section is not mapped to `facts_or_data_considered` in `RULE_26_ELEMENTS` but serves the same Rule 26(ii) function — creates a structural ambiguity

**What's wrong:** The `records_reviewed` section (section 3 in `VOCREHAB_TEMPLATE`) enumerates every document the expert considered. Rule 26(a)(2)(B)(ii) requires "the facts or data considered by the witness in forming them." In vocational rehabilitation practice, "records reviewed" is the primary vehicle for satisfying Rule 26(ii). However, `RULE_26_ELEMENTS` only maps the `facts_or_data_considered` key as the (ii) element, and `rule26.ts`'s `validateRule26` only checks that key. If `records_reviewed` is populated but `facts_or_data_considered` is thin or duplicative, the export will still pass the Rule 26 gate — yet the two sections together (and partly redundantly) are what actually satisfies (ii). This is a validation gap that an expert might not notice.

**Precise correction:** Add a comment in `rule26.ts` and in the template noting that `facts_or_data_considered` is the formal Rule 26(ii) element and `records_reviewed` is a narrative precursor; the Rule 26 gate should check `facts_or_data_considered` substantively. Optionally cross-link the two sections in the template instructions: *"This itemization of records feeds directly into the 'Facts or Data Considered' section (Rule 26(a)(2)(B)(ii)) — ensure every record listed here appears in that section."*

---

### [LOW] `prior_testimony` section instructions omit "at trial or by deposition" qualifier — incomplete

**What's wrong:** Rule 26(a)(2)(B)(v) requires a list of all cases in which the expert *"testified as an expert at trial or by deposition during the previous 4 years."* The template instructions read: *"List of cases in which the expert testified at trial or deposition during the previous 4 years."* This is substantively correct but omits the critical qualifier *"as an expert"* — excluding lay-witness appearances and party testimony. An expert who testified as a party to their own prior lawsuit could misunderstand whether to include that case.

**Precise correction:** Change instructions to: *"List of all cases in which the witness testified **as an expert** at trial or by deposition during the previous 4 years (Rule 26(a)(2)(B)(v)). Does not include lay-witness or party testimony."*

---

### [LOW] `compensation` section label says "Statement of Compensation" but the rule's actual language is broader — "a statement of the compensation to be paid for the study and testimony"

**What's wrong:** The instructions accurately quote the rule. The section *title* and the `RULE_26_ELEMENTS` label both say "Statement of compensation" — this is fine and common shorthand. No correction strictly required, but the instructions should make clear that "study" (i.e., the preparation work, not just the testimony rate) must be included. The sample's compensation statement does include both rates, so the sample is compliant, but the instruction does not explicitly require it.

**Precise correction (optional):** Instructions: *"State the compensation to be paid for the study and testimony separately. Both must be stated per Rule 26(a)(2)(B)(vi). Contingency arrangements must be disclosed if any."*

---

## Top 3 Must-Fix

1. **[CRITICAL] Double `(i)` label in `RULE_26_ELEMENTS`** — `opinions` and `basis_and_reasons` are both labeled `(i)`, misrepresenting the six-element structure to every expert who uses the tool. Fix: merge into one `(i)` entry or clearly annotate the split as a workflow convenience, not a separate Roman numeral.

2. **[HIGH] Daubert overclaim in template instructions** — two section instructions tell experts that following the template steps *is* their "Daubert checklist item" / "principal Daubert shield," implying the tool confers admissibility. This is the most legally dangerous language in the codebase for a product selling itself to forensic experts. Fix: add "supports a Daubert reliability inquiry" / "admissibility remains a judicial determination" qualifiers.

3. **[HIGH] Sample draft originates computed dollar figures in the `opinions` and `loss_of_earning_capacity` sections** — contradicting the product's core hard guardrail ("never originate earning-capacity ranges or differentials"). An expert who adopts the sample scaffold as-is will have the tool's computed midpoint under their signature, not their own judgment. Fix: replace all computed midpoints and differentials in sample drafts with `[Expert to confirm: ...]` placeholders.
