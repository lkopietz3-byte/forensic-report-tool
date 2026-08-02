"use client";

import { useRef, useState } from "react";
import { classifySentence, splitSentences } from "@/lib/domain/grounding";

// An interactive proof of the one invariant skeptics care about: the tool
// CANNOT put a fact into a report unless it cites a source the expert supplied.
// It runs the REAL grounding classifier (the same one that gates every export),
// against a fixed three-source "case file", so a visitor can try to slip in an
// invented number or a made-up citation and watch it get blocked. No network,
// no AI — pure client-side domain logic.

const EVIDENCE = [
  { id: "E1", n: 1, label: "W-2 earnings records, 2019–2022" },
  { id: "E2", n: 2, label: "Labor-market survey, Table 2" },
  { id: "E3", n: 3, label: "Treating physician's work restrictions" },
];
const ALLOWED = EVIDENCE.map((e) => e.id);
const N_BY_ID = new Map(EVIDENCE.map((e) => [e.id, e.n]));

const EXAMPLES: { label: string; text: string }[] = [
  {
    label: "An unsupported claim",
    text: "The evaluee's post-injury earning capacity is limited to about $30,000 per year.",
  },
  {
    label: "A made-up citation",
    text: "The evaluee's post-injury earning capacity is limited to about $30,000 per year [[E:E9]].",
  },
  {
    label: "A properly cited sentence",
    text: "Post-injury earning capacity falls to roughly $41,000 per year [[E:E2]].",
  },
];

const CITE_RE = /\[\[E:([a-zA-Z0-9_-]+)\]\]/g;

// Render a sentence with its [[E:id]] markers shown as numbered chips — a valid
// id becomes a blue chip; an id that isn't in the case file becomes a red "?".
function renderSentence(s: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const m of s.matchAll(CITE_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push(s.slice(last, idx));
    const n = N_BY_ID.get(m[1]!);
    out.push(
      n ? (
        <sup
          key={key++}
          className="mx-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded bg-blue-100 px-1 text-[10px] font-semibold text-blue-700"
        >
          {n}
        </sup>
      ) : (
        <sup
          key={key++}
          className="mx-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded bg-red-100 px-1 text-[10px] font-semibold text-red-700"
          title="This citation points to a source that isn't in the case file."
        >
          ?
        </sup>
      ),
    );
    last = idx + m[0].length;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}

export function TryItDemo() {
  const [text, setText] = useState(EXAMPLES[0].text);
  const ref = useRef<HTMLTextAreaElement | null>(null);

  const sentences = splitSentences(text).filter((s) => s.trim());
  const rows = sentences.map((s) => ({ s, status: classifySentence(s, ALLOWED).status }));
  const blocked = rows.filter((r) => r.status === "ungrounded" || r.status === "invalid").length;
  const clean = rows.length > 0 && blocked === 0;

  function insertCite(id: string) {
    const ta = ref.current;
    const marker = `[[E:${id}]]`;
    if (!ta) {
      setText((t) => `${t.trimEnd()} ${marker}`);
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = text.slice(0, start);
    const after = text.slice(end);
    const lead = before.length === 0 || /\s$/.test(before) ? "" : " ";
    const next = before + lead + marker + after;
    setText(next);
    const caret = start + (lead + marker).length;
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(caret, caret);
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
      {/* Editor + live verdict */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Try one:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              onClick={() => setText(ex.text)}
              className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              {ex.label}
            </button>
          ))}
        </div>

        <label htmlFor="trydemo" className="mt-4 mb-1.5 block text-xs font-medium text-slate-600">
          Write a sentence for the report
        </label>
        <textarea
          id="trydemo"
          ref={ref}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          maxLength={600}
          spellCheck={false}
          className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-mono text-[13px] leading-relaxed text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
        />

        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
          <span>Cite a source. Click to insert:</span>
          {EVIDENCE.map((e) => (
            <button
              key={e.id}
              onClick={() => insertCite(e.id)}
              className="rounded bg-blue-100 px-2 py-1 font-semibold text-blue-700 transition hover:bg-blue-200"
              aria-label={`Insert a citation to source ${e.n}: ${e.label}`}
            >
              [{e.n}]
            </button>
          ))}
        </div>

        {/* Verdict */}
        <div
          className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
            clean
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
          aria-live="polite"
        >
          <p className="font-semibold">
            {clean
              ? "Citation check passed. Every sentence names a source you supplied."
              : blocked > 0
                ? `Export blocked. ${blocked} sentence${blocked === 1 ? "" : "s"} cite${blocked === 1 ? "s" : ""} no source you supplied.`
                : "Type a sentence above."}
          </p>
          {blocked > 0 && (
            <p className="mt-1 text-xs leading-relaxed">
              This is the exact check that runs on every real export. The tool
              won&apos;t let the flagged text into a report until it cites one of
              your three sources.
            </p>
          )}
        </div>

        {/* Per-sentence breakdown */}
        {rows.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {rows.map((r, i) => {
              const bad = r.status === "ungrounded" || r.status === "invalid";
              return (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${bad ? "bg-red-500" : r.status === "placeholder" ? "bg-amber-500" : "bg-emerald-500"}`}
                  />
                  <span className="text-slate-700">
                    {renderSentence(r.s)}{" "}
                    <span className={`text-xs font-medium ${bad ? "text-red-600" : "text-emerald-600"}`}>
                      {r.status === "ungrounded"
                        ? "(no source)"
                        : r.status === "invalid"
                          ? "(cites a source that isn't yours)"
                          : r.status === "placeholder"
                            ? "(open item)"
                            : "(cited)"}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* The closed world: the only three sources */}
      <aside className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Sources available to the citation check
        </p>
        <ul className="mt-3 space-y-2.5">
          {EVIDENCE.map((e) => (
            <li key={e.id} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="mt-px inline-flex h-4 min-w-4 items-center justify-center rounded bg-blue-100 px-1 text-[10px] font-semibold text-blue-700">
                {e.n}
              </span>
              <span>{e.label}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs leading-relaxed text-slate-600">
          The check accepts only these source IDs. It cannot determine whether a
          sentence&apos;s meaning is actually supported; the expert verifies
          that relationship before signing.
        </p>
      </aside>
    </div>
  );
}
