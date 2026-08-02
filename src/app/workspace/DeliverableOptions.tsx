"use client";

import { useRef, useState } from "react";
import type { DeliverableStyle } from "@/lib/export/style";
import { FIELD } from "./ui";
import { InfoTip } from "./InfoTip";

// Formatting controls for the exported deliverable: the things experts and
// retaining counsel actually ask for. Court-classic type, double spacing,
// Roman-numeral headings, a dated cover, footer text, and which appendices to
// attach. Pure presentation choices; nothing here can alter report CONTENT, so
// the grounding/honesty invariants are untouched.

const OPT_LABEL = "mb-1 block text-xs font-medium text-slate-600";

export function DeliverableOptions({
  value,
  onChange,
}: {
  value: DeliverableStyle;
  onChange: (next: DeliverableStyle) => void;
}) {
  const [open, setOpen] = useState(false);
  const [logoErr, setLogoErr] = useState<string | null>(null);
  const logoRef = useRef<HTMLInputElement | null>(null);
  const set = <K extends keyof DeliverableStyle>(key: K, v: DeliverableStyle[K]) =>
    onChange({ ...value, [key]: v });

  // Load a logo, resize it into a small bounding box, and store it as a PNG data
  // URL. Resizing client-side keeps the payload tiny and avoids ever sending a
  // full-resolution file. Branding only. Never evidence, never cited.
  async function handleLogo(file: File | null | undefined) {
    setLogoErr(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setLogoErr("Please choose an image file.");
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
      const scale = Math.min(480 / img.width, 200 / img.height, 1);
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setLogoErr("Couldn't process that image.");
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL("image/png");
      if (dataUrl.length > 550_000) {
        setLogoErr("That logo is too detailed. Try a simpler or smaller image.");
        return;
      }
      set("coverLogo", dataUrl);
    } catch {
      setLogoErr("Couldn't read that image.");
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left"
        aria-expanded={open}
        aria-label="Deliverable formatting options"
      >
        <span className="text-sm font-semibold text-slate-800">
          Deliverable options
          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
            formatting
          </span>
        </span>
        <svg
          className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="fade-in space-y-5 border-t border-slate-100 px-6 py-5">
          <p className="text-xs text-slate-500">
            How the Word/PDF file is formatted. These change the look only. They
            never touch the content, citations, or the grounding checks.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="opt-font" className={OPT_LABEL}>Typeface</label>
              <select id="opt-font" className={FIELD} value={value.font}
                onChange={(e) => set("font", e.target.value as DeliverableStyle["font"])}>
                <option value="default">Default (book serif)</option>
                <option value="times">Times New Roman (court classic)</option>
                <option value="century">Century Schoolbook (court serif)</option>
                <option value="sans">Sans-serif (modern)</option>
              </select>
            </div>
            <div>
              <label htmlFor="opt-size" className={OPT_LABEL}>Body size</label>
              <select id="opt-size" className={FIELD} value={value.fontSizePt}
                onChange={(e) => set("fontSizePt", Number(e.target.value) as 11 | 12)}>
                <option value={11}>11 pt</option>
                <option value={12}>12 pt (court norm)</option>
              </select>
            </div>
            <div>
              <label htmlFor="opt-spacing" className={OPT_LABEL}>Line spacing</label>
              <select id="opt-spacing" className={FIELD} value={value.lineSpacing}
                onChange={(e) => set("lineSpacing", e.target.value as DeliverableStyle["lineSpacing"])}>
                <option value="single">Single</option>
                <option value="onehalf">1.5 lines</option>
                <option value="double">Double</option>
              </select>
            </div>
            <div>
              <label htmlFor="opt-numbering" className={OPT_LABEL}>Section numbering</label>
              <select id="opt-numbering" className={FIELD} value={value.headingNumbering}
                onChange={(e) => set("headingNumbering", e.target.value as DeliverableStyle["headingNumbering"])}>
                <option value="decimal">1. 2. 3.</option>
                <option value="roman">I. II. III.</option>
                <option value="none">No numbering</option>
              </select>
            </div>
          </div>

          {value.font === "century" && (
            <p className="text-xs text-slate-500">
              Century Schoolbook renders in the Word file; the PDF uses Times New
              Roman as the closest court-classic match.
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="opt-date" className={OPT_LABEL}>Report date (shown on the cover)</label>
              <input id="opt-date" className={FIELD} maxLength={60} value={value.reportDate}
                onChange={(e) => set("reportDate", e.target.value)} placeholder="e.g. June 10, 2026" />
            </div>
            <div>
              <label htmlFor="opt-footer" className={OPT_LABEL}>Footer text</label>
              <input id="opt-footer" className={FIELD} maxLength={120} value={value.footerText}
                onChange={(e) => set("footerText", e.target.value)}
                placeholder='Default: "DRAFT — NOT SIGNED"' />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-2.5 px-1 py-1 text-sm text-slate-700">
              <input
                id="opt-line-numbers"
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-900 focus:ring-blue-500"
                checked={value.lineNumbers}
                onChange={(e) => set("lineNumbers", e.target.checked)}
              />
              <span>
                <label htmlFor="opt-line-numbers">Line numbering</label>{" "}
                <InfoTip text="Continuous pleading-paper line numbers, the way many courts require. Applied to the Word deliverable (the filed master); the typeset PDF hand-off is left clean." />
                <span className="mt-0.5 block text-xs text-slate-500">
                  Word deliverable · for courts that require numbered lines
                </span>
              </span>
            </div>
            <div>
              <span className={OPT_LABEL}>Cover logo (optional)</span>
              {value.coverLogo ? (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={value.coverLogo}
                    alt="Cover logo preview"
                    className="h-9 max-w-[120px] rounded border border-slate-200 bg-white object-contain p-0.5"
                  />
                  <button
                    type="button"
                    onClick={() => { set("coverLogo", ""); setLogoErr(null); }}
                    className="text-xs font-medium text-slate-500 transition hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <input
                    ref={logoRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleLogo(e.target.files?.[0])}
                  />
                  <button
                    type="button"
                    onClick={() => logoRef.current?.click()}
                    className="rounded-xl border border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
                  >
                    Upload a logo
                  </button>
                </>
              )}
              {logoErr && <p role="alert" className="mt-1 text-xs text-red-600">{logoErr}</p>}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {([
              ["includeCoverPage", "Cover page", "A title page with the matter caption, your name and role, the report date, and a confidentiality legend. The signature line is left blank for you to sign."],
              ["includeDisclosure", "AI-Use Disclosure appendix", "The record of how AI was used: each AI-assisted section, the model and version, and the exact evidence it was given. It's generated automatically, and it's what you'd point to if your AI use is ever questioned."],
              ["includeMapping", "Data-to-opinion mapping appendix", "For each opinion, a side-by-side of the evidence it actually cites versus evidence you provided but didn't cite. That way, the basis for a challenged opinion is easy to trace."],
              ["includeReadiness", "Readiness check page (for your file copy only, off by default)", "The tool's own checks (completeness, every sentence cited, record integrity). Handy for your QA, but usually left off the filed copy since it isn't part of the report."],
            ] as const).map(([key, label, tip]) => (
              <div key={key} className="flex items-start gap-2.5 rounded-lg px-1 py-1 text-sm text-slate-700">
                <input
                  id={`opt-${key}`}
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-900 focus:ring-blue-500"
                  checked={value[key]}
                  onChange={(e) => set(key, e.target.checked)}
                />
                <span>
                  <label htmlFor={`opt-${key}`}>{label}</label>{" "}
                  <InfoTip text={tip} />
                </span>
              </div>
            ))}
          </div>

          {!value.includeDisclosure && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
              The AI-use record still exists in this app and in the audit chain.
              This only controls whether the appendix is attached to this file.
              Whether and how to disclose AI assistance is your and counsel&apos;s
              decision under the rules that govern your matter.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
