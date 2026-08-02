// Anti-hallucination grounding (plan Must-Have #1).
//
// The drafting model must cite the evidence unit behind every factual sentence
// using an inline marker: [[E:<evidenceId>]]. Where the case evidence is
// insufficient, the model must emit an explicit placeholder instead of
// inventing: [Expert input needed: ...]. This module verifies that contract and
// flags anything ungrounded for mandatory expert review BEFORE a section can be
// marked final.

// Tolerate incidental whitespace inside a marker ([[E: e1 ]]) so a stray space
// from the model never silently drops a citation and makes a grounded sentence
// read as ungrounded.
const CITATION_RE = /\[\[E:\s*([a-zA-Z0-9_-]+)\s*\]\]/g;
// Non-global twin of CITATION_RE for .test() — never share the global one with
// .test() (it advances lastIndex and corrupts a later matchAll on the same object).
const MARKER_TEST = /\[\[E:\s*[a-zA-Z0-9_-]+\s*\]\]/;
const PLACEHOLDER_RE = /\[Expert input needed:[^\]]*\]/i;

export interface GroundingResult {
  /** Distinct, valid evidence ids actually cited in the text. */
  citedEvidenceIds: string[];
  /** Sentences with no valid evidence citation and no placeholder. */
  ungroundedSentences: string[];
  /** Sentences that cite an id NOT in the allowed (fed-in) set — hallucinated cites. */
  invalidCitationSentences: string[];
  /** Explicit "[Expert input needed: ...]" placeholders. */
  placeholderSentences: string[];
  /** True only if there are zero ungrounded and zero invalid-citation sentences. */
  isClean: boolean;
}

// Abbreviations whose trailing period does NOT end a sentence. Forensic reports
// are dense with these (honorifics, party/firm suffixes, record citations), so a
// naive split would cut "Mr. Alvarez" in two and orphan the citation marker onto
// the wrong fragment — making a properly-grounded sentence read as ungrounded.
// Abbreviations that ALWAYS attach to the capitalized token that follows them —
// honorific/party titles and "versus" — so they can never end a sentence.
const ALWAYS_FUSE_ABBREVIATIONS = new Set([
  "mr", "mrs", "ms", "dr", "prof", "hon", "v", "vs",
]);
// Abbreviations that CAN legitimately end a sentence (record cites, list-enders,
// company/name suffixes): fuse with the following fragment only when it
// continues in lower-case or a digit ("Tbl. 2", "Inc. brought suit"), NOT when a
// new capitalized clause begins. Without this, "...files, etc. Lifetime loss is
// $4M [[E:e1]]." fuses into one sentence and the fabricated $4M rides e1's cite.
const CONTEXT_FUSE_ABBREVIATIONS = new Set([
  "no", "inc", "llc", "llp", "co", "corp", "ltd", "servs", "dept", "assn",
  "p", "pp", "ln", "para", "tbl", "fig", "ex", "dep", "vol", "ed",
  "al", "etc", "eg", "ie", "jr", "sr", "esq",
]);

// Whether a fragment's trailing period is a FALSE boundary (does not end the
// sentence). `next` is the fragment that would follow; it decides the
// context-sensitive abbreviations.
function endsOnFalseBoundary(fragment: string, next?: string): boolean {
  const trimmed = fragment.trimEnd();
  // A single letter is a name initial ("Dana M. Whitfield") only when it stands
  // alone — preceded by whitespace or the start. A letter glued to a number or
  // currency ("$9M.", "10K.") is a UNIT that really ends the sentence, so a
  // fabricated "$9M." can no longer fuse onto (and launder off) the next cited
  // sentence.
  if (/(?:^|\s)[A-Za-z]\.$/.test(trimmed)) return true;
  const m = /([A-Za-z][A-Za-z.]*)\.$/.exec(trimmed);
  if (!m) return false;
  const word = m[1].replace(/\./g, "").toLowerCase();
  if (ALWAYS_FUSE_ABBREVIATIONS.has(word)) return true;
  if (CONTEXT_FUSE_ABBREVIATIONS.has(word)) {
    // No following fragment → a real sentence end. A capitalized next fragment
    // starts a new sentence; lower-case or a digit continues this one.
    return next != null && !/^[A-Z]/.test(next.trimStart());
  }
  return false;
}

// A fragment is "citation only" when stripping its markers leaves no prose —
// e.g. the model emitted the marker AFTER the terminal period ("The beam
// failed. [[E:e1]]"), so the split orphaned the citation onto its own fragment.
// Such a fragment must reattach to the preceding sentence, or that sentence
// reads as ungrounded even though it was cited.
function isCitationOnly(fragment: string): boolean {
  // Never use CITATION_RE.test() here: it is a global regex, and .test()
  // advances its lastIndex, which would corrupt the next matchAll() that reads
  // from the same shared object. Detect a marker by whether .replace() (which
  // safely resets lastIndex) actually removed one.
  const withoutMarkers = fragment.replace(CITATION_RE, "");
  return withoutMarkers !== fragment && !/[A-Za-z0-9]/.test(withoutMarkers);
}

// A fragment can BEGIN with citation markers that the model (or the expert's
// edit) placed AFTER the previous sentence's terminal period — e.g.
// "...occasionally. [[E:e1]] The claimant lost $500,000." The sentence split
// orphans those markers onto the FOLLOWING fragment, where they would falsely
// ground it: this is the laundering vector that let a fabricated, uncited claim
// export as authoritative prose. Peel any leading markers off so the caller can
// reattach them to the sentence they actually terminate. A citation can only
// ground prose that precedes or surrounds it within the SAME sentence.
const LEADING_MARKERS_RE = /^\s*((?:\[\[E:\s*[a-zA-Z0-9_-]+\s*\]\]\s*)+)([\s\S]*)$/;
function peelLeadingMarkers(fragment: string): { markers: string; rest: string } {
  const m = LEADING_MARKERS_RE.exec(fragment);
  if (!m) return { markers: "", rest: fragment };
  return { markers: m[1]!.trim(), rest: m[2]!.trim() };
}

/** Split into sentences while keeping citation markers attached to their sentence. */
export function splitSentences(text: string): string[] {
  // Normalize marker/terminator adjacency BEFORE splitting. A citation marker
  // glued to a period ("reviewed.[[E:e1]]"), glued to the next word ("]]The"),
  // or sitting between a period and the next word ("]].The") would otherwise fuse
  // two sentences into one, letting the second ride the first's citation — the
  // laundering vector this guards against. Insert a space so the splitter sees
  // the real boundary. Markers are only separated from a FOLLOWING word char, so
  // a marker before a terminal period ("reach [[E:e1]].") is left untouched.
  const normalized = text
    .replace(/(\]\])(?=[A-Za-z0-9])/g, "$1 ")
    .replace(/(\]\][.!?。．！？])(?=[A-Za-z0-9])/g, "$1 ")
    .replace(/([.!?。．！？])(\[\[E:)/g, "$1 $2");

  const sentences: string[] = [];
  for (const line of normalized.split("\n")) {
    // Split on ASCII terminators followed by whitespace, AND on non-ASCII full
    // stops — 。 ． ！ ？ — which a converted PDF or hostile payload can slip in to
    // defeat an ASCII-only splitter (in CJK they may carry no trailing space).
    const parts = line.split(
      /(?<=[.!?。．！？])\s+|(?<=[。．！？])(?=\S)/,
    );
    let buffer = "";
    for (let i = 0; i < parts.length; i++) {
      buffer = buffer ? `${buffer} ${parts[i]}` : parts[i];
      if (!endsOnFalseBoundary(buffer, parts[i + 1])) {
        const trimmed = buffer.trim();
        if (trimmed) sentences.push(trimmed);
        buffer = "";
      }
    }
    const trimmed = buffer.trim();
    if (trimmed) sentences.push(trimmed);
  }

  // Split each sentence into independently-grounded CLAUSE units on strong
  // internal boundaries (';', em-dash, and a colon that FOLLOWS a cited clause),
  // so an uncited clause can no longer ride a cited one inside the same sentence —
  // the fabricated-figure laundering vector the audit proved. Commas are
  // deliberately NOT split (one citation legitimately covers a comma-joined
  // sentence), and separators inside a matched [ ... ] span (evidence markers and
  // "[Expert input needed: …]" placeholders) are never split. Erring toward more
  // units is SAFE: it fails closed (flags for a citation), it never launders.
  const units = sentences.flatMap(splitGroundingUnits);

  // Reattach orphaned citation markers to the unit they belong to, so a marker
  // can only ground the prose that precedes or surrounds it — never a following
  // clause or sentence. Running this AFTER the clause split also closes the
  // clause-level leading-marker case ("$30,000; [[E:e1]] more").
  const merged: string[] = [];
  for (const s of units) {
    // LEADING markers sat after the PREVIOUS sentence's terminal period. Attach
    // them to that sentence so they can't ground the prose that follows. If this
    // is the FIRST sentence there is no prior sentence they could terminate, so
    // they ground nothing and are dropped — a citation can only ground prose that
    // precedes or surrounds it within the same sentence. Either way the remaining
    // prose starts a genuinely new, and now correctly uncited, sentence.
    const { markers, rest } = peelLeadingMarkers(s);
    if (markers) {
      if (merged.length > 0) {
        merged[merged.length - 1] = `${merged[merged.length - 1]} ${markers}`;
      }
      if (rest && /[A-Za-z0-9]/.test(rest)) merged.push(rest);
      continue;
    }
    // TRAILING citation-only fragment (marker after the period on its own).
    if (merged.length > 0 && isCitationOnly(s)) {
      merged[merged.length - 1] = `${merged[merged.length - 1]} ${s}`;
      continue;
    }
    merged.push(s);
  }
  return merged;
}

// Split ONE sentence into clause-level grounding units on ';', an em-dash, or a
// colon that introduces a new clause. Bracket-aware via MATCHED-pair tracking: a
// separator inside a real [ ... ] span — an evidence marker "[[E:id]]" or an
// "[Expert input needed: …]" placeholder — is never a split point, but an
// UNbalanced '[' cannot suppress later splits, so bracket handling fails CLOSED.
function splitGroundingUnits(sentence: string): string[] {
  // Mark every index inside a MATCHED [ ... ] pair. A running depth counter fails
  // OPEN on an unmatched '[' — it stays >0 for the rest of the sentence and
  // disables every later separator split, which would let a stray bracket launder
  // the whole tail onto an earlier cite. Matching with a stack instead means an
  // unclosed '[' protects nothing, so separators after it still split. Nested
  // markers ("[[E:id]]") are covered because each ']' closes the nearest '['.
  const inside = new Array<boolean>(sentence.length).fill(false);
  const openStack: number[] = [];
  for (let i = 0; i < sentence.length; i++) {
    if (sentence[i] === "[") openStack.push(i);
    else if (sentence[i] === "]" && openStack.length > 0) {
      const open = openStack.pop()!;
      for (let j = open; j <= i; j++) inside[j] = true;
    }
  }

  const isDigit = (c: string | undefined) => c != null && c >= "0" && c <= "9";
  const units: string[] = [];
  let start = 0;
  for (let i = 0; i < sentence.length; i++) {
    if (inside[i]) continue;
    const ch = sentence[i];
    // Split a colon ONLY when the clause BEFORE it already carries a citation. The
    // laundering vector is a cite reaching FORWARD across the colon to ground an
    // uncited clause ("$30k [[E:e1]]: fabricated $2.3M"), so requiring a marker in
    // the pending clause catches exactly that (whether the next word is capital,
    // lower-case, or glued on with no space). A leading UNcited label
    // ("Exhibit A: … [[E:e1]]", "restrictions imposed by the physician: no
    // lifting … [[E:e1]]") is left intact — it behaves like the accepted
    // comma-join, the single cite covering the whole preceding clause. Numeric
    // colons (time "9:30", ratio "3:1", cite "18:2") are never boundaries.
    const isColonBoundary =
      ch === ":" &&
      !(isDigit(sentence[i - 1]) && isDigit(sentence[i + 1])) &&
      MARKER_TEST.test(sentence.slice(start, i));
    if (ch === ";" || ch === "—" || isColonBoundary) {
      const unit = sentence.slice(start, i).trim();
      if (unit) units.push(unit);
      start = i + 1;
    }
  }
  const last = sentence.slice(start).trim();
  if (last) units.push(last);
  return units;
}

export type SentenceStatus = "grounded" | "placeholder" | "ungrounded" | "invalid";

/**
 * Classify a single sentence against the closed-world set of allowed evidence
 * ids. This is the one source of truth shared by the export gate
 * (checkGrounding) and the live editor tint, so what the expert sees can never
 * disagree with what blocks sign-off.
 *
 * A hallucinated citation ("invalid") outranks a placeholder: a sentence that
 * carries an id outside the fed-in set must surface as invalid even if it also
 * contains an "[Expert input needed: ...]" placeholder, so a bad cite can never
 * hide behind a placeholder.
 */
export function classifySentence(
  sentence: string,
  allowedEvidenceIds: readonly string[] | ReadonlySet<string>,
): { status: SentenceStatus; validIds: string[] } {
  const allowed =
    allowedEvidenceIds instanceof Set
      ? allowedEvidenceIds
      : new Set(allowedEvidenceIds);
  const ids = extractCitedIds(sentence);
  const validIds = ids.filter((id) => allowed.has(id));
  const hasInvalid = ids.some((id) => !allowed.has(id));

  if (hasInvalid) return { status: "invalid", validIds };
  if (PLACEHOLDER_RE.test(sentence)) return { status: "placeholder", validIds };
  if (ids.length > 0) return { status: "grounded", validIds };
  return { status: "ungrounded", validIds };
}

function extractCitedIds(sentence: string): string[] {
  // matchAll seeds its iterator from the shared regex's lastIndex; reset it so a
  // stray mutation elsewhere can never cause a leading marker to be skipped.
  CITATION_RE.lastIndex = 0;
  const ids: string[] = [];
  for (const m of sentence.matchAll(CITATION_RE)) ids.push(m[1]);
  return ids;
}

/**
 * Every distinct evidence id cited anywhere in `text`, regardless of whether it
 * is in any allowed set. Unlike GroundingResult.citedEvidenceIds (which is
 * intersected with the closed-world set), this returns raw cites — so a caller
 * can detect citations to ids that were NEVER fed to the model, the signature of
 * a broken closed-world contract. Order is first-appearance, de-duplicated.
 */
export function extractAllCitedIds(text: string): string[] {
  const seen = new Set<string>();
  for (const id of extractCitedIds(text)) seen.add(id);
  return [...seen];
}

/**
 * Check a generated section against the closed-world set of evidence ids that
 * were actually fed into the model for that section.
 */
export function checkGrounding(
  text: string,
  allowedEvidenceIds: readonly string[],
): GroundingResult {
  const allowed = new Set(allowedEvidenceIds);
  const cited = new Set<string>();
  const ungroundedSentences: string[] = [];
  const invalidCitationSentences: string[] = [];
  const placeholderSentences: string[] = [];

  for (const sentence of splitSentences(text)) {
    const { status, validIds } = classifySentence(sentence, allowed);
    // Any valid id is genuinely cited, even on an invalid or placeholder
    // sentence; an invalid id is never counted.
    validIds.forEach((id) => cited.add(id));

    switch (status) {
      case "invalid":
        invalidCitationSentences.push(sentence);
        break;
      case "placeholder":
        placeholderSentences.push(sentence);
        break;
      case "ungrounded":
        ungroundedSentences.push(sentence);
        break;
      case "grounded":
        break;
    }
  }

  return {
    citedEvidenceIds: [...cited],
    ungroundedSentences,
    invalidCitationSentences,
    placeholderSentences,
    isClean:
      ungroundedSentences.length === 0 && invalidCitationSentences.length === 0,
  };
}

/**
 * Remove citation markers for display/export while leaving prose intact.
 * Stripping a marker that sat before a terminal period (e.g. "reach [[E:e1]].")
 * would otherwise leave a floating space before the punctuation ("reach ."), a
 * visible typographic defect in the rendered deliverable — so collapse runaway
 * spaces and tighten any space left in front of sentence punctuation.
 */
export function stripCitationMarkers(text: string): string {
  return text
    .replace(CITATION_RE, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+([.,;:!?])/g, "$1")
    .trimEnd();
}
