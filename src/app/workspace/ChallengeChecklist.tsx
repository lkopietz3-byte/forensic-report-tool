"use client";

import { useState } from "react";

// A PRIVATE, EPHEMERAL challenge-readiness self-check. This is the deliberate
// design from the discoverability research: it renders only from the static
// template + the builder's current in-memory state. It is never fetched, never
// sent to a server, never written to the audit chain, and never included in the
// build/export payload — so it cannot become a discoverable "the software warned
// you and you ignored it" record. It also asks ONLY neutral completeness
// questions (drawn verbatim from the template's coverage prompts); it never
// suggests a fact, number, or conclusion, keeping it clear of the FRE 702
// independence line.

export interface SectionGuide {
  key: string;
  title: string;
  rule26Required: boolean;
  requiresEvidence: boolean;
  prompts: string[];
}

export function ChallengeChecklist({
  guide,
  usedKeys,
}: {
  guide: SectionGuide[];
  usedKeys: string[];
}) {
  const [open, setOpen] = useState(false);
  const used = new Set(usedKeys);

  const inReport = guide.filter((s) => used.has(s.key) && s.prompts.length > 0);
  const missingRequired = guide.filter((s) => s.rule26Required && !used.has(s.key));
  const total = inReport.reduce((n, s) => n + s.prompts.length, 0) + missingRequired.length;
  const topicCount = inReport.length + (missingRequired.length > 0 ? 1 : 0);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
        aria-expanded={open}
      >
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
            Final review
            <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-violet-700 ring-1 ring-violet-100">
              Private
            </span>
          </span>
          <span className="mt-1 block text-xs font-normal leading-relaxed text-slate-500">
            Neutral prompts for your judgment—not a grade and not part of the report.
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2 text-slate-400">
          {total > 0 && (
            <span className="hidden text-xs sm:inline">
              {total} prompts · {topicCount} topics
            </span>
          )}
          <svg
            className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="space-y-4 border-t border-slate-100 px-5 py-5 sm:px-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 px-3.5 py-3">
              <p className="text-lg font-semibold text-slate-900">{topicCount}</p>
              <p className="text-xs text-slate-500">topics to consider</p>
            </div>
            <div className="rounded-xl bg-slate-50 px-3.5 py-3">
              <p className="text-lg font-semibold text-slate-900">{total}</p>
              <p className="text-xs text-slate-500">neutral prompts</p>
            </div>
            <div className="rounded-xl bg-violet-50 px-3.5 py-3">
              <p className="text-lg font-semibold text-violet-900">Not saved</p>
              <p className="text-xs text-violet-700">or added to disclosure</p>
            </div>
          </div>

          {missingRequired.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <h4 className="text-sm font-semibold text-amber-950">
                Start here: {missingRequired.length} required report{" "}
                {missingRequired.length === 1 ? "element is" : "elements are"} not represented
              </h4>
              <p className="mt-1 text-xs text-amber-800">
                Confirm whether each applies before signing.
              </p>
              <ul className="mt-2 space-y-1.5 text-sm text-amber-950">
                {missingRequired.map((s) => (
                  <li key={s.key} className="flex gap-2">
                    <span className="mt-0.5 text-amber-500" aria-hidden>○</span>
                    {s.title}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {inReport.length > 0 && (
            <div>
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <h4 className="text-sm font-semibold text-slate-900">Review by topic</h4>
                <span className="text-xs text-slate-500">
                  Open only the sections relevant to your review
                </span>
              </div>
              <div className="space-y-2">
                {inReport.map((s) => (
                  <details
                    key={s.key}
                    className="group rounded-xl border border-slate-200 bg-white open:border-blue-200 open:bg-blue-50/30"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:hidden">
                      <span className="text-sm font-medium text-slate-800">{s.title}</span>
                      <span className="flex shrink-0 items-center gap-2 text-xs text-slate-500">
                        {s.prompts.length} {s.prompts.length === 1 ? "prompt" : "prompts"}
                        <span
                          aria-hidden
                          className="text-slate-400 transition-transform group-open:rotate-180"
                        >
                          ↓
                        </span>
                      </span>
                    </summary>
                    <ul className="space-y-2 border-t border-slate-100 px-4 py-3 text-sm leading-relaxed text-slate-700">
                      {s.prompts.map((q, i) => (
                        <li key={i} className="flex gap-2.5">
                          <span className="mt-0.5 text-slate-300" aria-hidden>○</span>
                          {q}
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
              </div>
            </div>
          )}

          {inReport.length === 0 && missingRequired.length === 0 && (
            <p className="text-sm text-slate-500">
              Add evidence to your sections to see section-specific review
              questions here.
            </p>
          )}

          <p className="text-xs leading-relaxed text-slate-500">
            Nothing in this review is logged, exported, or recorded in the
            AI-Disclosure Appendix. Disclosed. raises completeness questions;
            you decide what applies and what the report should say.
          </p>
        </div>
      )}
    </section>
  );
}
