"use client";

import { useId, useState } from "react";
import {
  DISCIPLINES,
  REPORTS_PER_YEAR,
  type Discipline,
  type ReportsPerYear,
} from "@/lib/waitlist/schema";

const DISCIPLINE_LABELS: Record<Discipline, string> = {
  forensic_engineering: "Forensic / civil engineering",
  accident_reconstruction: "Accident reconstruction",
  vocational_rehabilitation: "Vocational rehabilitation",
  other: "Another discipline",
};

const VOLUME_LABELS: Record<ReportsPerYear, string> = {
  "1-3": "1–3 a year",
  "4-10": "4–10 a year",
  "11-25": "11–25 a year",
  "25+": "25+ a year",
};

// Design-partner application. Breaks discovery into focused questions (we learn
// far more than from one open box) and is gated for quality server-side — a free
// slot is earned, not auto-granted. Posts to /api/waitlist (same-origin,
// rate-limited, honeypot-guarded).
export function ExpertInterest({
  initialDiscipline,
}: {
  initialDiscipline?: Discipline;
}) {
  const emailId = useId();
  const roleId = useId();
  const disciplineId = useId();
  const volumeId = useId();
  const painId = useId();
  const aiId = useId();
  const trustId = useId();
  const errorId = useId();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [discipline, setDiscipline] = useState<Discipline | "">(
    initialDiscipline ?? "",
  );
  const [reportsPerYear, setReportsPerYear] = useState<ReportsPerYear | "">("");
  const [painPoint, setPainPoint] = useState("");
  const [aiExperience, setAiExperience] = useState("");
  const [mustHave, setMustHave] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  function clientIssue(): string | null {
    if (!email.trim()) return "Add your email so we can get back to you.";
    if (!discipline) return "Pick your discipline so we can match you to the right template.";
    const answered = [painPoint, aiExperience, mustHave].map((s) => s.trim()).filter(Boolean);
    if (answered.length < 2 || answered.join(" ").length < 60) {
      return "Answer at least two of the questions with a real sentence or two. That's what we review.";
    }
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;
    const issue = clientIssue();
    if (issue) {
      setStatus("error");
      setError(issue);
      return;
    }
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          role: role.trim() || undefined,
          discipline: discipline || undefined,
          reportsPerYear: reportsPerYear || undefined,
          painPoint: painPoint.trim() || undefined,
          aiExperience: aiExperience.trim() || undefined,
          mustHave: mustHave.trim() || undefined,
          company: company || undefined,
          source: initialDiscipline
            ? `for-experts-${initialDiscipline}-preview`
            : "for-experts",
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Something went wrong.");
      }
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "done") {
    return (
      <div
        className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-6 text-emerald-900"
        role="status"
        aria-live="polite"
      >
        <p className="text-base font-semibold">Got your application. Thank you.</p>
        <p className="mt-2 text-sm leading-relaxed">
          We read every one. We&apos;re taking on a small number of practicing
          experts per discipline, so it won&apos;t be instant. If your answers line
          up with what we&apos;re building, we&apos;ll email you a design-partner
          slot (free, with your input shaping the template) and the access details.
          No call required unless you want one.
        </p>
      </div>
    );
  }

  const fieldClass =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30";
  const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={emailId} className={labelClass}>
            Work email <span className="text-red-500">*</span>
          </label>
          <input
            id={emailId}
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@yourpractice.com"
            className={fieldClass}
            aria-invalid={status === "error"}
            aria-describedby={status === "error" ? errorId : undefined}
          />
        </div>
        <div>
          <label htmlFor={roleId} className={labelClass}>Name &amp; credentials</label>
          <input
            id={roleId}
            autoComplete="name"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Dana Whitfield, CRC, ABVE/D"
            maxLength={120}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor={disciplineId} className={labelClass}>
            Your discipline <span className="text-red-500">*</span>
          </label>
          <select
            id={disciplineId}
            required
            value={discipline}
            onChange={(e) => setDiscipline(e.target.value as Discipline | "")}
            className={fieldClass}
            aria-invalid={status === "error" && !discipline}
            aria-describedby={status === "error" ? errorId : undefined}
          >
            <option value="">Select…</option>
            {DISCIPLINES.map((d) => (
              <option key={d} value={d}>
                {DISCIPLINE_LABELS[d]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={volumeId} className={labelClass}>Reports you write a year</label>
          <select
            id={volumeId}
            value={reportsPerYear}
            onChange={(e) => setReportsPerYear(e.target.value as ReportsPerYear | "")}
            className={fieldClass}
          >
            <option value="">Select…</option>
            {REPORTS_PER_YEAR.map((v) => (
              <option key={v} value={v}>
                {VOLUME_LABELS[v]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <p className="text-xs font-medium text-slate-500">
          A couple of real sentences on any two of these tells us whether it&apos;s a fit:
        </p>
        <div className="mt-3 space-y-4">
          <div>
            <label htmlFor={painId} className={labelClass}>
              When you write a report, what eats the most time, or what do you dread?
            </label>
            <textarea
              id={painId}
              value={painPoint}
              onChange={(e) => setPainPoint(e.target.value.slice(0, 1000))}
              rows={2}
              className={`${fieldClass} resize-y`}
            />
          </div>
          <div>
            <label htmlFor={aiId} className={labelClass}>
              Have you used AI in a report? What happened, or what&apos;s held you back?
            </label>
            <textarea
              id={aiId}
              value={aiExperience}
              onChange={(e) => setAiExperience(e.target.value.slice(0, 1000))}
              rows={2}
              className={`${fieldClass} resize-y`}
            />
          </div>
          <div>
            <label htmlFor={trustId} className={labelClass}>
              What would this have to do (or never do) for you to trust it on a real matter?
            </label>
            <textarea
              id={trustId}
              value={mustHave}
              onChange={(e) => setMustHave(e.target.value.slice(0, 1000))}
              rows={2}
              className={`${fieldClass} resize-y`}
            />
          </div>
        </div>
      </div>

      {/* Honeypot */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor={`${emailId}-company`}>Company</label>
        <input
          id={`${emailId}-company`}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>

      {status === "error" && error && (
        <div id={errorId} role="alert" aria-live="assertive" className="text-sm leading-relaxed text-red-700">
          <p>{error}</p>
          <p className="mt-1">
            If it keeps happening, email{" "}
            <a
              href="mailto:hello@disclosed.app?subject=Disclosed.%20design-partner%20application"
              className="font-semibold underline"
            >
              hello@disclosed.app
            </a>{" "}
            and we will handle it directly.
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="h-12 w-full rounded-xl bg-blue-900 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {status === "loading" ? "Sending…" : "Apply to be a design partner"}
      </button>

      <p className="text-xs leading-relaxed text-slate-500">
        We use your application only to evaluate and follow up about early
        access. By submitting, you agree to our{" "}
        <a href="/terms" className="underline decoration-slate-300 underline-offset-2">
          Terms
        </a>{" "}
        and acknowledge our{" "}
        <a href="/privacy" className="underline decoration-slate-300 underline-offset-2">
          Privacy Notice
        </a>
        . Disclosed. is a software tool, not a law firm, and nothing here is
        legal advice.
      </p>
    </form>
  );
}
