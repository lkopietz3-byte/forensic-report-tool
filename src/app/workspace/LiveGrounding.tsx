"use client";

import { classifySentence, splitSentences, stripCitationMarkers } from "@/lib/domain/grounding";

// Live, in-editor grounding readout. As the expert types a section, this runs
// the SAME classifier that gates every export (classifySentence) on each
// sentence and shows the verdict the instant it changes — so they watch a
// claim turn from "needs a source" to cited as they insert a citation, instead
// of waiting for a re-check. Pure client-side; never originates or stores text.
export function LiveGrounding({ text, allowedIds }: { text: string; allowedIds: string[] }) {
  const sentences = splitSentences(text)
    .map((s) => s.trim())
    .filter(Boolean);
  const rows = sentences.map((s) => ({ s, status: classifySentence(s, allowedIds).status }));
  const flagged = rows.filter((r) => r.status === "ungrounded" || r.status === "invalid");
  const open = rows.filter((r) => r.status === "placeholder");

  let dot = "bg-slate-300";
  let cls = "text-slate-500";
  let headline = "Start typing. Every factual sentence needs a citation.";
  if (rows.length > 0 && flagged.length > 0) {
    dot = "bg-red-500";
    cls = "text-red-700";
    headline = `${flagged.length} sentence${flagged.length === 1 ? " needs" : "s need"} a source. Flagged until cited, and export stays blocked.`;
  } else if (rows.length > 0 && open.length > 0) {
    dot = "bg-amber-500";
    cls = "text-amber-700";
    headline = `Every sentence is cited. ${open.length} open item${open.length === 1 ? "" : "s"} for you to fill in.`;
  } else if (rows.length > 0) {
    dot = "bg-emerald-500";
    cls = "text-emerald-700";
    headline = "Every sentence cites your evidence. Ready to save.";
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2">
      <p className={`flex items-center gap-2 text-xs font-medium ${cls}`} aria-live="polite">
        <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
        {headline}
      </p>
      {(flagged.length > 0 || open.length > 0) && (
        <ul className="mt-2 space-y-1.5 text-xs leading-relaxed">
          {flagged.map((r, i) => (
            <li key={`f${i}`} className="flex items-start gap-2 text-slate-700">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
              <span>
                {stripCitationMarkers(r.s)}{" "}
                <span className="font-medium text-red-600">
                  {r.status === "invalid"
                    ? "(its citation isn't one of this section's sources)"
                    : "(no source)"}
                </span>
              </span>
            </li>
          ))}
          {open.map((r, i) => (
            <li key={`o${i}`} className="flex items-start gap-2 text-slate-600">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
              <span>
                {r.s} <span className="font-medium text-amber-600">(you&apos;ll fill this in)</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
