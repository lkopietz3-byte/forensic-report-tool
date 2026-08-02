# Auditor 19 — Grounding/Validation Engine Correctness

**Scope:** Logic correctness and robustness of `checkGrounding`, `splitSentences`, marker parsing, `validateRule26`, and related domain modules. NOT adversarial injection (separate auditor).

**Test baseline:** 48 tests across 8 files, all passing.

---

## Gaps Found

### [CRITICAL] Gap 1 — Marker placed AFTER the terminal period produces a false "ungrounded"

**File:** `src/lib/domain/grounding.ts` — `splitSentences` / `checkGrounding`

**Input that breaks it:**
```
"The beam failed. [[E:e1]] The load was 12 kN [[E:e2]]."
```
When the model emits `[[E:e1]]` on its own line or immediately after the period (not before it), `splitSentences` splits at the period, yielding `"The beam failed."` as a standalone fragment with no citation marker. That fragment hits `extractCitedIds` → returns `[]` → lands in `ungroundedSentences`. The sentence is then flagged as ungrounded even though the author intended the marker to cite it.

**Expected:** the sentence is grounded (marker is associated with it).
**Actual:** `ungroundedSentences` contains `"The beam failed."`, `isClean = false`.

**Why this matters:** If the model consistently emits markers post-period (a common LLM habit), experts will see a flood of false ungrounded flags, erode trust in the system, and start ignoring flags — defeating the entire anti-hallucination guarantee.

**Fix:** After splitting, check whether the *next* fragment starts with a bare `[[E:...]]` block (no preceding text). If so, prepend that marker to the preceding fragment before checking. Alternatively, in the splitter, detect a fragment consisting solely of citation markers (possibly whitespace-surrounded) and merge it into the prior sentence.

**Test to add:**
```ts
it("associates a post-period marker with the preceding sentence", () => {
  const r = checkGrounding(
    "The beam failed. [[E:e1]] The load was 12 kN [[E:e2]].",
    ["e1", "e2"],
  );
  expect(r.isClean).toBe(true);
  expect(r.ungroundedSentences).toEqual([]);
});
```

---

### [CRITICAL] Gap 2 — Empty id `[[E:]]` accepted by `CITATION_RE`, treated as a valid citation when `""` is in `allowedEvidenceIds`

**File:** `src/lib/domain/grounding.ts` — `CITATION_RE` / `checkGrounding`

**Input that breaks it:**
```
checkGrounding("The bridge was unsafe [[E:]].", [])
// or in a degenerate call:
checkGrounding("The bridge was unsafe [[E:]].", [""])
```

`CITATION_RE = /\[\[E:([a-zA-Z0-9_-]+)\]\]/g` requires one or more `[a-zA-Z0-9_-]` characters, so `[[E:]]` does NOT match — meaning the sentence correctly falls into `ungroundedSentences`. So far, so good.

However, a subtly malformed marker such as `[[E: e1]]` (space before `e1`) also fails to match the regex (space is not in `[a-zA-Z0-9_-]`). The sentence is therefore flagged as ungrounded even though the evidence id `e1` exists in the allowed set and the human reading the marker would consider it valid. This is a **false ungrounded** (over-flag).

**Expected:** `[[E: e1]]` (one leading space) is treated the same as `[[E:e1]]`.
**Actual:** the marker is silently ignored; sentence lands in `ungroundedSentences`.

**Fix (two-part):**
1. Trim whitespace inside the id capture group: change regex to `\[\[E:\s*([a-zA-Z0-9_-]+)\s*\]\]` so a space-padded id is still extracted.
2. Separately, add an explicit "malformed marker detector" that matches `\[\[E:[^\]]*\]\]` (the loose form) and flags the sentence as `invalidCitationSentences` rather than silently treating it as ungrounded — this gives the expert a more accurate diagnosis.

**Test to add:**
```ts
it("handles whitespace inside [[E: id ]] by trimming rather than silently ignoring", () => {
  const r = checkGrounding("The load exceeded [[E: e1 ]].", ["e1"]);
  // With fix: treated as valid citation; without fix: false ungrounded.
  expect(r.ungroundedSentences).toEqual([]);
  expect(r.citedEvidenceIds).toContain("e1");
});
```

---

### [CRITICAL] Gap 3 — Decimal numbers cause spurious sentence splits → marker orphaned → false "ungrounded"

**File:** `src/lib/domain/grounding.ts` — `splitSentences`

**Input that breaks it:**
```
"The load was 12.5 kN at joint A [[E:e1]]."
```
The splitter uses `line.split(/(?<=[.!?])\s+/)`. The lookbehind `(?<=[.])` matches the `.` in `12.5` if the number is followed by whitespace (e.g. `"12. 5"` after lossy extraction, or in a sentence like `"Sect. 3.2 states the load [[E:e1]]."` — the `.` after `2` followed by a space triggers a split). In more direct danger: `"The measurement is 3.5 m." ` vs `"The result per ASTM Table 3. Fig 2 shows the crack [[E:e1]]."` — here the `.` after `3` followed by a space produces a split, orphaning `"Fig 2 shows the crack [[E:e1]]."` as the second sentence while `"The result per ASTM Table 3."` is flagged ungrounded.

`endsOnFalseBoundary` catches single-letter initials and a fixed set of abbreviations, but does NOT catch bare digits — `"Table 3."` ends in `"3"`, which has no letter, so `m[1]` in the regex `([A-Za-z][A-Za-z.]*)` never matches; `endsOnFalseBoundary` returns `false` and the split is accepted.

**Expected:** `"The result per ASTM Table 3. Fig 2 shows the crack [[E:e1]]."` — two legitimate sentences, the second grounded.
**Actual depending on context:** if `"Table 3."` is followed by `" Fig"` and the model intended them as separate sentences, the split is correct; but if the citation was meant to cover the entire compound sentence about Table 3 and Fig 2, the first sentence becomes ungrounded.

More concretely, `"The value is 3.14 m [[E:e1]]."` (no internal space after decimal) does NOT split because the lookbehind only fires on `.\s+`, so decimals without trailing space are safe. The real danger is `"Ref. No. 3. See also Fig 2 [[E:e1]]."` — the `.` after `"No"` is caught by `NON_TERMINAL_ABBREVIATIONS` (`"no"`) but only when it immediately precedes whitespace AND `endsOnFalseBoundary` fires. The gap is specifically a numeral followed by `.` then space that is NOT a sentence end but is not guarded.

**Fix:** Extend `endsOnFalseBoundary` to also return `true` when the fragment ends with a digit followed by `.` — i.e., add a check: `if (/\d\.$/.test(fragment.trimEnd())) return true;`. Better still, handle ordinals like `1st`, `2nd`, `3rd` and section references like `§ 3.2`.

**Test to add:**
```ts
it("does not split on a numeral followed by period when part of a reference", () => {
  const out = splitSentences("See ASTM Table 3. Fig 2 confirms the load [[E:e1]].");
  // Whether one or two sentences, the citation must appear in the last one
  expect(out[out.length - 1]).toContain("[[E:e1]]");
});

it("does not falsely split decimal numbers", () => {
  // Decimal in middle of sentence should not split
  const out = splitSentences("The mean was 3. 5 kN was recorded [[E:e1]].");
  expect(out[out.length - 1]).toContain("[[E:e1]]");
});
```

---

### [HIGH] Gap 4 — `requiresEvidence=false` sections with no content pass `validateRule26` while `checkGrounding` would flag them — inconsistency in "clean" definition

**File:** `src/lib/domain/rule26.ts` — `validateRule26`

`validateRule26` only checks `effectiveText(section).length === 0` for emptiness; it does NOT call `checkGrounding` on evidence-required sections at all — it relies on the caller having pre-populated `section.ungroundedFlags`. This means if a section with `requiresEvidence=true` has non-empty text but `ungroundedFlags` was never populated (e.g., the pipeline ran and stored the section but the grounding check was skipped or its result discarded), `validateRule26` will see `ungroundedFlags.length === 0` and pass, producing a false "ok".

**Concrete scenario:** a caller creates a `ReportSection` directly (e.g., from DB deserialization without re-running `checkGrounding`) and passes it to `validateRule26`. The section has uncited sentences but an empty `ungroundedFlags` array (default). Result: `validateRule26` returns `ok: true`. Export proceeds. An unsupported statement ships.

**Expected:** `validateRule26` should either re-run `checkGrounding` internally or document that `ungroundedFlags` MUST be kept current and add an assertion that guards against a stale zero.

**Fix:** In `validateRule26`, for evidence-required sections, call `checkGrounding(effectiveText(section), [])` (or better, pass the allowed id set through) and union the result into the check. Or at minimum, when `requireGroundingResolved=true`, verify that `section.ungroundedFlags` is non-null/non-undefined (not just length-checked), or add a comment making the stale-flag risk explicit.

**Test to add:**
```ts
it("does not falsely pass when ungroundedFlags was not populated (stale-zero gap)", () => {
  // Section with uncited text but ungroundedFlags defaulted to []
  const sections = completeSections().map((s) =>
    s.key === "opinions"
      ? { ...s, draftText: "Ungrounded claim with no citation.", ungroundedFlags: [] }
      : s
  );
  // This test documents the gap: currently returns ok=true (false clean)
  const r = validateRule26(sections, PLACEHOLDER_TEMPLATE);
  // Ideally should be false; currently true — gap confirmed.
  expect(r.ok).toBe(false); // FAILS until fix is applied
});
```

---

### [HIGH] Gap 5 — Placeholder sentence that also contains an invalid citation is silently treated as clean

**File:** `src/lib/domain/grounding.ts` — `checkGrounding`

**Input that breaks it:**
```
checkGrounding("[Expert input needed: load value] [[E:e999]].", ["e1"])
```

`PLACEHOLDER_RE.test(sentence)` returns `true` because the sentence contains `[Expert input needed: ...]`. The code immediately does `placeholderSentences.push(sentence); continue;` — it never checks whether the sentence ALSO contains an invalid citation id (`e999`). The invalid cite `e999` is never flagged.

**Expected:** A sentence combining a placeholder with an invalid citation should produce an `invalidCitationSentences` entry (or at minimum not silently pass as "clean").
**Actual:** the sentence lands only in `placeholderSentences`, `e999` is never flagged, and `isClean` may be `true` even though a hallucinated citation is present in the text.

**Fix:** Before `continue`-ing on a placeholder match, still run `extractCitedIds` and check for invalid ids; if found, also push to `invalidCitationSentences`. Or re-order checks: invalid-citation check first, placeholder check second.

**Test to add:**
```ts
it("flags invalid citations even when the sentence also contains a placeholder", () => {
  const r = checkGrounding(
    "[Expert input needed: load value] [[E:e999]].",
    ["e1"],
  );
  expect(r.invalidCitationSentences).toHaveLength(1);
  expect(r.isClean).toBe(false);
});
```

---

### [HIGH] Gap 6 — `validateRule26` grounding gate does NOT fire for non-Rule-26 evidence-required sections

**File:** `src/lib/domain/rule26.ts` — `validateRule26`

The grounding-unresolved check iterates `sections` and checks `evidenceRequired.has(section.key)` — this correctly includes all `requiresEvidence=true` sections from the template, not just Rule 26 required ones. However, the non-Rule-26 narrative sections (`background`, `scope_of_assignment`, `investigation`, `analysis`, etc.) are NOT checked for emptiness by `validateRule26` at all — only the six `RULE_26_ELEMENTS` have the emptiness check. So a narrative section that is present but has `draftText = "   "` (whitespace-only) is:
- Not caught by the `effectiveText(section).length === 0` emptiness check (because that loop only runs over `RULE_26_ELEMENTS`)
- Has `ungroundedFlags = []` (empty string produces no sentences)
- Passes both checks

If the export pipeline relies on `validateRule26` as the sole gate, a whitespace-only narrative section slips through.

**Fix:** Either extend the emptiness check to all `requiresEvidence=true` sections, or document that `validateRule26` is intentionally limited to Rule 26 elements and add a separate "section completeness" validator.

**Test to add:**
```ts
it("catches a whitespace-only evidence-required non-Rule26 section", () => {
  const sections = [
    ...completeSections(),
    { key: "background" as ReportSectionKey, title: "Background",
      draftText: "   ", citedEvidenceIds: [], ungroundedFlags: [] }
  ];
  const r = validateRule26(sections, PLACEHOLDER_TEMPLATE);
  // Currently passes (gap); after fix should either warn or block
  expect(r.ok).toBe(false);
});
```

---

### [MEDIUM] Gap 7 — `isClean=true` when `allowedEvidenceIds` is empty and section text is blank (empty string)

**File:** `src/lib/domain/grounding.ts` — `checkGrounding`

```
checkGrounding("", [])
// Returns: { citedEvidenceIds:[], ungroundedSentences:[], invalidCitationSentences:[],
//             placeholderSentences:[], isClean: true }
```

`splitSentences("")` returns `[]`. The loop never executes. All arrays stay empty. `isClean = true`.

For a section with `requiresEvidence=true`, an empty draft text should arguably NOT be considered "clean" — it has no grounded content. The downstream `validateRule26` does catch zero-length text as "empty" for Rule 26 sections, but only if the section exists in the `byKey` map at all. For narrative sections, the emptiness check is absent (Gap 6 above), so `isClean=true` for empty text compounds that gap.

**Fix:** `checkGrounding` should either treat empty text as a special "no content" result (`isClean: false` or a separate `isEmpty: true` flag), or the caller should guard against calling it on empty text.

**Test to add:**
```ts
it("does not declare empty text clean when evidence is required", () => {
  const r = checkGrounding("", ["e1"]);
  // Currently isClean=true; semantically this should be false or have isEmpty flag
  expect(r.isClean).toBe(false);
});
```

---

### [MEDIUM] Gap 8 — Id prefix collision: `[[E:e1]]` matches when allowed set contains only `e10`

This is NOT a bug — `CITATION_RE` captures the full id between `[[E:` and `]]`, so `[[E:e1]]` captures `"e1"` and `[[E:e10]]` captures `"e10"`. The `allowed.has(id)` check is exact. No prefix collision bug exists in the current regex. **No gap here** — documented to confirm it was checked.

---

### [MEDIUM] Gap 9 — Multi-sentence paragraph sharing one terminal citation marker: only last sentence is grounded

**Input:**
```
"Observation one. Observation two. Observation three [[E:e1]]."
```

`splitSentences` splits this into three sentences: `"Observation one."`, `"Observation two."`, `"Observation three [[E:e1]]."`. Only the third is grounded. The first two are flagged as `ungroundedSentences`. This is arguably **correct behavior** (each sentence should have its own citation), but it is a systemic **false-ungrounded / over-flag risk** because models often emit a single citation at the end of a multi-sentence passage meaning to cover all of them.

This is not a code bug per se, but it creates predictable noise: every multi-sentence paragraph with a trailing citation will generate `n-1` false ungrounded flags, which erodes expert trust in the checker.

**Recommendation:** Add a note to the model prompt explicitly requiring per-sentence citation markers. Add a test documenting this behavior as intentional so it is not accidentally "fixed" in a way that introduces false clean:

```ts
it("flags all but the last sentence when only the last carries the citation", () => {
  const r = checkGrounding(
    "Observation one. Observation two. Observation three [[E:e1]].",
    ["e1"],
  );
  expect(r.ungroundedSentences).toContain("Observation one.");
  expect(r.ungroundedSentences).toContain("Observation two.");
  expect(r.isClean).toBe(false);
});
```

---

### [MEDIUM] Gap 10 — `PLACEHOLDER_RE` is case-insensitive on "Expert input needed" but the colon is required; a model emitting `[Expert Input Needed — …]` (em dash or colon-less form) is not recognized

**Input:**
```
"[Expert input needed — see case file]."
```
`PLACEHOLDER_RE = /\[Expert input needed:[^\]]*\]/i` requires a literal colon immediately after "needed". A model that emits an em dash (`—`) or hyphen instead of a colon (`:`), or omits the colon entirely, produces no placeholder match. The sentence falls into `ungroundedSentences`.

**Expected:** recognized as a placeholder.
**Actual:** flagged as ungrounded — a false positive over-flag.

**Fix:** Loosen the regex to `\[Expert input needed[^:\]]*:[^\]]*\]` or document the exact required format in the system prompt and add a test asserting that deviation is correctly rejected (so experts know to use the exact format).

**Test to add:**
```ts
it("does not recognize a placeholder with em-dash instead of colon", () => {
  const r = checkGrounding("[Expert input needed — load rating].", ["e1"]);
  // Documents current strict behavior; fix would make this a placeholder
  expect(r.placeholderSentences).toHaveLength(0);
  expect(r.ungroundedSentences).toHaveLength(1);
});
```

---

### [LOW] Gap 11 — `finalText` set to an empty string `""` is treated as "not set" — resolves ungrounded flags incorrectly

**File:** `src/lib/domain/rule26.ts` — grounding gate (`section.finalText === undefined`)

The gate condition is `section.finalText === undefined`. If `finalText` is set to `""` (empty string, e.g., by a UI that clears the field), `finalText !== undefined`, so the condition is false — the grounding gate is skipped even though the final text is empty. Combined with an unresolved `ungroundedFlags`, this means an expert who clears `finalText` to `""` bypasses the gate.

**Fix:** Change the condition to `section.finalText == null || section.finalText.trim() === ""` or use the same `effectiveText` helper that already handles this.

**Test to add:**
```ts
it("does not bypass grounding gate when finalText is empty string", () => {
  const sections = completeSections().map((s) =>
    s.key === "opinions"
      ? section("opinions", { ungroundedFlags: ["Bad."], finalText: "" })
      : s,
  );
  const r = validateRule26(sections, PLACEHOLDER_TEMPLATE);
  expect(r.ok).toBe(false); // Currently passes (gap)
});
```

---

### [LOW] Gap 12 — Disclosure appendix entries not cross-checked against grounding state — a section with unresolved flags can appear in the disclosure as a "completed" entry

**File:** `src/lib/domain/disclosure.ts` — `generateDisclosureAppendix`

`generateDisclosureAppendix` maps every audit event to a `DisclosureSectionEntry` unconditionally, with no indication of whether the section has outstanding `ungroundedFlags`. A court reader of the appendix sees every section listed as "AI-drafted from these sources" with no signal that some content was flagged as potentially ungrounded. This is a disclosure completeness gap: the appendix could misrepresent the verification state.

**Fix:** Accept the `sections: ReportSection[]` array as an optional parameter and annotate each entry with `groundingPending: boolean` when the corresponding section has unresolved flags.

---

## Top 3 Must-Fix

1. **[CRITICAL] Gap 1 — Post-period citation marker produces false ungrounded.** A common LLM output pattern silently fails grounding and floods experts with false flags, destroying trust in the check.
2. **[CRITICAL] Gap 5 — Placeholder + invalid citation → invalid cite silently swallowed.** A hallucinated evidence id is never flagged if it co-occurs with a placeholder, allowing a fabricated cite to pass as "clean".
3. **[CRITICAL] Gap 4 — Stale `ungroundedFlags=[]` bypasses Rule 26 grounding gate.** Any caller that constructs or deserializes a `ReportSection` without re-running `checkGrounding` gets a false `ok=true` from `validateRule26`, potentially allowing export of unverified content.
