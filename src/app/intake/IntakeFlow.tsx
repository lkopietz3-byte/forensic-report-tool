"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { classifySentence, splitSentences } from "@/lib/domain/grounding";
import { modelDisplay } from "@/lib/domain/modelDisplay";
import { readDocumentFile } from "./readDocumentFile";

export interface DraftableSection {
  key: string;
  title: string;
}

// A confirmed evidence unit carries a stable client-assigned id (E1, E2, …) that
// becomes the closed-world citation key. Content/location are the expert's — the
// tool only segments and re-emits them; it never originates either.
interface Unit {
  id: string;
  content: string;
  location: string;
}

type ExtractMode = "live" | "heuristic";
type DraftMode = "live" | "structured";

interface DisclosureRecord {
  statement: string;
  models: string[];
  integrity: { verified: boolean; note: string };
  entry: {
    model: string;
    modelVersion: string;
    timestamp: string;
    evidenceSources: { id: string; location: string }[];
  } | null;
}

interface DraftResult {
  sectionTitle: string;
  draftText: string;
  mode: DraftMode;
  model: string;
  modelVersion: string;
  fedEvidenceIds: string[];
  citedEvidenceIds: string[];
  ungroundedFlags: string[];
  isClean: boolean;
  disclosure: DisclosureRecord;
}

const MAX_INPUT_CHARS = 50_000;

// Citation marker → the evidence number the expert sees. Mirrors the workspace
// renderer so the tint the expert reads here is the same contract that gates export.
const CITATION_RE = /\[\[E:\s*([a-zA-Z0-9_-]+)\s*\]\]/g;

function renderSentence(
  sentence: string,
  numberById: Map<string, number>,
): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const m of sentence.matchAll(CITATION_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) nodes.push(sentence.slice(last, idx));
    const n = numberById.get(m[1]) ?? 0;
    nodes.push(
      <span
        key={`c${key++}`}
        className="mx-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded bg-blue-100 px-1 align-super text-[10px] font-semibold text-blue-700"
      >
        {n || "?"}
      </span>,
    );
    last = idx + m[0].length;
  }
  if (last < sentence.length) nodes.push(sentence.slice(last));
  return nodes;
}

function StepDot({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <span
      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
        active
          ? "bg-blue-900 text-white"
          : done
            ? "bg-emerald-500 text-white"
            : "bg-slate-200 text-slate-600"
      }`}
    >
      {done ? "✓" : n}
    </span>
  );
}

export function IntakeFlow({ sections }: { sections: DraftableSection[] }) {
  const sourceId = useId();
  const documentId = useId();
  const textId = useId();
  const boundaryId = useId();
  const [step, setStep] = useState(1);

  // Step 1 — paste or upload
  const [text, setText] = useState("");
  const [sourceLabel, setSourceLabel] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileNote, setFileNote] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseStatus, setParseStatus] = useState<string | null>(null);
  const [dataBoundaryAcknowledged, setDataBoundaryAcknowledged] = useState(false);

  // Step 2 — confirm
  const [units, setUnits] = useState<Unit[]>([]);
  const [extractMode, setExtractMode] = useState<ExtractMode | null>(null);
  const [manual, setManual] = useState(false);
  const [sectionKey, setSectionKey] = useState(sections[0]?.key ?? "");

  // Step 3 — draft
  const [draft, setDraft] = useState<DraftResult | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | null | undefined) {
    if (!file) return;
    setError(null);
    setParsing(true);
    setParseStatus(null);
    try {
      const { text: fileText, truncated, suggestedLabel, ocr } = await readDocumentFile(file, {
        onProgress: (m) => setParseStatus(m),
      });
      setText(fileText);
      setFileName(file.name);
      // Only auto-fill the locator basis if the expert hasn't set one.
      if (!sourceLabel.trim() && suggestedLabel) setSourceLabel(suggestedLabel);
      const truncNote = truncated
        ? `Loaded the first ${MAX_INPUT_CHARS.toLocaleString()} characters. Trim or paste a shorter excerpt if you need the rest.`
        : null;
      // OCR is imperfect: tell the expert to check it against the original.
      const ocrNote = ocr
        ? "Read by OCR. Check the text against the original before segmenting."
        : null;
      setFileNote([ocrNote, truncNote].filter(Boolean).join(" ") || null);
    } catch (e) {
      setFileName(null);
      setFileNote(null);
      setError(e instanceof Error ? e.message : "Could not read that file.");
    } finally {
      setParsing(false);
      setParseStatus(null);
    }
  }

  // A slow or hung model call must not strand the UI forever — bound each intake
  // request with an abort timeout so it surfaces a clear "timed out" message.
  // Kept under the serverless cap (vercel.json maxDuration 60s) so the client
  // aborts with its own copy before the platform 504s the function.
  async function postJson(url: string, body: unknown): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 55_000);
    try {
      return await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  }

  async function runExtract() {
    if (!dataBoundaryAcknowledged) {
      setError("Confirm the early-access data boundary before sending text for structuring.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await postJson("/api/intake/extract", { text, sourceLabel: sourceLabel.trim() });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error ?? "Extraction failed.");
      }
      const data: { units: { content: string; location: string }[]; mode: ExtractMode } =
        await res.json();
      if (data.units.length === 0) {
        throw new Error("No evidence items found. Try a longer or clearer document.");
      }
      setUnits(
        data.units.map((u, i) => ({ id: `E${i + 1}`, content: u.content, location: u.location })),
      );
      setExtractMode(data.mode);
      setManual(false);
      setStep(2);
    } catch (e) {
      setError(
        e instanceof Error && e.name === "AbortError"
          ? "The request timed out. Please try again."
          : e instanceof Error
            ? e.message
            : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  // No document yet: skip extraction and let the expert type their own evidence
  // directly. This is the purest form of the invariant — the expert originates
  // every unit; the tool only structures what they enter.
  function startManual() {
    if (!dataBoundaryAcknowledged) {
      setError("Confirm the early-access data boundary before continuing.");
      return;
    }
    setError(null);
    setManual(true);
    setExtractMode(null);
    setUnits([{ id: "E1", content: "", location: sourceLabel.trim() }]);
    setStep(2);
  }

  function updateUnit(id: string, patch: Partial<Omit<Unit, "id">>) {
    setUnits((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  }

  function deleteUnit(id: string) {
    setUnits((prev) => prev.filter((u) => u.id !== id));
  }

  function addUnit() {
    setUnits((prev) => {
      // Stable, never-reused id: one past the current max ordinal.
      const maxN = prev.reduce((m, u) => {
        const n = Number(u.id.replace(/^E/, ""));
        return Number.isFinite(n) && n > m ? n : m;
      }, 0);
      return [...prev, { id: `E${maxN + 1}`, content: "", location: sourceLabel.trim() || "Document" }];
    });
  }

  async function runDraft() {
    if (!dataBoundaryAcknowledged) {
      setError("Confirm the early-access data boundary before sending text for structuring.");
      return;
    }
    const clean = units
      .map((u) => ({ id: u.id, content: u.content.trim(), location: u.location.trim() }))
      .filter((u) => u.content && u.location);
    if (clean.length === 0) {
      setError("Confirm at least one evidence item with content and a source locator.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await postJson("/api/draft/section", { sectionKey, units: clean });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error ?? "Structuring failed.");
      }
      setDraft(await res.json());
      setStep(3);
    } catch (e) {
      setError(
        e instanceof Error && e.name === "AbortError"
          ? "The request timed out. Please try again."
          : e instanceof Error
            ? e.message
            : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  function restart() {
    setStep(1);
    setUnits([]);
    setExtractMode(null);
    setManual(false);
    setDraft(null);
    setError(null);
    setFileName(null);
    setFileNote(null);
  }

  const numberById = useMemo(
    () => new Map(units.map((u, i) => [u.id, i + 1])),
    [units],
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-slate-50/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-900 text-sm font-bold text-white">
              D
            </span>
            <span className="text-sm font-semibold tracking-tight text-slate-900">
              Disclosed.
            </span>
          </Link>
          <Link
            href="/sample"
            className="text-sm font-medium text-slate-600 no-underline transition hover:text-slate-900"
          >
            See a finished sample →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8 sm:py-10">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            Try the evidence-to-section workflow
          </h1>
          <p className="mt-3 text-pretty text-slate-600">
            Paste fictional or de-identified material. The tool segments it into
            citable evidence items you confirm, then structures one section cited
            entirely to what you supplied.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Your original file is read locally. Confirmed text is sent to the
            server for structuring and, when AI assistance is enabled, to
            Anthropic under its standard API retention. Nothing is saved to an
            account unless you choose Save in the workspace. Do not use a real
            matter or protected case file during early access.
          </p>
        </div>

        {/* Stepper */}
        <div className="reveal mx-auto mt-8 flex max-w-md items-center justify-between">
          {[1, 2, 3].map((n, i) => (
            <div key={n} className="flex flex-1 items-center last:flex-none">
              <div className="flex items-center gap-2">
                <StepDot n={n} active={step === n} done={step > n} />
                <span
                  className={`hidden text-xs font-medium sm:inline ${step >= n ? "text-slate-700" : "text-slate-400"}`}
                >
                  {n === 1 ? "Paste" : n === 2 ? "Confirm evidence" : "Structure section"}
                </span>
              </div>
              {i < 2 && <div className="mx-2 h-px flex-1 bg-slate-200 sm:mx-3" />}
            </div>
          ))}
        </div>
        <p className="mt-2 text-center text-xs font-medium text-slate-500 sm:hidden">
          Step {step} of 3 ·{" "}
          {step === 1 ? "Paste" : step === 2 ? "Confirm evidence" : "Structure section"}
        </p>

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="mx-auto mt-6 max-w-2xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        {/* Step 1 — Paste */}
        {step === 1 && (
          <section className="lift mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <label htmlFor={sourceId} className="block text-sm font-semibold text-slate-800">
              Source label{" "}
              <span className="ml-2 font-normal text-slate-500">
                used as the basis for citation locators
              </span>
            </label>
            <input
              id={sourceId}
              value={sourceLabel}
              onChange={(e) => setSourceLabel(e.target.value)}
              placeholder="e.g. Deposition of J. Alvarez, Mar. 2026"
              maxLength={120}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />

            <p id={documentId} className="mt-5 block text-sm font-semibold text-slate-800">
              Document{" "}
              <span className="ml-2 font-normal text-slate-500">
                deposition excerpt, interview notes, records list, wage summary…
              </span>
            </p>

            {/* Upload — read in the browser; only the extracted text is sent on. */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                void handleFile(e.dataTransfer.files?.[0]);
              }}
              className={`mt-2 rounded-xl border-2 border-dashed px-4 py-5 text-center transition ${
                dragging
                  ? "border-blue-400 bg-blue-50"
                  : "border-slate-300 bg-slate-50/60"
              }`}
            >
              <p className="text-sm text-slate-600">
                Drag a document here, or{" "}
                <label className="cursor-pointer font-semibold text-blue-800 hover:text-blue-950">
                  browse
                  <input
                    type="file"
                    aria-label="Upload a document"
                    accept=".pdf,.docx,.xlsx,.xlsm,.html,.htm,.xhtml,.png,.jpg,.jpeg,.webp,.bmp,.gif,.tif,.tiff,.txt,.text,.md,.markdown,.csv,.tsv,.tab,.log,.json,.xml,.yaml,.yml,.rst,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/html,image/*,text/*"
                    className="sr-only"
                    onChange={(e) => {
                      void handleFile(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </label>
              </p>
              <p className="mt-1 text-xs text-slate-600">
                PDF, Word, Excel, images & scans (OCR), HTML, .txt/.md/.csv, up to 15 MB · read in your browser, the file is never uploaded
              </p>
              {parsing && (
                <p className="mt-2 text-xs font-medium text-blue-800">
                  {parseStatus ?? "Reading the document in your browser…"}
                </p>
              )}
              {!parsing && fileName && (
                <p aria-live="polite" className="mt-2 text-xs font-medium text-emerald-700">
                  Loaded {fileName}. Review the text below before segmenting.
                </p>
              )}
            </div>
            {fileNote && (
              <p className="mt-2 text-xs text-amber-700">{fileNote}</p>
            )}

            <label htmlFor={textId} className="mt-4 block text-xs font-medium uppercase tracking-wide text-slate-600">
              or paste it
            </label>
            <textarea
              id={textId}
              value={text}
              onChange={(e) => {
                setText(e.target.value.slice(0, MAX_INPUT_CHARS));
                // Editing by hand means the text is no longer "as loaded".
                if (fileName) {
                  setFileName(null);
                  setFileNote(null);
                }
              }}
              rows={12}
              placeholder="Paste the document here, or drop a file above. The tool will propose exact source excerpts for you to verify."
              className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white p-4 font-mono text-[13px] leading-relaxed text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            <div className="mt-1 flex items-center justify-between text-xs text-slate-600">
              <span>Treated as untrusted data, never as instructions.</span>
              <span>
                {text.length.toLocaleString()} / {MAX_INPUT_CHARS.toLocaleString()}
              </span>
            </div>

            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950">
              <input
                id={boundaryId}
                type="checkbox"
                checked={dataBoundaryAcknowledged}
                onChange={(e) => setDataBoundaryAcknowledged(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-amber-400"
              />
              <span>
                <label htmlFor={boundaryId}>
                  I am using only fictional or properly de-identified material—not
                  a real matter, protected health information, privileged material,
                  personal identifiers, trade secrets, or material under a
                  protective order. I understand confirmed text is sent to the
                  server.
                </label>{" "}
                <Link href="/privacy" className="font-semibold underline">
                  Data details
                </Link>
                .
              </span>
            </div>

            <button
              onClick={runExtract}
              disabled={loading || !text.trim() || !sourceLabel.trim() || !dataBoundaryAcknowledged}
              className="mt-6 w-full rounded-xl bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Segmenting…" : "Segment into evidence items"}
            </button>

            <p className="mt-3 text-center text-xs text-slate-500">
              No document yet?{" "}
              <button
                type="button"
                onClick={startManual}
                disabled={!dataBoundaryAcknowledged}
                className="font-semibold text-blue-800 underline-offset-2 hover:underline"
              >
                Enter your evidence by hand
              </button>{" "}
              and type each fact and its source yourself.
            </p>
          </section>
        )}

        {/* Step 2 — Confirm */}
        {step === 2 && (
          <section className="mt-8 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div>
                  <h2 className="text-lg font-semibold">
                    {manual ? "Enter your evidence" : "Confirm your evidence"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {manual
                      ? "Type each fact or finding and the source it comes from. You decide what counts as evidence. The tool originates none of it."
                      : "Each unit is a faithful span of your document. Edit, delete, or add your own. You decide what counts as evidence, and the tool originates none of it."}
                  </p>
                </div>
                {manual ? (
                  <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                    Entered by you
                  </span>
                ) : (
                  <ModeBadge
                    live={extractMode === "live"}
                    liveLabel="Segmented with Claude"
                    offLabel="Segmented by fixed rules, not AI"
                  />
                )}
              </div>

              <div className="mt-5 space-y-3">
                {units.map((u) => (
                  <div
                    key={u.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/60 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded bg-blue-100 px-1.5 text-[11px] font-semibold text-blue-700">
                        {numberById.get(u.id)}
                      </span>
                      <button
                        onClick={() => deleteUnit(u.id)}
                        className="text-xs font-medium text-slate-600 transition hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                    <textarea
                      value={u.content}
                      onChange={(e) => updateUnit(u.id, { content: e.target.value })}
                      rows={2}
                      maxLength={2000}
                      placeholder="A single fact, finding, measurement, or statement"
                      className="mt-2 w-full resize-y rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                    <input
                      value={u.location}
                      onChange={(e) => updateUnit(u.id, { location: e.target.value })}
                      maxLength={160}
                      placeholder="Source locator"
                      className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={addUnit}
                className="mt-3 w-full rounded-xl border border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
              >
                + Add an evidence unit
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <label className="block text-sm font-semibold text-slate-800">
                Which section should these support?
              </label>
              <select
                value={sectionKey}
                onChange={(e) => setSectionKey(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                {sections.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.title}
                  </option>
                ))}
              </select>

              <div className="mt-5 flex items-center justify-between gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                >
                  ← Back
                </button>
                <button
                  onClick={runDraft}
                  disabled={loading || units.length === 0}
                  className="flex-1 rounded-xl bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Structuring…" : "Structure this section"}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Step 3 — Draft */}
        {step === 3 && draft && (
          <DraftView draft={draft} numberById={numberById} units={units} onRestart={restart} />
        )}
      </main>
    </div>
  );
}

function ModeBadge({
  live,
  liveLabel,
  offLabel,
}: {
  live: boolean;
  liveLabel: string;
  offLabel: string;
}) {
  return (
    <span
      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
        live
          ? "bg-blue-100 text-blue-800"
          : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
      }`}
    >
      {live ? liveLabel : offLabel}
    </span>
  );
}

function DraftView({
  draft,
  numberById,
  units,
  onRestart,
}: {
  draft: DraftResult;
  numberById: Map<string, number>;
  units: Unit[];
  onRestart: () => void;
}) {
  const sentences = useMemo(() => splitSentences(draft.draftText), [draft.draftText]);
  const fedSet = draft.fedEvidenceIds;
  const locationById = new Map(units.map((u) => [u.id, u.location]));

  return (
    <section className="mt-8 space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div>
            <h2 className="text-lg font-semibold">{draft.sectionTitle}</h2>
            <p className="mt-1 text-sm text-slate-600">
              Every factual sentence ties back to an evidence unit you confirmed. You
              are the author, so review and edit it before anything goes out under your name.
            </p>
          </div>
          <ModeBadge
            live={draft.mode === "live"}
            liveLabel="Structured with Claude (AI)"
            offLabel="Formatted by fixed rules, not AI"
          />
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> cited to your evidence
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> needs your input
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500" /> unsupported, review it
          </span>
        </div>

        <div className="mt-4 space-y-1.5 text-[15px] leading-relaxed text-slate-800">
          {sentences.map((sent, i) => {
            const status = classifySentence(sent, fedSet).status;
            const cls =
              status === "grounded"
                ? "border-l-2 border-emerald-300 bg-emerald-50/40"
                : status === "placeholder"
                  ? "border-l-2 border-amber-300 bg-amber-50/60"
                  : "border-l-2 border-red-300 bg-red-50/50";
            return (
              <p key={i} className={`rounded-r px-2 py-1 ${cls}`}>
                {renderSentence(sent, numberById)}
              </p>
            );
          })}
        </div>

        {draft.isClean ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Every factual sentence carries a source marker you supplied. Confirm
            that each cited source actually supports the sentence before use.
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {draft.ungroundedFlags.length} sentence
            {draft.ungroundedFlags.length === 1 ? "" : "s"} not tied to your evidence.
            Flagged for your review before this section could be finalized.
          </div>
        )}
      </div>

      {/* Citation resolution */}
      <div className="lift rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">Citations resolve to</h3>
        <ul className="mt-3 space-y-1.5">
          {draft.citedEvidenceIds.map((id) => (
            <li key={id} className="flex items-center gap-3 text-sm">
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded bg-blue-100 px-1.5 text-[11px] font-semibold text-blue-700">
                {numberById.get(id) ?? "?"}
              </span>
              <span className="text-slate-600">{locationById.get(id) ?? id}</span>
            </li>
          ))}
          {draft.citedEvidenceIds.length === 0 && (
            <li className="text-sm text-slate-500">No citations in this section yet.</li>
          )}
        </ul>
      </div>

      {/* AI-Disclosure record — the moat, generated from the real audit log */}
      <DisclosureRecordPanel draft={draft} numberById={numberById} />

      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onRestart}
          className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
        >
          Start over
        </button>
        <Link
          href="/#waitlist"
          className="rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-semibold text-white no-underline transition hover:bg-blue-950"
        >
          Get early access →
        </Link>
      </div>
    </section>
  );
}

// The AI-Disclosure record for this one section, built server-side from the
// append-only audit log the draft just wrote. This is the differentiator: a
// finished report composes one of these per section into the full appendix.
function DisclosureRecordPanel({
  draft,
  numberById,
}: {
  draft: DraftResult;
  numberById: Map<string, number>;
}) {
  const { disclosure } = draft;
  const verified = disclosure.integrity.verified;

  return (
    <div className="lift rounded-2xl border border-slate-300 bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            AI-Disclosure record
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Generated from this draft&apos;s audit log, one entry per section.
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
            verified
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
              : "bg-red-50 text-red-700 ring-1 ring-red-200"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${verified ? "bg-emerald-500" : "bg-red-500"}`}
          />
          {verified ? "Tamper-evident chain verified" : "Chain check failed"}
        </span>
      </div>

      <div className="space-y-4 px-6 py-5">
        <p className="text-xs leading-relaxed text-slate-600">
          {disclosure.statement}
        </p>

        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              Section
            </dt>
            <dd className="mt-0.5 text-sm text-slate-800">{draft.sectionTitle}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              Prepared with
            </dt>
            <dd className="mt-0.5 text-sm text-slate-800">
              {disclosure.models.join(", ") || modelDisplay(draft.model, draft.modelVersion)}
            </dd>
          </div>
        </dl>

        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            Evidence provided to it ({draft.disclosure.entry?.evidenceSources.length ?? 0})
          </dt>
          <ul className="mt-2 space-y-1.5">
            {(disclosure.entry?.evidenceSources ?? []).map((s) => (
              <li key={s.id} className="flex items-center gap-3 text-sm">
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded bg-blue-100 px-1.5 text-[11px] font-semibold text-blue-700">
                  {numberById.get(s.id) ?? "?"}
                </span>
                <span className="text-slate-600">{s.location}</span>
              </li>
            ))}
            {(disclosure.entry?.evidenceSources.length ?? 0) === 0 && (
              <li className="text-sm text-slate-500">
                No evidence recorded for this section.
              </li>
            )}
          </ul>
        </div>

        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-500">
          {disclosure.integrity.note} In a finished report, every section&apos;s
          record composes the full AI-Disclosure Appendix you can hand to opposing
          counsel. Nothing here is stored.
        </p>
      </div>
    </div>
  );
}
