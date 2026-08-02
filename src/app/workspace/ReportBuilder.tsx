"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { WORKED_EXAMPLE } from "./workedExample";
import { ChallengeChecklist, type SectionGuide } from "./ChallengeChecklist";
import { SourcesPanel } from "./SourcesPanel";
import { readDocumentFile } from "../intake/readDocumentFile";
import { DeliverableOptions } from "./DeliverableOptions";
import { DEFAULT_STYLE, normalizeStyle, type DeliverableStyle } from "@/lib/export/style";
import { reportFilename } from "@/lib/export/filename";
import { FIELD, BTN_PRIMARY } from "./ui";
import { InfoTip } from "./InfoTip";
import { LiveGrounding } from "./LiveGrounding";
import { buildManifest } from "@/lib/domain/verifyManifest";
import type { AuditEvent } from "@/lib/domain/types";

interface EvidenceSection {
  key: string;
  title: string;
}

interface SavedReport {
  id: string;
  matter: string;
  createdAt: string;
  status: string;
}

interface Unit {
  id: string;
  content: string;
  location: string;
  sectionKey: string;
  // Optional image — when set, this evidence item also renders as a numbered
  // figure after the body. It's cited by id like any evidence (grounding is
  // unchanged); the picture is carried to the exporter only. Session-held: not
  // persisted on save yet, so it's stripped from the saved payload.
  imageData?: string;
}

interface PreviewSection {
  key: string;
  title: string;
  text: string;
  isProfile: boolean;
  grounding: { isClean: boolean; ungrounded: number; placeholders: number; citedEvidenceIds: string[]; ungroundedSentences: string[]; invalidCitationSentences: string[] };
}

interface Preview {
  sections: PreviewSection[];
  disclosure: { statement: string; models: string[]; integrity: { verified: boolean; note: string }; generatedAt?: string; rawEvents?: AuditEvent[] };
  rule26: { ok: boolean; issues: { label: string; reason: string }[] };
  readiness: { ready: boolean; headline: string; blockers: number; warnings: number; findings: { severity: string; message: string }[] };
}

// Build the report's AI-disclosure manifest and download it as JSON. Anyone can
// re-verify it at /verify (or with the published algorithm) without an account —
// the independent, third-party half of the tamper-evidence story.
function downloadDisclosureManifest(matter: string, events: AuditEvent[], generatedAt: string) {
  const manifest = buildManifest({ matter }, events, generatedAt);
  const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${reportFilename(matter)}-disclosure-manifest.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * fetch with a hard timeout so a hung request can never strand the UI on
 * "Building…" forever. Abort surfaces as a friendly, actionable message.
 * Kept UNDER the serverless function cap (vercel.json maxDuration 60s) so the
 * client aborts first with its own copy, instead of the platform 504-ing a
 * still-running request out from under it.
 */
async function apiFetch(input: string, init: RequestInit = {}, timeoutMs = 55_000): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: ctrl.signal });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new Error("The request timed out. Please try again.");
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

const LABEL = "mb-1.5 block text-sm font-medium text-slate-700";
const CITE_RE = /\[\[E:\s*([a-zA-Z0-9_-]+)\s*\]\]/g;

// Tone styling for the always-on grounding pulse (the moat made visible).
const PULSE_TONE: Record<"neutral" | "green" | "amber" | "red", { box: string; dot: string; label: string; body: string }> = {
  neutral: { box: "border-slate-200 bg-white", dot: "bg-blue-500", label: "text-slate-800", body: "text-slate-600" },
  green: { box: "border-emerald-200 bg-emerald-50", dot: "bg-emerald-500", label: "text-emerald-800", body: "text-emerald-700" },
  amber: { box: "border-amber-200 bg-amber-50", dot: "bg-amber-500", label: "text-amber-800", body: "text-amber-700" },
  red: { box: "border-red-200 bg-red-50", dot: "bg-red-500", label: "text-red-800", body: "text-red-700" },
};
// Matches the segmentation API's input cap (and the intake page's counter).
const MAX_PASTE_CHARS = 50_000;

// A small inline spinner for async button states — hidden under reduced motion,
// where the "…"-suffixed label alone signals the pending action.
function Spinner() {
  return (
    <span
      aria-hidden
      className="mr-2 inline-block size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent align-[-2px] opacity-70 motion-reduce:hidden"
    />
  );
}

type PreviewSectionStatus = "input" | "profile" | "review" | "cited";

function previewSectionStatus(section: PreviewSection): PreviewSectionStatus {
  if (
    section.text.includes("[Expert input needed:") ||
    section.grounding.placeholders > 0
  ) {
    return "input";
  }
  if (section.isProfile) return "profile";
  if (section.grounding.ungrounded > 0) return "review";
  return "cited";
}

export function ReportBuilder({
  evidenceSections,
  sectionGuide,
  canSave,
  authConfigured,
  billingConfigured,
  isPro,
  credits,
  canBuyCredits,
  justUpgraded,
  justPurchased,
  autoBuy,
}: {
  evidenceSections: EvidenceSection[];
  sectionGuide: SectionGuide[];
  canSave: boolean;
  authConfigured: boolean;
  billingConfigured: boolean;
  isPro: boolean;
  credits: number | null;
  canBuyCredits: boolean;
  justUpgraded: boolean;
  justPurchased: number;
  autoBuy: "single" | "pack5" | null;
}) {
  const dataBoundaryId = useId();
  const aiAssistanceId = useId();
  const aiAssistanceDescriptionId = useId();

  // Matter + expert
  const [matter, setMatter] = useState("");
  const [retainingCounsel, setRetainingCounsel] = useState("");
  const [expertRole, setExpertRole] = useState("Vocational rehabilitation & earning-capacity expert");
  const [fullName, setFullName] = useState("");
  const [credentials, setCredentials] = useState("");
  const [compensationStatement, setCompensationStatement] = useState("");
  const [priorTestimony, setPriorTestimony] = useState("");

  // Evidence
  const [units, setUnits] = useState<Unit[]>([]);
  const [showEvidenceItems, setShowEvidenceItems] = useState(true);
  const [pasteText, setPasteText] = useState("");
  const [pasteLabel, setPasteLabel] = useState("");
  const [pasteSection, setPasteSection] = useState(evidenceSections[0]?.key ?? "");

  // Client-side file reading (PDF/Word/Excel/HTML/scans-via-OCR). The file's
  // bytes never leave the browser — only the text the expert reviews below is
  // sent for segmentation, and only when they click "Pull items".
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editRef = useRef<HTMLTextAreaElement | null>(null);

  // Insert a citation marker at the caret in the section editor (not always at
  // the end), so the expert can cite the exact sentence they're working on.
  function insertCitation(id: string) {
    const ta = editRef.current;
    const marker = `[[E:${id}]]`;
    if (!ta) {
      setEditDraft((d) => `${d.trimEnd()} ${marker}`);
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = editDraft.slice(0, start);
    const after = editDraft.slice(end);
    // Add a leading space only when the marker doesn't already follow whitespace.
    const lead = before.length === 0 || /\s$/.test(before) ? "" : " ";
    const insert = `${lead}${marker}`;
    setEditDraft(before + insert + after);
    const caret = start + insert.length;
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(caret, caret);
    });
  }
  const [parsing, setParsing] = useState(false);
  const [parseStatus, setParseStatus] = useState<string | null>(null);
  const [fileNote, setFileNote] = useState<string | null>(null);
  const [pasteTruncated, setPasteTruncated] = useState(false);
  // Per-row image error (keyed to the evidence unit it belongs to).
  const [imageErr, setImageErr] = useState<{ id: string; msg: string } | null>(null);

  const [preview, setPreview] = useState<Preview | null>(null);
  const [showAllPreviewSections, setShowAllPreviewSections] = useState(false);
  const [busy, setBusy] = useState<null | "extract" | "build" | "docx" | "pdf" | "save" | "load" | "delete" | "checkout" | "portal">(null);
  const [error, setError] = useState<string | null>(null);

  // Deliverable formatting (look only — never content). Session-scoped.
  const [style, setStyle] = useState<DeliverableStyle>(DEFAULT_STYLE);

  // Mirror the server-provided credit balance so a successful paid export can
  // refresh it in place (the export response returns the new balance in a header).
  const [creditsLeft, setCreditsLeft] = useState<number | null>(credits);
  useEffect(() => setCreditsLeft(credits), [credits]);

  // Early access defaults to the rule-based structurer: it proves the full
  // grounding/disclosure workflow without sending text to a model. The expert
  // can deliberately turn AI assistance on; either mode keeps the same gate.
  const [noAi, setNoAi] = useState(true);
  const [dataBoundaryAcknowledged, setDataBoundaryAcknowledged] = useState(false);

  // Per-section expert edits (sectionKey → adopted text). Sent as finalText so
  // the server grounds the ADOPTED text — an uncited factual addition is
  // flagged on rebuild and blocks export (the invariant, applied to edits too).
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  // Preview staleness guard. Export round-trips the LAST build's live section
  // drafts (payload includeDraft), so if the evidence, edits, profile, or AI mode
  // change after a build, exporting WITHOUT rebuilding would ship the STALE draft —
  // text that no longer matches the current evidence, waved through by a citation
  // that still resolves. Fingerprint the build-relevant inputs; block download
  // until a fresh build's fingerprint matches. Opening a saved report leaves
  // preview null, so the same guard forces a rebuild instead of a silent, divergent
  // server re-draft of every section.
  const builtFingerprintRef = useRef<string | null>(null);
  const computeFingerprint = useCallback(
    (activeEdits: Record<string, string>) =>
      JSON.stringify({
        u: units.map((u) => [u.id, u.content.trim(), u.location.trim(), u.sectionKey, u.imageData ? 1 : 0]),
        e: activeEdits,
        n: noAi,
        p: [fullName, credentials, priorTestimony, compensationStatement, expertRole, matter, retainingCounsel],
      }),
    [units, noAi, fullName, credentials, priorTestimony, compensationStatement, expertRole, matter, retainingCounsel],
  );
  const currentFingerprint = computeFingerprint(edits);
  const previewStale = preview !== null && builtFingerprintRef.current !== currentFingerprint;

  // Affirmative preparation acceptance. Before EACH export the expert must actively
  // affirm they prepared/adopt the report and verified the content. Any change
  // to the report inputs (same signal as previewStale)
  // clears it, so the affirmation always applies to the exact version exported.
  // NOTE: exact wording is a legal-posture decision — see docs/legal-review-checklist.md.
  const [acknowledged, setAcknowledged] = useState(false);
  useEffect(() => {
    setAcknowledged(false);
  }, [currentFingerprint]);

  // Persistence (only when signed in)
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [saveMsg, setSaveMsg] = useState<string | null>(
    justUpgraded
      ? "Your membership is active. Thanks! Word and PDF export are now open to you."
      : justPurchased > 0
        ? `Added ${justPurchased} report credit${justPurchased === 1 ? "" : "s"} to your account.`
        : null,
  );

  const refreshSaved = useCallback(async () => {
    if (!canSave) return;
    try {
      const res = await apiFetch("/api/report/list", {}, 30_000);
      if (!res.ok) return;
      const data: { reports: SavedReport[] } = await res.json();
      setSavedReports(data.reports);
    } catch {
      /* non-fatal */
    }
  }, [canSave]);

  useEffect(() => {
    void refreshSaved();
  }, [refreshSaved]);

  // Arrived from a homepage pricing CTA (/workspace?buy=...): if the visitor is
  // signed in and billing is live, take them straight to that checkout; if not
  // signed in, nudge them to sign in (the buy intent is theirs, not auto-forced).
  const autoBuyFired = useRef(false);
  useEffect(() => {
    if (autoBuyFired.current || !autoBuy) return;
    autoBuyFired.current = true;
    if (canSave && billingConfigured) {
      void startCheckout(autoBuy);
    } else if (authConfigured && !canSave) {
      setSaveMsg("Sign in to complete your purchase.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoBuy]);

  const numberById = useMemo(() => new Map(units.map((u, i) => [u.id, i + 1])), [units]);

  // Which sections the report currently includes — mirrors payload()'s inclusion
  // rules. Drives the private self-check; computed live, never sent anywhere.
  const usedKeys = useMemo(() => {
    const s = new Set<string>();
    for (const u of units) {
      if (u.content.trim() && u.location.trim() && u.sectionKey) s.add(u.sectionKey);
    }
    s.add("qualifications");
    if (priorTestimony.trim()) s.add("prior_testimony");
    if (compensationStatement.trim()) s.add("compensation");
    return [...s];
  }, [units, priorTestimony, compensationStatement]);

  function addUnit(partial?: Partial<Unit>) {
    setShowEvidenceItems(true);
    setUnits((prev) => {
      const max = prev.reduce((m, u) => {
        const n = Number(u.id.replace(/^E/, ""));
        return Number.isFinite(n) && n > m ? n : m;
      }, 0);
      return [
        ...prev,
        {
          id: `E${max + 1}`,
          content: partial?.content ?? "",
          location: partial?.location ?? "",
          sectionKey: partial?.sectionKey ?? evidenceSections[0]?.key ?? "",
        },
      ];
    });
  }

  function updateUnit(id: string, patch: Partial<Unit>) {
    setUnits((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  }
  function removeUnit(id: string) {
    setUnits((prev) => prev.filter((u) => u.id !== id));
  }
  // Reorder evidence: the narrative follows entry order, so let the expert move
  // an item up/down rather than re-entering everything to fix the sequence.
  function moveUnit(id: string, dir: -1 | 1) {
    setUnits((prev) => {
      const i = prev.findIndex((u) => u.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    });
  }

  async function handleFile(file: File | null | undefined) {
    if (!file) return;
    setError(null);
    setFileNote(null);
    setParsing(true);
    setParseStatus(null);
    try {
      const { text, truncated, suggestedLabel, ocr } = await readDocumentFile(file, {
        onProgress: (m) => setParseStatus(m),
      });
      setPasteText(text);
      setPasteTruncated(false);
      if (!pasteLabel.trim()) setPasteLabel((suggestedLabel || file.name).slice(0, 120));
      const notes = [
        ocr ? "Read by OCR. Check the text against the original before pulling items." : null,
        truncated ? "This is a long document, so we loaded the first portion. Trim it or upload a shorter excerpt for the rest." : null,
      ].filter(Boolean);
      setFileNote(notes.join(" ") || `Loaded "${file.name}". Review the text, then pull items.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read that file.");
    } finally {
      setParsing(false);
      setParseStatus(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // Attach an image to an evidence item. Resized client-side to a figure-sized
  // PNG so the payload stays small and a full-resolution original never leaves
  // the browser. PNG-only for now (the exporters decode PNG); a detailed photo
  // is downscaled until it fits the server cap. Pixels only — never content,
  // never a citation; the item is still grounded by its text like any evidence.
  async function handleImage(id: string, file: File | null | undefined) {
    setImageErr(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setImageErr({ id, msg: "Please choose an image file." });
      return;
    }
    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error("load"));
        img.src = url;
      });
      URL.revokeObjectURL(url);
      // Fit a figure box, shrinking until the PNG data URL clears the server cap
      // (matches the schema's 800k char limit, with headroom).
      let box = 1000;
      let dataUrl = "";
      for (let i = 0; i < 5; i++) {
        const scale = Math.min(box / img.width, box / img.height, 1);
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setImageErr({ id, msg: "Couldn't process that image." });
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        dataUrl = canvas.toDataURL("image/png");
        if (dataUrl.length <= 760_000) break;
        box = Math.round(box * 0.8);
      }
      if (dataUrl.length > 760_000) {
        setImageErr({ id, msg: "That image is too detailed to embed. Try a smaller crop or a simpler image." });
        return;
      }
      updateUnit(id, { imageData: dataUrl });
    } catch {
      setImageErr({ id, msg: "Couldn't read that image." });
    }
  }

  async function extract() {
    if (!pasteText.trim()) return;
    setBusy("extract");
    setError(null);
    try {
      const res = await apiFetch("/api/intake/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pasteText, sourceLabel: pasteLabel.trim() || "Document" }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Extraction failed.");
      const data: { units: { content: string; location: string }[] } = await res.json();
      if (!data.units.length) throw new Error("No evidence found in that text.");
      setUnits((prev) => {
        let n = prev.reduce((m, u) => Math.max(m, Number(u.id.replace(/^E/, "")) || 0), 0);
        const added = data.units.map((u) => ({ id: `E${++n}`, content: u.content, location: u.location, sectionKey: pasteSection }));
        return [...prev, ...added];
      });
      setShowEvidenceItems(true);
      setPasteText("");
      setPasteTruncated(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  function payload(editsOverride?: Record<string, string>, includeDraft = false) {
    const activeEdits = editsOverride ?? edits;
    const bySection = new Map<string, string[]>();
    for (const u of units) {
      if (!u.content.trim() || !u.location.trim()) continue;
      const arr = bySection.get(u.sectionKey) ?? [];
      arr.push(u.id);
      bySection.set(u.sectionKey, arr);
    }
    // On EXPORT, round-trip the last build's LIVE section drafts so the server
    // re-records them instead of re-drafting — the deliverable then matches exactly
    // what the expert reviewed on screen, at no extra token cost. Only live model
    // output is carried (the deterministic structurer re-runs identically and free);
    // the export gate still re-grounds the ADOPTED text, so a stale or crafted draft
    // only fails the gate, never bypasses it.
    const draftBySection = new Map<string, { text: string; model: string; modelVersion: string }>();
    if (includeDraft) {
      for (const e of preview?.disclosure.rawEvents ?? []) {
        if (e.model && e.model !== "deterministic-structurer") {
          draftBySection.set(e.sectionKey, { text: e.output, model: e.model, modelVersion: e.modelVersion });
        }
      }
    }
    const withEdit = (key: string, evidenceIds: string[]) => {
      const finalText = activeEdits[key]?.trim();
      const base = finalText ? { key, evidenceIds, finalText } : { key, evidenceIds };
      const d = draftBySection.get(key);
      return d
        ? { ...base, draftText: d.text, draftModel: d.model, draftModelVersion: d.modelVersion }
        : base;
    };
    const sections = [...bySection.entries()].map(([key, evidenceIds]) => withEdit(key, evidenceIds));
    // Profile sections, filled from the expert's own details.
    sections.push(withEdit("qualifications", []));
    if (priorTestimony.trim()) sections.push(withEdit("prior_testimony", []));
    if (compensationStatement.trim()) sections.push(withEdit("compensation", []));
    return {
      meta: { matter: matter.trim(), retainingCounsel: retainingCounsel.trim(), expertRole: expertRole.trim() },
      profile: {
        fullName: fullName.trim(),
        credentials: credentials.trim(),
        publicationsLast10yr: [],
        priorTestimonyLast4yr: priorTestimony.split("\n").map((s) => s.trim()).filter(Boolean),
        compensationStatement: compensationStatement.trim(),
      },
      evidence: units
        .filter((u) => u.content.trim() && u.location.trim())
        // imageData is undefined for text-only items; JSON.stringify drops it,
        // so the wire shape is unchanged unless a figure is attached.
        .map((u) => ({ id: u.id, content: u.content.trim(), location: u.location.trim(), imageData: u.imageData })),
      sections,
      style,
      noAi,
    };
  }

  // Evidence ids cited anywhere in the last preview — feeds the sources panel's
  // cited/uncited badges. Display only; never sent anywhere.
  const citedIds = useMemo(() => {
    if (!preview) return [] as string[];
    return [...new Set(preview.sections.flatMap((s) => s.grounding.citedEvidenceIds))];
  }, [preview]);

  const previewPresentation = useMemo(() => {
    if (!preview) return null;
    const attention = preview.sections.filter((s) => {
      const status = previewSectionStatus(s);
      return status === "input" || status === "review";
    });
    const clean = preview.sections.filter((s) => {
      const status = previewSectionStatus(s);
      return status === "cited" || status === "profile";
    });
    const visibleKeys = new Set(
      (showAllPreviewSections
        ? preview.sections
        : [...attention, ...clean.slice(0, 3)]
      ).map((s) => s.key),
    );
    return {
      cited: preview.sections.filter((s) => previewSectionStatus(s) === "cited").length,
      profile: preview.sections.filter((s) => previewSectionStatus(s) === "profile").length,
      attention: attention.length,
      visible: preview.sections.filter((s) => visibleKeys.has(s.key)),
      hidden: showAllPreviewSections
        ? 0
        : preview.sections.filter((s) => !visibleKeys.has(s.key)).length,
    };
  }, [preview, showAllPreviewSections]);

  // Always-on grounding pulse — the moat made visible. Before a build it states
  // the closed-world promise and what it's armed against; after a build it shows
  // the live verdict (the same condition the export gate enforces). Pure-derived
  // from state already on screen; never sent anywhere.
  const groundingPulse = useMemo((): { tone: "neutral" | "green" | "amber" | "red"; label: string; text: string } => {
    if (preview) {
      // Export-blocking sentences = ungrounded + invalid citations in evidence sections.
      const blocking = preview.sections.reduce(
        (n, s) => n + (s.isProfile ? 0 : s.grounding.ungrounded + s.grounding.invalidCitationSentences.length),
        0,
      );
      const awaiting = preview.sections.filter(
        (s) => s.grounding.placeholders > 0 || s.text.includes("[Expert input needed:"),
      ).length;
      const chainBad = !preview.disclosure.integrity.verified;
      if (blocking > 0) {
        // Grounding is the ONLY condition the server export gate enforces, so
        // only this state may claim export is blocked.
        return {
          tone: "red",
          label: "Not ready",
          text: `${blocking} sentence${blocking === 1 ? "" : "s"} ${blocking === 1 ? "needs" : "need"} a source${chainBad ? ", and the disclosure chain failed to verify" : ""}. Export stays blocked until every factual line cites your evidence.`,
        };
      }
      if (chainBad) {
        // A failed chain is a real concern but is NOT an export blocker server-side
        // — flag it for review without falsely claiming export is blocked.
        return { tone: "red", label: "Check the record", text: "The disclosure chain failed to verify. Review the record before you export." };
      }
      if (awaiting > 0) {
        return { tone: "amber", label: "Almost there", text: `Every factual line is cited. ${awaiting} section${awaiting === 1 ? "" : "s"} still awaiting your input.` };
      }
      return { tone: "green", label: "Grounded", text: "Every sentence cites your evidence and the disclosure chain verified, so you're ready to export. “Cited” means a sentence traces to a source you supplied, not that the source proves it. That reliability judgment (FRE 702) stays yours." };
    }
    const ready = units.filter((u) => u.content.trim() && u.location.trim()).length;
    return {
      tone: "neutral",
      label: "Your evidence only",
      text: ready === 0
        ? "Add your evidence, and every factual sentence gets checked against it. Nothing exports until each one cites a source you gave."
        : `Checked against ${ready} source${ready === 1 ? "" : "s"}. Build and preview to confirm each sentence cites your evidence. Nothing exports until it does.`,
    };
  }, [preview, units]);

  function bulkSection(ids: string[], sectionKey: string) {
    const idSet = new Set(ids);
    setUnits((prev) => prev.map((u) => (idSet.has(u.id) ? { ...u, sectionKey } : u)));
  }

  function bulkRemove(ids: string[]) {
    const idSet = new Set(ids);
    setUnits((prev) => prev.filter((u) => !idSet.has(u.id)));
  }

  function renameSource(ids: string[], newName: string) {
    const idSet = new Set(ids);
    setUnits((prev) =>
      prev.map((u) => {
        if (!idSet.has(u.id)) return u;
        // Replace the leading source-name segment of the locator, keep the rest
        // ("FCE report, p.6" → "<newName>, p.6").
        const cut = u.location.search(/[,¶]/);
        const location = cut === -1 ? newName : newName + u.location.slice(cut);
        return { ...u, location };
      }),
    );
  }

  function jumpToUnit(id: string) {
    // Instant, not smooth: the panel re-renders on interaction, which can cancel
    // an in-flight smooth scroll and leave the user nowhere.
    document.getElementById(`unit-${id}`)?.scrollIntoView({ block: "center" });
  }

  function validate(): string | null {
    if (!matter.trim()) return "Add the matter / case caption.";
    if (!fullName.trim()) return "Add your name (it signs the report).";
    if (!units.some((u) => u.content.trim() && u.location.trim() && u.sectionKey)) {
      return "Add at least one evidence item with content, a source, and a section.";
    }
    return null;
  }

  async function build(editsOverride?: Record<string, string>) {
    if (!dataBoundaryAcknowledged) {
      setError("Confirm the early-access data boundary before sending report text for structuring.");
      return;
    }
    const v = validate();
    if (v) { setError(v); return; }
    setBusy("build");
    setError(null);
    try {
      const res = await apiFetch("/api/report/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload(editsOverride)),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Could not build the report.");
      setPreview(await res.json());
      // Record exactly which inputs produced this preview, so a later export can
      // tell whether it still matches (else download is blocked until a rebuild).
      builtFingerprintRef.current = computeFingerprint(editsOverride ?? edits);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  async function download(format: "docx" | "pdf") {
    // An open, uncommitted section edit isn't in `edits` yet, so exporting now
    // would silently omit it. Make the expert resolve it first.
    if (editingKey !== null) {
      setError("Finish or cancel your open section edit before exporting, or it won't be included.");
      document.getElementById("report-preview")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    // Export re-records the previewed drafts rather than re-drafting, so it must
    // match the current inputs. A missing or stale preview (evidence/edits/profile
    // changed since the build, or a report was just opened) would otherwise ship
    // text that no longer reflects the evidence — force a rebuild first.
    if (!preview || previewStale) {
      setError("Build & preview the report again before exporting, so the file matches your current evidence.");
      document.getElementById("report-preview")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (!acknowledged) {
      setError("Confirm you prepared, adopt, and reviewed the report before exporting.");
      return;
    }
    const v = validate();
    if (v) { setError(v); return; }
    setBusy(format);
    setError(null);
    try {
      const res = await apiFetch(`/api/report/export?format=${format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload(undefined, true)),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.code === "GROUNDING_BLOCKED") {
          // The 422 body already lists the EXACT sentences the server rejected.
          // Map them straight onto the current preview's red per-section flags
          // rather than calling build() again — a second (paid) live model round-
          // trip whose re-draft could surface a slightly different flag set than
          // the one that just blocked the export. Only build() when there's no
          // preview yet, so the flags have somewhere to render.
          const blockedSections: {
            title: string;
            ungrounded?: string[];
            invalidCitations?: string[];
          }[] = Array.isArray(data.sections) ? data.sections : [];
          if (preview) {
            const byTitle = new Map(blockedSections.map((b) => [b.title, b]));
            const totalBlocking = blockedSections.reduce(
              (n, b) => n + (b.ungrounded?.length ?? 0) + (b.invalidCitations?.length ?? 0),
              0,
            );
            setPreview((prev) =>
              prev
                ? {
                    ...prev,
                    // Overwrite every evidence section's grounding flags with the
                    // server's verdict: blocked sections get their exact rejected
                    // sentences, the rest are cleared. Keeps the red per-section UI
                    // and the live grounding pulse identical to what the gate saw.
                    sections: prev.sections.map((s) => {
                      if (s.isProfile) return s;
                      const b = byTitle.get(s.title);
                      const ungroundedSentences = b?.ungrounded ?? [];
                      const invalidCitationSentences = b?.invalidCitations ?? [];
                      return {
                        ...s,
                        grounding: {
                          ...s.grounding,
                          ungroundedSentences,
                          invalidCitationSentences,
                          ungrounded: ungroundedSentences.length,
                          isClean:
                            ungroundedSentences.length === 0 &&
                            invalidCitationSentences.length === 0,
                        },
                      };
                    }),
                    // Keep the readiness banner coherent with those flags (it's a
                    // build-time snapshot that would otherwise stay green above the
                    // red sentences in the live-drafting case).
                    readiness: {
                      ...prev.readiness,
                      ready: false,
                      blockers: totalBlocking,
                      headline: `${totalBlocking} sentence${totalBlocking === 1 ? "" : "s"} ${totalBlocking === 1 ? "needs" : "need"} a citation to your evidence before you can export.`,
                    },
                  }
                : prev,
            );
          } else {
            await build();
          }
          setTimeout(() => document.getElementById("report-preview")?.scrollIntoView({ behavior: "smooth" }), 150);
        }
        throw new Error(data.error ?? "Export failed.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportFilename(matter)}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      // Confirm the export and refresh the credit balance in place (only present
      // when this was a credit-metered export — Pro/preview downloads send no header).
      const remaining = res.headers.get("X-Report-Credits-Remaining");
      if (remaining !== null) {
        const n = Number(remaining);
        setCreditsLeft(Number.isFinite(n) ? n : null);
        setSaveMsg(`Exported. ${n} report credit${n === 1 ? "" : "s"} remaining.`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  async function save() {
    if (editingKey !== null) {
      setError("Finish or cancel your open section edit before saving, or it won't be included.");
      return;
    }
    if (!dataBoundaryAcknowledged) {
      setError("Confirm the early-access data boundary before saving report text.");
      return;
    }
    const v = validate();
    if (v) { setError(v); return; }
    setBusy("save");
    setError(null);
    setSaveMsg(null);
    try {
      // Attached figures are session-held, not persisted yet — strip the pixels
      // from the saved payload (the evidence text, cites, and audit chain still
      // round-trip intact). Honest caveat surfaced below when this drops one.
      const p = payload();
      const hadImages = p.evidence.some((e) => e.imageData);
      const body = { ...p, evidence: p.evidence.map(({ imageData, ...rest }) => rest) };
      const res = await apiFetch("/api/report/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Could not save.");
      setSaveMsg(
        hadImages
          ? "Saved to your account. Attached figures stay in this session and embed when you export. They aren't stored yet, so re-attach them next time you open this report."
          : "Saved to your account.",
      );
      await refreshSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  async function loadReport(id: string) {
    setBusy("load");
    setError(null);
    setSaveMsg(null);
    try {
      const res = await apiFetch(`/api/report/${id}`, {}, 30_000);
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Could not open that report.");
      const data: {
        input: {
          meta: { matter: string; retainingCounsel: string; expertRole: string };
          profile: {
            fullName: string; credentials: string; compensationStatement: string;
            priorTestimonyLast4yr: string[];
          };
          evidence: { id: string; content: string; location: string }[];
          sections: { key: string; evidenceIds: string[]; finalText?: string }[];
          style?: Partial<DeliverableStyle> | null;
        };
        integrity: { verified: boolean };
      } = await res.json();

      const { input } = data;
      setMatter(input.meta.matter);
      setRetainingCounsel(input.meta.retainingCounsel);
      setExpertRole(input.meta.expertRole);
      setFullName(input.profile.fullName);
      setCredentials(input.profile.credentials);
      setCompensationStatement(input.profile.compensationStatement);
      setPriorTestimony((input.profile.priorTestimonyLast4yr ?? []).join("\n"));

      const sectionByEvidence = new Map<string, string>();
      for (const s of input.sections) for (const eid of s.evidenceIds) sectionByEvidence.set(eid, s.key);
      const restoredEdits: Record<string, string> = {};
      for (const s of input.sections) if (s.finalText?.trim()) restoredEdits[s.key] = s.finalText;
      setEdits(restoredEdits);
      setEditingKey(null);
      // Restore the saved formatting choices (font, spacing, appendix toggles)
      // rather than silently resetting them to defaults on reopen.
      setStyle(normalizeStyle(input.style));
      setUnits(
        input.evidence.map((u) => ({
          id: u.id,
          content: u.content,
          location: u.location,
          sectionKey: sectionByEvidence.get(u.id) ?? evidenceSections[0]?.key ?? "",
        })),
      );
      setShowEvidenceItems(true);
      setPreview(null);
      setSaveMsg(
        data.integrity.verified
          ? "Opened. Disclosure chain verified."
          : "Opened. Note: the saved disclosure chain failed verification.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  async function deleteReport(report: SavedReport) {
    if (
      !window.confirm(
        `Permanently delete "${report.matter}" and its saved evidence, sections, and disclosure record? This cannot be undone.`,
      )
    ) {
      return;
    }
    setBusy("delete");
    setError(null);
    setSaveMsg(null);
    try {
      const res = await apiFetch(`/api/report/${report.id}`, { method: "DELETE" }, 30_000);
      if (!res.ok) {
        throw new Error(
          (await res.json().catch(() => ({}))).error ?? "Could not delete that report.",
        );
      }
      setSavedReports((current) => current.filter((item) => item.id !== report.id));
      setSaveMsg("Saved report deleted.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  async function startCheckout(plan: "single" | "pack5") {
    setBusy("checkout");
    setError(null);
    try {
      const res = await apiFetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error ?? "Could not start checkout.");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(null);
    }
  }

  async function openPortal() {
    setBusy("portal");
    setError(null);
    try {
      const res = await apiFetch("/api/billing/portal", { method: "POST" }, 30_000);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error ?? "Could not open billing portal.");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(null);
    }
  }

  function loadExample() {
    setEdits({});
    setEditingKey(null);
    setMatter(WORKED_EXAMPLE.matter);
    setRetainingCounsel(WORKED_EXAMPLE.retainingCounsel);
    setExpertRole(WORKED_EXAMPLE.expertRole);
    setFullName(WORKED_EXAMPLE.fullName);
    setCredentials(WORKED_EXAMPLE.credentials);
    setCompensationStatement(WORKED_EXAMPLE.compensationStatement);
    setPriorTestimony(WORKED_EXAMPLE.priorTestimony);
    setUnits(WORKED_EXAMPLE.units.map((u) => ({ ...u })));
    setShowEvidenceItems(false);
    setPreview(null);
    setError(null);
    setSaveMsg("Loaded a worked example. Hit Build & preview, then download, or edit any field to make it yours.");
  }

  function clearAll() {
    setEdits({});
    setEditingKey(null);
    setMatter("");
    setRetainingCounsel("");
    setExpertRole("Vocational rehabilitation & earning-capacity expert");
    setFullName("");
    setCredentials("");
    setCompensationStatement("");
    setPriorTestimony("");
    setUnits([]);
    setShowEvidenceItems(true);
    setPreview(null);
    setError(null);
    setSaveMsg(null);
  }

  function renderText(text: string) {
    const nodes: React.ReactNode[] = [];
    let last = 0;
    let k = 0;
    for (const m of text.matchAll(CITE_RE)) {
      const idx = m.index ?? 0;
      if (idx > last) nodes.push(text.slice(last, idx));
      nodes.push(
        <span key={`c${k++}`} className="mx-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded bg-blue-100 px-1 align-super text-[10px] font-semibold text-blue-700">
          {numberById.get(m[1]) ?? "?"}
        </span>,
      );
      last = idx + m[0].length;
    }
    if (last < text.length) nodes.push(text.slice(last));
    return nodes;
  }

  const pulse = PULSE_TONE[groundingPulse.tone];

  return (
    <div className="mt-8 space-y-6">
      {/* Always-on grounding pulse: the closed-world promise before a build, the
          live verdict after one. The product's whole value, kept on screen. */}
      <div
        className={`fade-in z-10 flex items-start gap-3 rounded-xl border px-4 py-2.5 shadow-sm transition-colors sm:sticky sm:top-16 ${pulse.box}`}
        aria-live="polite"
      >
        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${pulse.dot}`} aria-hidden />
        <p className="text-sm leading-snug">
          <span className={`font-semibold ${pulse.label}`}>{groundingPulse.label}:</span>{" "}
          <span className={pulse.body}>{groundingPulse.text}</span>
        </p>
      </div>

      {error && (
        <div className="rise-in rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}
      {saveMsg && !error && (
        <div className="rise-in rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{saveMsg}</div>
      )}

      <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950">
        <input
          id={dataBoundaryId}
          type="checkbox"
          checked={dataBoundaryAcknowledged}
          onChange={(e) => setDataBoundaryAcknowledged(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-amber-400"
        />
        <span>
          <label htmlFor={dataBoundaryId}>
            <strong className="font-semibold">Early-access data boundary:</strong>{" "}
            I am using only the fictional example or properly de-identified
            material—not a real matter, protected health information, privileged
            material, personal identifiers, trade secrets, or material under a
            protective order. I understand report text is sent to the server and,
            if I turn on AI assistance, to Anthropic under its standard API
            retention.
          </label>{" "}
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold underline">
            Data details
          </a>
          .
        </span>
      </div>

      {/* Empty-state: one-click worked example */}
      {units.length === 0 && !matter.trim() && (
        <section className="lift rounded-2xl border border-dashed border-blue-300 bg-blue-50/60 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-xl">
              <p className="text-sm font-semibold text-slate-900">First time here?</p>
              <p className="mt-1 text-sm text-slate-600">
                Load a worked vocational-rehabilitation matter to see the whole
                thing in one click: a full Rule 26(a)(2)(B) report, every
                sentence cited to its evidence, with the AI-disclosure record.
                Then download it, or edit any field to make it your own.
              </p>
            </div>
            <button
              onClick={loadExample}
              className="shrink-0 rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-950"
            >
              Load a worked example
            </button>
          </div>
        </section>
      )}

      {/* Saved reports (signed-in only) */}
      {canSave && savedReports.length > 0 && (
        <section className="lift rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800">Your saved reports</h2>
          <ul className="mt-3 divide-y divide-slate-100">
            {savedReports.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{r.matter}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(r.createdAt).toLocaleString()} · {r.status}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => loadReport(r.id)}
                    disabled={busy !== null}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    {busy === "load" ? "Opening…" : "Open"}
                  </button>
                  <button
                    onClick={() => deleteReport(r)}
                    disabled={busy !== null}
                    className="rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                    aria-label={`Delete saved report ${r.matter}`}
                  >
                    {busy === "delete" ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 1. Matter + expert */}
      <section className="lift rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">1 · The matter and you</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="f-matter" className={LABEL}>Matter / caption <span className="text-red-500">*</span></label>
            <input id="f-matter" className={FIELD} value={matter} onChange={(e) => setMatter(e.target.value)} placeholder="e.g. Alvarez v. Brightline Mechanical Servs., No. 2025-CV-04417" maxLength={200} />
          </div>
          <div>
            <label htmlFor="f-counsel" className={LABEL}>Retaining counsel</label>
            <input id="f-counsel" className={FIELD} value={retainingCounsel} onChange={(e) => setRetainingCounsel(e.target.value)} placeholder="e.g. Hahn & Castro LLP (Plaintiff)" maxLength={200} />
          </div>
          <div>
            <label htmlFor="f-role" className={LABEL}>Your role</label>
            <input id="f-role" className={FIELD} value={expertRole} onChange={(e) => setExpertRole(e.target.value)} maxLength={200} />
          </div>
          <div>
            <label htmlFor="f-name" className={LABEL}>Your name <span className="text-red-500">*</span></label>
            <input id="f-name" className={FIELD} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Dana M. Whitfield, M.S., CRC" maxLength={160} />
          </div>
          <div>
            <label htmlFor="f-credentials" className={LABEL}>Credentials</label>
            <input id="f-credentials" className={FIELD} value={credentials} onChange={(e) => setCredentials(e.target.value)} placeholder="e.g. CRC; ABVE/D; M.S. Rehabilitation Counseling" maxLength={400} />
          </div>
          <div className="sm:col-span-2">
            <div className="mb-1.5 flex items-center gap-1.5">
              <label htmlFor="f-comp" className="text-sm font-medium text-slate-700">Statement of compensation</label>
              <InfoTip text="Rule 26(a)(2)(B) requires disclosing the compensation you're paid for the study and testimony. Enter your own arrangement. The tool only formats what you type." />
            </div>
            <input id="f-comp" className={FIELD} value={compensationStatement} onChange={(e) => setCompensationStatement(e.target.value)} placeholder="e.g. $295/hr review; $450/hr testimony; not contingent on the outcome." maxLength={1000} />
          </div>
          <div className="sm:col-span-2">
            <div className="mb-1.5 flex items-center gap-1.5">
              <label htmlFor="f-prior" className="text-sm font-medium text-slate-700">Prior testimony (last 4 years), one per line</label>
              <InfoTip text="Rule 26(a)(2)(B) requires listing the cases where you testified as an expert at trial or by deposition in the previous 4 years. One per line." />
            </div>
            <textarea className={`${FIELD} resize-y`} id="f-prior" rows={2} value={priorTestimony} onChange={(e) => setPriorTestimony(e.target.value)} placeholder={"Reyes v. Coastal Freight (2024) — deposition & trial\nIn re Okafor (2023) — deposition"} />
          </div>
        </div>
      </section>

      {/* 2. Evidence */}
      <section className="lift rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">
          2 · Your evidence{" "}
          <InfoTip text="Every item you add gets a number. In the report, each factual sentence carries that number as a citation, so anyone can trace it back to the source you provided. Items can't be cited anywhere you didn't put them." />
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Add each finding and tag it to the section it supports. Paste a document to pull
          out candidate items, or add them by hand. You confirm everything. The tool
          originates none of it.
        </p>

        {/* Paste & extract */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <input aria-label="Source label" className={FIELD} value={pasteLabel} onChange={(e) => setPasteLabel(e.target.value)} placeholder="Source label (e.g. Depo of J. Alvarez)" maxLength={120} />
            <select aria-label="Section to assign extracted items" className={FIELD} value={pasteSection} onChange={(e) => setPasteSection(e.target.value)}>
              {evidenceSections.map((s) => (<option key={s.key} value={s.key}>{s.title}</option>))}
            </select>
          </div>
          <textarea aria-label="Paste document text to segment" className={`${FIELD} mt-3 resize-y font-mono text-[13px]`} rows={3} value={pasteText} onChange={(e) => { const raw = e.target.value; setPasteTruncated(raw.length > MAX_PASTE_CHARS); setPasteText(raw.slice(0, MAX_PASTE_CHARS)); }} placeholder="Paste a deposition excerpt, notes, records list… it will be segmented into citable items you can edit." />
          <div className="mt-1 flex items-center justify-end text-xs text-slate-600">
            <span>
              {pasteText.length.toLocaleString()} / {MAX_PASTE_CHARS.toLocaleString()}
            </span>
          </div>
          {pasteTruncated && (
            <p className="mt-1 text-xs text-amber-800" aria-live="polite">
              Only the first {MAX_PASTE_CHARS.toLocaleString()} characters were kept. Pull items from this part, then paste the rest separately.
            </p>
          )}
          {(parseStatus || fileNote) && (
            <p className={`mt-2 text-xs ${parseStatus ? "text-slate-500" : "text-amber-800"}`} aria-live="polite">
              {parseStatus ?? fileNote}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button onClick={extract} disabled={busy !== null || parsing || !pasteText.trim()} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-50">
              {busy === "extract" ? "Segmenting…" : "Pull items from this text"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              aria-label="Upload a document to read in your browser"
              accept=".pdf,.docx,.xlsx,.xlsm,.html,.htm,.xhtml,.png,.jpg,.jpeg,.webp,.bmp,.gif,.tif,.tiff,.txt,.text,.md,.markdown,.csv,.tsv,.tab,.log,.json,.xml,.yaml,.yml,.rst,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/html,image/*,text/*"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={parsing || busy !== null}
              className="rounded-xl border border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50"
            >
              {parsing ? "Reading…" : "Upload a document"}
            </button>
            <span className="text-xs text-slate-600">
              PDF, Word, Excel, and scans (OCR), all read in your browser. The file never leaves your computer.
            </span>
          </div>
        </div>

        {units.length >= 4 && (
          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {units.length} evidence items ready
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                They are summarized in Your sources below. Expand only when you
                want to inspect or edit an individual item.
              </p>
            </div>
            <button
              type="button"
              aria-expanded={showEvidenceItems}
              onClick={() => setShowEvidenceItems((shown) => !shown)}
              className="shrink-0 self-start rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-800 transition hover:bg-blue-100"
            >
              {showEvidenceItems ? "Collapse evidence items" : `Review all ${units.length} items`}
            </button>
          </div>
        )}

        {/* Units */}
        {(showEvidenceItems || units.length < 4) && (
        <div className="mt-4 space-y-3">
          {units.map((u, idx) => (
            <div key={u.id} id={`unit-${u.id}`} className="rounded-xl border border-slate-200 bg-white p-3 scroll-mt-24">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded bg-blue-100 px-1.5 text-[11px] font-semibold text-blue-700">{numberById.get(u.id)}</span>
                  <button onClick={() => moveUnit(u.id, -1)} disabled={idx === 0} aria-label="Move this evidence item up" className="inline-flex h-7 w-7 items-center justify-center rounded text-slate-600 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30" title="Move up">↑</button>
                  <button onClick={() => moveUnit(u.id, 1)} disabled={idx === units.length - 1} aria-label="Move this evidence item down" className="inline-flex h-7 w-7 items-center justify-center rounded text-slate-600 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30" title="Move down">↓</button>
                </div>
                <button onClick={() => removeUnit(u.id)} className="rounded px-2 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600">Remove</button>
              </div>
              <textarea aria-label="Evidence content" className={`${FIELD} mt-2 resize-y`} rows={2} maxLength={2000} value={u.content} onChange={(e) => updateUnit(u.id, { content: e.target.value })} placeholder="A single fact, finding, measurement, or statement" />
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <input aria-label="Page or line cite for this source" className={`${FIELD} text-sm`} maxLength={160} value={u.location} onChange={(e) => updateUnit(u.id, { location: e.target.value })} placeholder={u.imageData ? "Figure caption / source (e.g. Site photo, north stairway)" : "Page/line cite (e.g. Depo p.18 ln.4)"} />
                <select aria-label="Section for this evidence" className={`${FIELD} text-sm`} value={u.sectionKey} onChange={(e) => updateUnit(u.id, { sectionKey: e.target.value })}>
                  {evidenceSections.map((s) => (<option key={s.key} value={s.key}>{s.title}</option>))}
                </select>
              </div>
              {/* Optional figure: a photo/diagram for this item. It renders as a
                  numbered figure after the body and is cited by its number like
                  any evidence — the picture never originates a fact. */}
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {u.imageData ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u.imageData} alt="" className="h-14 w-14 shrink-0 rounded border border-slate-200 object-cover" />
                    <span className="text-xs text-slate-500">
                      <span className="font-medium text-slate-700">Renders as a numbered figure.</span>{" "}
                      The source field above becomes its caption.
                    </span>
                    <button
                      onClick={() => updateUnit(u.id, { imageData: undefined })}
                      className="ml-auto rounded px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                    >
                      Remove image
                    </button>
                  </>
                ) : (
                  <>
                    <input
                      id={`img-${u.id}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => { handleImage(u.id, e.target.files?.[0]); e.target.value = ""; }}
                    />
                    <label
                      htmlFor={`img-${u.id}`}
                      className="cursor-pointer rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
                    >
                      + Attach image (renders as a numbered figure)
                    </label>
                  </>
                )}
              </div>
              {imageErr?.id === u.id && <p className="mt-1 text-xs text-red-600">{imageErr.msg}</p>}
            </div>
          ))}
        </div>
        )}
        <button onClick={() => addUnit()} className="mt-3 w-full rounded-xl border border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:bg-slate-50">+ Add an evidence item by hand</button>
      </section>

      {/* Sources at a glance: grouped view + bulk actions (display only) */}
      <SourcesPanel
        units={units}
        sections={evidenceSections}
        citedIds={citedIds}
        onBulkSection={bulkSection}
        onBulkRemove={bulkRemove}
        onRenameSource={renameSource}
        onJump={jumpToUnit}
      />

      {/* Deliverable formatting (look only — never content) */}
      <DeliverableOptions value={style} onChange={setStyle} />

      {/* AI assistance toggle — the whole report can be assembled with no model */}
      <div className="lift flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <input
          id={aiAssistanceId}
          type="checkbox"
          checked={!noAi}
          onChange={(e) => setNoAi(!e.target.checked)}
          aria-describedby={aiAssistanceDescriptionId}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-900 focus:ring-blue-500"
        />
        <span className="text-sm text-slate-700">
          <label htmlFor={aiAssistanceId} className="font-medium text-slate-900">
            Use AI to help structure the writing
          </label>{" "}
          <InfoTip text="On: a model arranges your confirmed findings into readable prose, source IDs are checked against your evidence list, and you review every line for substantive support. Off: a fixed, rule-based formatter assembles the report with no model involved, and the AI-Use Disclosure states that no AI produced any text." />
          <span id={aiAssistanceDescriptionId} className="mt-1 block text-xs text-slate-500">
            {noAi
              ? "Off. Rule-based only: no model is used, and the disclosure will say so."
              : "On. Every sentence is still cited to your evidence, and you review and sign."}
          </span>
        </span>
      </div>

      {/* Affirmative authorship acceptance — required before each export. Appears
          once a fresh report is built; any input change rebuilds + re-arms it. */}
      {preview && !previewStale && (
        <label className="mt-4 flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300"
          />
          <span>
            <strong className="font-semibold text-slate-900">I prepared and adopt this report.</strong>{" "}
            I have reviewed and independently verified every statement, source relationship, figure, citation, method, and opinion, and I accept the{" "}
            <a href="/terms" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="underline hover:text-slate-900">Terms</a>.
          </span>
        </label>
      )}

      {/* 3. Build */}
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => build()} disabled={busy !== null || !dataBoundaryAcknowledged} className={BTN_PRIMARY}>
          {busy === "build" ? (<><Spinner />Building…</>) : "Build & preview report"}
        </button>
        <button onClick={() => download("docx")} disabled={busy !== null || !preview || previewStale || !acknowledged || !dataBoundaryAcknowledged} title={!preview || previewStale ? "Build & preview first" : !acknowledged ? "Confirm preparation and review above first" : undefined} className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-50">
          {busy === "docx" ? (<><Spinner />Preparing…</>) : "Download Word (.docx)"}
        </button>
        <button onClick={() => download("pdf")} disabled={busy !== null || !preview || previewStale || !acknowledged || !dataBoundaryAcknowledged} title={!preview || previewStale ? "Build & preview first" : !acknowledged ? "Confirm preparation and review above first" : undefined} className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-50">
          {busy === "pdf" ? (<><Spinner />Preparing…</>) : "Download PDF"}
        </button>
        {(units.length > 0 || matter.trim()) && (
          <button onClick={clearAll} disabled={busy !== null} className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-50">
            Start over
          </button>
        )}
        {canSave ? (
          <button onClick={save} disabled={busy !== null || !dataBoundaryAcknowledged} className="rounded-xl border border-blue-300 bg-blue-50 px-5 py-2.5 text-sm font-semibold text-blue-800 transition hover:bg-blue-100 disabled:opacity-50">
            {busy === "save" ? (<><Spinner />Saving…</>) : "Save to my account"}
          </button>
        ) : authConfigured ? (
          <a href="/signin" className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 no-underline transition hover:bg-slate-50">
            Sign in to save
          </a>
        ) : null}
        {canSave && isPro && (
          <button onClick={openPortal} disabled={busy !== null} className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">
            {busy === "portal" ? "Opening…" : "Manage billing"}
          </button>
        )}
      </div>

      {/* Credits / buy (signed-in, non-Pro, packs configured) */}
      {canSave && !isPro && (creditsLeft !== null || canBuyCredits) && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
          {creditsLeft !== null && (
            <span className="font-medium text-slate-700">
              {creditsLeft} report credit{creditsLeft === 1 ? "" : "s"}
              <span className="ml-1 font-normal text-slate-500">
                · one credit per report. Word, PDF, and re-downloads of the same version are included{" "}
                <InfoTip text="Editing the report and exporting the revised version uses another credit. The same version, in both formats and any number of re-downloads, is always one credit." />
              </span>
            </span>
          )}
          {canBuyCredits && (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => startCheckout("single")} disabled={busy !== null} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">
                Buy 1 report for $250
              </button>
              <button onClick={() => startCheckout("pack5")} disabled={busy !== null} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">
                Buy 5 reports for $1,000
              </button>
            </div>
          )}
        </div>
      )}

      {/* Preview */}
      {preview && (
        <section id="report-preview" className="space-y-4 rise-in">
          {/* Readiness */}
          <div className={`rounded-2xl border px-5 py-4 ${preview.readiness.blockers > 0 ? "border-red-200 bg-red-50" : preview.readiness.warnings > 0 ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
            <p className="text-sm font-semibold text-slate-900">{preview.readiness.headline}</p>
            <p className="mt-1 text-xs text-slate-600">Automated internal checks: completeness, every sentence cited to your evidence, and disclosure-record integrity. Not a determination of admissibility, which is the court&apos;s.</p>
            {preview.readiness.findings.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {preview.readiness.findings.map((f, i) => (
                  <li key={i}><span className={`mr-1.5 text-xs font-semibold uppercase ${f.severity === "blocker" ? "text-red-700" : "text-amber-700"}`}>{f.severity}</span>{f.message}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Outcome first: make the value of the build legible before showing
              the user the underlying report detail. */}
          <div className="overflow-hidden rounded-2xl bg-slate-950 text-white shadow-xl">
            <div className="grid gap-6 px-5 py-6 sm:px-6 lg:grid-cols-[1.3fr_1fr] lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300">
                  What Disclosed. built
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  Your report package is assembled and traceable.
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
                  The report, its evidence links, and the AI-use record were
                  created together. Review the sections that need your judgment;
                  the supporting detail stays available without taking over the page.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-3">
                  <p className="text-xl font-semibold">{preview.sections.length}</p>
                  <p className="mt-0.5 text-xs text-slate-400">report sections</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-3">
                  <p className="text-xl font-semibold">{citedIds.length}</p>
                  <p className="mt-0.5 text-xs text-slate-400">sources cited</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-3">
                  <p className="text-xl font-semibold">
                    {previewPresentation?.attention ?? 0}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">sections needing you</p>
                </div>
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3.5 py-3">
                  <p className="text-sm font-semibold text-emerald-300">
                    {preview.disclosure.integrity.verified ? "Chain verified" : "Check needed"}
                  </p>
                  <p className="mt-1 text-xs text-emerald-100/70">AI-use record</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="lift rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-800">
                  Review the report
                </p>
                <h2 className="mt-1 text-lg font-semibold">
                  {showAllPreviewSections
                    ? `All ${preview.sections.length} sections`
                    : previewPresentation && previewPresentation.attention > 0
                      ? `${previewPresentation.attention} section${previewPresentation.attention === 1 ? "" : "s"} need your judgment`
                      : "A concise preview of the finished report"}{" "}
                  <InfoTip text="Each section shows a status: “Cited” (every sentence traces to your evidence), “Needs review” (a sentence isn't cited, so fix it before export), or “Awaiting your input” (a spot you still need to fill). Export stays blocked while anything reads “Needs review.”" />
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Disclosed. leads with anything requiring action and keeps the
                  remaining clean sections collapsed into one control.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAllPreviewSections((shown) => !shown)}
                className="shrink-0 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {showAllPreviewSections
                  ? "Show concise preview"
                  : `Show all ${preview.sections.length} sections`}
              </button>
            </div>
            <div className="mt-4 divide-y divide-slate-100">
              {(previewPresentation?.visible ?? preview.sections).map((s) => {
                // Surface a placeholder even in a profile section (e.g. an empty
                // compensation statement) so "[Expert input needed:…]" can't ship silently.
                const status = previewSectionStatus(s);
                const badge =
                  status === "input"
                    ? ["Awaiting your input", "bg-amber-100 text-amber-800"]
                    : status === "profile"
                      ? ["Profile", "bg-slate-100 text-slate-600"]
                      : status === "review"
                        ? ["Needs review", "bg-red-100 text-red-700"]
                        : ["Cited", "bg-emerald-100 text-emerald-700"];
                const isEditing = editingKey === s.key;
                const sectionEvidenceIds = units
                  .filter((u) => u.sectionKey === s.key && u.content.trim() && u.location.trim())
                  .map((u) => u.id);
                return (
                  <div key={s.key} className="py-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                      <h3 className="min-w-0 break-words text-base font-semibold">{s.title}</h3>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {edits[s.key] !== undefined && !isEditing && (
                          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">Edited by you</span>
                        )}
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badge[1]}`}>{badge[0]}</span>
                        {!isEditing && (
                          <button
                            onClick={() => { setEditingKey(s.key); setEditDraft(s.text); }}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                            aria-label={`Edit the ${s.title} section`}
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                    {isEditing ? (
                      <div className="mt-2 space-y-2">
                        <textarea
                          ref={editRef}
                          aria-label={`Edit ${s.title}`}
                          className={`${FIELD} resize-y font-mono text-[13px]`}
                          rows={6}
                          maxLength={20000}
                          value={editDraft}
                          onChange={(e) => setEditDraft(e.target.value)}
                        />
                        {!s.isProfile && (
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
                            <span>
                              Factual sentences must cite your evidence. Click to insert one at your cursor:
                            </span>
                            {sectionEvidenceIds.map((id) => (
                              <button
                                key={id}
                                onClick={() => insertCitation(id)}
                                className="rounded bg-blue-100 px-2 py-1 font-semibold text-blue-700 transition hover:bg-blue-200"
                                aria-label={`Insert citation to evidence ${numberById.get(id) ?? id}`}
                              >
                                [[E:{id}]]
                              </button>
                            ))}
                            <span className="text-slate-600">
                              Uncited additions are flagged and block export.
                            </span>
                          </div>
                        )}
                        {!s.isProfile && (
                          <LiveGrounding text={editDraft} allowedIds={sectionEvidenceIds} />
                        )}
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={async () => {
                              const next = { ...edits, [s.key]: editDraft };
                              setEdits(next);
                              setEditingKey(null);
                              await build(next);
                            }}
                            disabled={busy !== null}
                            className="rounded-lg bg-blue-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-950 disabled:opacity-50"
                          >
                            Save & re-check
                          </button>
                          <button
                            onClick={async () => {
                              const next = { ...edits };
                              delete next[s.key];
                              setEdits(next);
                              setEditingKey(null);
                              await build(next);
                            }}
                            disabled={busy !== null}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                          >
                            Revert to draft
                          </button>
                          <button
                            onClick={() => setEditingKey(null)}
                            className="px-2 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">{renderText(s.text)}</p>
                    )}
                    {!s.isProfile &&
                      (s.grounding.ungroundedSentences.length > 0 ||
                        s.grounding.invalidCitationSentences.length > 0) && (
                        <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                          <p className="text-xs font-semibold text-red-800">
                            These sentences need a citation to your evidence before you can export:
                          </p>
                          <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-red-900">
                            {s.grounding.ungroundedSentences.map((sent, i) => (
                              <li key={`u${i}`}>{sent}</li>
                            ))}
                            {s.grounding.invalidCitationSentences.map((sent, i) => (
                              <li key={`c${i}`}>
                                {sent}{" "}
                                <span className="font-medium">(its citation doesn&apos;t match a listed source)</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
            {previewPresentation && previewPresentation.hidden > 0 && (
              <button
                type="button"
                onClick={() => setShowAllPreviewSections(true)}
                className="mt-4 flex w-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-900"
              >
                {previewPresentation.hidden} more clean section
                {previewPresentation.hidden === 1 ? "" : "s"} · show the full report
              </button>
            )}
          </div>

          {/* Disclosure */}
          <div className="lift rounded-2xl border border-slate-300 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-sm font-semibold text-slate-800">
                AI-Disclosure record{" "}
                <InfoTip text="The auto-generated record of AI use that becomes the appendix in your export: each AI-assisted section, the model and version, and the evidence it was given. “Chain verified” means each entry is cryptographically linked to the one before it, so a later edit or deletion can be detected. It makes tampering evident, not impossible." />
              </h3>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${preview.disclosure.integrity.verified ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${preview.disclosure.integrity.verified ? "bg-emerald-500" : "bg-red-500"}`} />
                {preview.disclosure.integrity.verified ? "Tamper-evident chain verified" : "Chain check failed"}
              </span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-600">{preview.disclosure.statement}</p>
            <p className="mt-2 text-xs text-slate-500">Prepared with: {preview.disclosure.models.join(", ") || "—"}. This composes the full AI-Disclosure Appendix in your export. Disclosed. does not persist the report to your account unless you choose Save; model-provider retention is described in the Privacy Notice.</p>
            <a href="/for-counsel" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs font-medium text-blue-800 underline-offset-2 hover:underline">Share a one-page explainer with retaining counsel →</a>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              {preview.disclosure.rawEvents && preview.disclosure.rawEvents.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    downloadDisclosureManifest(
                      matter,
                      preview.disclosure.rawEvents!,
                      preview.disclosure.generatedAt ?? new Date().toISOString(),
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
                >
                  Download disclosure manifest (.json)
                </button>
              )}
              <a
                href="/verify"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-blue-800 underline-offset-2 hover:underline"
              >
                Verify this record independently →
              </a>
            </div>
            {preview.disclosure.models.some((m) => !/no AI model used/i.test(m)) && (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
                <strong>You prepare and sign the report.</strong> These sections
                were structured with AI assistance. Missing and unknown source
                IDs are blocked, but a valid marker does not prove the source
                supports the sentence. Read every sentence, verify each source
                relationship, and confirm every opinion before you sign.
              </p>
            )}
          </div>

          {/* Private challenge-readiness self-check (ephemeral — never stored or
              disclosed). Placed AFTER the build so there's a draft to review. */}
          <ChallengeChecklist guide={sectionGuide} usedKeys={usedKeys} />
        </section>
      )}
    </div>
  );
}
