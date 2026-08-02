// Pure, dependency-free model-label helper. Kept in its OWN module — separate
// from disclosure.ts — so it can be imported by client components without
// dragging in audit.ts (which imports node:crypto and would break the browser
// bundle). Display only; the raw ids stay in the hash-chained audit record.

// The internal id of the no-AI deterministic path. When EVERY recorded event
// used it, no generative model produced any text and the disclosure must say so.
export const STRUCTURER_MODEL = "deterministic-structurer";

/**
 * Human-readable model label for the disclosure. The raw ids stay in the audit
 * record (rawEvents / the hash chain); this is display only — a "deterministic
 * structurer" is not an AI model and must not read as one in the filed report.
 */
export function modelDisplay(model: string, version: string): string {
  if (model === STRUCTURER_MODEL) {
    return `Rule-based formatting — no AI model used (tool ${version})`;
  }
  return `${model} (${version})`;
}
