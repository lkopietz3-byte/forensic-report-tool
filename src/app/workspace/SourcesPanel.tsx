"use client";

import { useMemo, useState } from "react";
import { FIELD } from "./ui";

// A live, DISPLAY-ONLY view of the sources behind the evidence list, grouped
// by the source-name part of each unit's locator. It renders purely from the
// builder's in-memory state: nothing in this panel is fetched, saved, written
// to the audit chain, or added to the report. Bulk actions only call back into
// the parent, which owns the units — the panel itself originates nothing.

export interface SourceUnit {
  id: string;
  content: string;
  location: string;
  sectionKey: string;
}


function sourceNameOf(location: string): string {
  return location.split(/[,¶]/)[0].trim() || "Unlabeled source";
}

function truncate(text: string, max = 90): string {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

export function SourcesPanel({
  units,
  sections,
  citedIds,
  onBulkSection,
  onBulkRemove,
  onRenameSource,
  onJump,
}: {
  units: SourceUnit[];
  sections: { key: string; title: string }[];
  /** Evidence ids cited in the last preview ([] when no preview yet). */
  citedIds: string[];
  onBulkSection: (ids: string[], sectionKey: string) => void;
  onBulkRemove: (ids: string[]) => void;
  /** Rewrite the source-name part of `location` for these units. */
  onRenameSource: (ids: string[], newName: string) => void;
  onJump: (id: string) => void;
}): React.ReactNode {
  const [open, setOpen] = useState(false);
  // All per-source UI state is keyed by source name; a rename or removal
  // changes the name, so stale entries simply stop matching and reset.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [sectionPick, setSectionPick] = useState<Record<string, string>>({});
  const [renames, setRenames] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState<string | null>(null);

  const groups = useMemo(() => {
    const byName = new Map<string, SourceUnit[]>();
    for (const u of units) {
      const name = sourceNameOf(u.location);
      const arr = byName.get(name);
      if (arr) arr.push(u);
      else byName.set(name, [u]);
    }
    return [...byName.entries()].map(([name, items]) => ({ name, items }));
  }, [units]);

  const titleByKey = useMemo(() => new Map(sections.map((s) => [s.key, s.title])), [sections]);
  const cited = useMemo(() => new Set(citedIds), [citedIds]);

  if (units.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        onClick={() => { setOpen((o) => !o); setConfirming(null); }}
        className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left"
        aria-expanded={open}
        aria-label="Show or hide your sources"
      >
        <span className="text-sm font-semibold text-slate-800">
          Your sources
          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
            {groups.length} source{groups.length === 1 ? "" : "s"} · {units.length} item{units.length === 1 ? "" : "s"}
          </span>
        </span>
        <svg
          className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="space-y-4 border-t border-slate-100 px-6 py-5">
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
            A live view of the sources behind your evidence. This is display
            only. Nothing in this panel is saved or added to the report.
          </p>

          <ul className="space-y-3">
            {groups.map(({ name, items }) => {
              const ids = items.map((u) => u.id);
              const isExpanded = expanded[name] ?? false;
              const pick = sectionPick[name] ?? sections[0]?.key ?? "";
              const renameValue = renames[name] ?? name;
              const trimmedRename = renameValue.trim();
              const isConfirming = confirming === name;
              const titles = [...new Set(items.map((u) => titleByKey.get(u.sectionKey) ?? u.sectionKey))];
              return (
                <li key={name} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-800">{name}</p>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                        {items.length} item{items.length === 1 ? "" : "s"}
                      </span>
                      {titles.map((t) => (
                        <span key={t} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          {t}
                        </span>
                      ))}
                      {citedIds.length > 0 && (
                        items.some((u) => cited.has(u.id)) ? (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                            Cited in preview
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                            Not cited in preview
                          </span>
                        )
                      )}
                    </div>
                    <button
                      onClick={() => { setExpanded((m) => ({ ...m, [name]: !isExpanded })); setConfirming(null); }}
                      aria-expanded={isExpanded}
                      aria-label={`${isExpanded ? "Hide" : "Show"} the ${items.length} evidence items from ${name}`}
                      className="shrink-0 text-xs font-semibold text-blue-900 transition hover:text-blue-950"
                    >
                      {isExpanded ? "Hide items" : "Show items"}
                    </button>
                  </div>

                  {isExpanded && (
                    <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-100">
                      {items.map((u) => (
                        <li key={u.id} className="flex items-center justify-between gap-3 px-3 py-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="inline-flex h-5 shrink-0 items-center justify-center rounded bg-blue-100 px-1.5 text-[11px] font-semibold text-blue-700">
                              {u.id}
                            </span>
                            <p className="truncate text-sm text-slate-700">{truncate(u.content)}</p>
                          </div>
                          <button
                            onClick={() => onJump(u.id)}
                            aria-label={`Jump to evidence ${u.id}`}
                            className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            Jump
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div className="flex gap-2">
                      <select
                        aria-label={`Section to assign all items from ${name}`}
                        className={`${FIELD} min-w-0 text-sm`}
                        value={pick}
                        onChange={(e) => { setSectionPick((m) => ({ ...m, [name]: e.target.value })); setConfirming(null); }}
                      >
                        {sections.map((s) => (<option key={s.key} value={s.key}>{s.title}</option>))}
                      </select>
                      <button
                        onClick={() => { if (pick) onBulkSection(ids, pick); setConfirming(null); }}
                        disabled={!pick}
                        aria-label={`Apply the selected section to all ${items.length} items from ${name}`}
                        className="shrink-0 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        Apply to all {items.length}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        aria-label={`Rename source ${name}`}
                        className={`${FIELD} min-w-0 text-sm`}
                        maxLength={160}
                        value={renameValue}
                        onChange={(e) => { setRenames((m) => ({ ...m, [name]: e.target.value })); setConfirming(null); }}
                      />
                      <button
                        onClick={() => { if (trimmedRename && trimmedRename !== name) onRenameSource(ids, trimmedRename); setConfirming(null); }}
                        disabled={!trimmedRename || trimmedRename === name}
                        aria-label={`Save the new name for source ${name}`}
                        className="shrink-0 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        Save
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => {
                        if (isConfirming) {
                          onBulkRemove(ids);
                          setConfirming(null);
                        } else {
                          setConfirming(name);
                        }
                      }}
                      onBlur={() => setConfirming((c) => (c === name ? null : c))}
                      aria-label={
                        isConfirming
                          ? `Confirm removing all ${items.length} items from ${name}`
                          : `Remove all ${items.length} items from ${name}`
                      }
                      className={
                        isConfirming
                          ? "rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                          : "rounded-lg border border-transparent px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:text-red-600"
                      }
                    >
                      {isConfirming ? `Confirm remove (${items.length})` : "Remove all"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
