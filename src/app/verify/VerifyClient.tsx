"use client";

import { useCallback, useRef, useState } from "react";
import {
  parseManifest,
  verifyManifestChain,
  type DisclosureManifest,
  type ManifestVerification,
} from "@/lib/domain/verifyManifest";
import { modelDisplay } from "@/lib/domain/modelDisplay";

type Status = "idle" | "verifying" | "done" | "error";

// Entirely client-side: the pasted/loaded manifest is parsed and its SHA-256
// hash chain recomputed in the browser via Web Crypto. Nothing is uploaded.
export function VerifyClient() {
  const [manifest, setManifest] = useState<DisclosureManifest | null>(null);
  const [result, setResult] = useState<ManifestVerification | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [paste, setPaste] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setManifest(null);
    setResult(null);
    setError(null);
  };

  const ingest = useCallback(async (text: string, label: string) => {
    setError(null);
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      reset();
      setStatus("error");
      setError(`${label} isn't valid JSON.`);
      return;
    }
    const m = parseManifest(json);
    if (!m) {
      reset();
      setStatus("error");
      setError(`${label} isn't a Disclosed. disclosure manifest (it has no "events" list).`);
      return;
    }
    setManifest(m);
    setResult(null);
    setStatus("verifying");
    try {
      const r = await verifyManifestChain(m.events);
      setResult(r);
      setStatus("done");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Verification could not run in this browser.");
    }
  }, []);

  const onFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      await ingest(await file.text(), file.name);
    },
    [ingest],
  );

  const loadSample = useCallback(
    async (which: "clean" | "altered") => {
      const path =
        which === "clean"
          ? "/sample-disclosure-manifest.json"
          : "/sample-disclosure-manifest-altered.json";
      try {
        const text = await (await fetch(path)).text();
        await ingest(text, which === "clean" ? "The intact sample" : "The altered sample");
      } catch {
        reset();
        setStatus("error");
        setError("Could not load the sample manifest.");
      }
    },
    [ingest],
  );

  return (
    <div className="mt-8">
      {/* Input surface */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void onFile(e.dataTransfer.files?.[0]);
        }}
        className={`rounded-2xl border-2 border-dashed px-6 py-8 text-center transition ${
          dragOver ? "border-blue-400 bg-blue-50/60" : "border-slate-300 bg-white"
        }`}
      >
        <p className="text-sm font-medium text-slate-700">
          Drop a disclosure manifest (<code className="text-slate-500">.json</code>) here
        </p>
        <p className="mt-1 text-xs text-slate-500">
          or
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-xl bg-blue-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-950"
          >
            Choose a file
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
        </div>
        <p className="mt-4 text-xs text-slate-500">
          Verification runs entirely in your browser. Nothing is uploaded.
        </p>
      </div>

      {/* Try-it samples */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <span className="text-slate-500">No manifest handy? Try a sample:</span>
        <button
          type="button"
          onClick={() => void loadSample("clean")}
          className="font-medium text-blue-800 underline-offset-2 hover:underline"
        >
          an intact record
        </button>
        <button
          type="button"
          onClick={() => void loadSample("altered")}
          className="font-medium text-blue-800 underline-offset-2 hover:underline"
        >
          a doctored record
        </button>
      </div>

      {/* Paste fallback */}
      <details className="mt-4 rounded-xl border border-slate-200 bg-white">
        <summary className="cursor-pointer px-4 py-2.5 text-sm font-medium text-slate-700">
          Or paste the manifest text
        </summary>
        <div className="border-t border-slate-100 px-4 py-3">
          <textarea
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            rows={5}
            placeholder='{ "format": "disclosed.ai-disclosure-manifest", "events": [ … ] }'
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
          <button
            type="button"
            disabled={!paste.trim()}
            onClick={() => void ingest(paste, "The pasted text")}
            className="mt-2 rounded-lg bg-slate-800 px-3.5 py-1.5 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:opacity-40"
          >
            Verify pasted text
          </button>
        </div>
      </details>

      {/* Error */}
      {status === "error" && error && (
        <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      )}

      {/* Verifying */}
      {status === "verifying" && (
        <div className="mt-6 text-sm text-slate-500">Recomputing the hash chain…</div>
      )}

      {/* Verdict */}
      {status === "done" && result && manifest && (
        <div className="mt-6">
          {result.ok ? (
            <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-5 py-4">
              <p className="flex items-center gap-2 text-base font-semibold text-emerald-900">
                <span aria-hidden className="text-lg">✓</span>
                Record intact. Unaltered since it was recorded.
              </p>
              <p className="mt-1 text-sm text-emerald-800">
                All {result.count} {result.count === 1 ? "entry" : "entries"} are
                cryptographically linked and each one&apos;s contents match its hash.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-red-300 bg-red-50 px-5 py-4">
              <p className="flex items-center gap-2 text-base font-semibold text-red-900">
                <span aria-hidden className="text-lg">✗</span>
                Record altered. This manifest does not check out.
              </p>
              <p className="mt-1 text-sm text-red-800">
                The chain breaks at entry {result.brokenAt + 1} of {result.count}
                {result.reason ? `: ${result.reason}.` : "."} An entry was changed,
                removed, or added after the record was made.
              </p>
            </div>
          )}

          {/* Disclosed methodology */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-5 py-3">
              <p className="text-sm font-semibold text-slate-900">
                {manifest.report?.matter ?? "Disclosure record"}
              </p>
              {manifest.report?.generatedAt && (
                <p className="text-xs text-slate-500">
                  Recorded {new Date(manifest.report.generatedAt).toLocaleString()}
                </p>
              )}
            </div>
            <ol className="divide-y divide-slate-100">
              {manifest.events.map((e, i) => {
                const broken = !result.ok && i === result.brokenAt;
                return (
                  <li key={e.id ?? i} className={`px-5 py-3 ${broken ? "bg-red-50/60" : ""}`}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <p className="text-sm font-medium text-slate-800">
                        <span className="text-slate-400">{i + 1}.</span>{" "}
                        {String(e.sectionKey).replace(/_/g, " ")}
                        {broken && (
                          <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-[0.7rem] font-semibold text-red-800">
                            altered
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500">
                        {modelDisplay(e.model, e.modelVersion)}
                        {e.createdAt ? ` · ${new Date(e.createdAt).toLocaleString()}` : ""}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Evidence units provided: {Array.isArray(e.inputIds) ? e.inputIds.length : 0}
                      {Array.isArray(e.inputIds) && e.inputIds.length > 0
                        ? ` (${e.inputIds.join(", ")})`
                        : ""}
                    </p>
                    <details className="mt-1.5">
                      <summary className="cursor-pointer text-xs font-medium text-blue-800">
                        View the prompt and output recorded for this section
                      </summary>
                      <div className="mt-2 space-y-2 rounded-lg bg-slate-50 p-3">
                        <div>
                          <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-400">
                            Prompt
                          </p>
                          <p className="mt-0.5 whitespace-pre-wrap break-words font-mono text-xs text-slate-700">
                            {String(e.prompt ?? "")}
                          </p>
                        </div>
                        <div>
                          <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-400">
                            Output
                          </p>
                          <p className="mt-0.5 whitespace-pre-wrap break-words font-mono text-xs text-slate-700">
                            {String(e.output ?? "")}
                          </p>
                        </div>
                      </div>
                    </details>
                  </li>
                );
              })}
            </ol>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            This check is tamper-evident: a pass proves the records shown are
            internally consistent and unaltered since they were hashed. It does not,
            by itself, prove that no one with write access ever rewrote the entire
            record from its first entry. The manifest contains the full prompts and
            outputs. It is the methodology disclosure itself, not a summary of it.
          </p>
        </div>
      )}
    </div>
  );
}
