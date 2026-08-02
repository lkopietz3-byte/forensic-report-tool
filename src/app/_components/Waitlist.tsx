"use client";

import { useId, useState } from "react";
import { DISCIPLINES, type Discipline } from "@/lib/waitlist/schema";

const DISCIPLINE_LABELS: Record<Discipline, string> = {
  forensic_engineering: "Forensic / civil engineering",
  accident_reconstruction: "Accident reconstruction",
  vocational_rehabilitation: "Vocational rehabilitation",
  other: "Another discipline",
};

export function Waitlist({ source }: { source?: string }) {
  const emailId = useId();
  const disciplineId = useId();
  const [email, setEmail] = useState("");
  const [discipline, setDiscipline] = useState<Discipline | "">("");
  const [company, setCompany] = useState(""); // honeypot
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || status === "loading") return;
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          discipline: discipline || undefined,
          company: company || undefined,
          source,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
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
        className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800"
        role="status"
        aria-live="polite"
      >
        <svg
          className="mt-0.5 h-5 w-5 shrink-0"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.79 6.8-6.79a1 1 0 0 1 1.4 0Z"
            clipRule="evenodd"
          />
        </svg>
        <div>
          <p className="text-sm font-medium">
            You&apos;re on the list. We&apos;ll be in touch about early access and
            design-partner slots.
          </p>
          <a
            href="/sample"
            className="mt-1.5 inline-block text-sm font-medium text-emerald-800 underline underline-offset-2 hover:text-emerald-900"
          >
            While you wait, see a sample report and its AI-disclosure appendix →
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-md flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor={emailId} className="sr-only">
          Work email
        </label>
        <input
          id={emailId}
          type="email"
          required
          autoComplete="email"
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@yourpractice.com"
          className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 sm:flex-1"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="h-12 shrink-0 rounded-xl bg-blue-900 px-6 text-base font-semibold text-white shadow-sm transition hover:bg-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "loading" ? "Submitting…" : "Request early access"}
        </button>
      </div>

      <label htmlFor={disciplineId} className="sr-only">
        Your discipline
      </label>
      <select
        id={disciplineId}
        value={discipline}
        onChange={(e) => setDiscipline(e.target.value as Discipline | "")}
        className="h-12 rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
      >
        <option value="">Your discipline (optional)</option>
        {DISCIPLINES.map((d) => (
          <option key={d} value={d}>
            {DISCIPLINE_LABELS[d]}
          </option>
        ))}
      </select>

      {/* Honeypot: hidden from humans, tempting to bots. */}
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
        <p role="alert" aria-live="assertive" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <p className="text-xs leading-relaxed text-slate-500">
        We use your email only to contact you about early access. By submitting,
        you agree to our{" "}
        <a
          href="/privacy"
          className="underline decoration-slate-300 underline-offset-2 hover:text-slate-700"
        >
          Privacy Notice
        </a>{" "}
        and{" "}
        <a
          href="/terms"
          className="underline decoration-slate-300 underline-offset-2 hover:text-slate-700"
        >
          Terms
        </a>
        . Disclosed. is a formatting tool, not a law firm, and nothing here is
        legal advice.
      </p>
      <p className="text-xs text-slate-500">
        Not ready to sign up? Email{" "}
        <a
          href="mailto:hello@disclosed.app"
          className="underline decoration-slate-300 underline-offset-2 hover:text-slate-700"
        >
          hello@disclosed.app
        </a>{" "}
        with any question. The founder reads every one.
      </p>
    </form>
  );
}
