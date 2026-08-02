"use client";

import { useEffect, useRef, useState } from "react";

// A floating "Help & feedback" affordance — NOT a live chat. It self-serves from
// a curated, searchable FAQ (preset knowledge, so it can never hallucinate), and
// falls back to a real capture form (persisted via /api/feedback) plus the
// founder's email. No third-party script, so it doesn't touch the CSP nonce or
// contradict the privacy notice's "no third-party trackers" commitment.

// Curated from the full help center (/help). Condensed for a popover; honesty
// rules apply (structures/organizes; tamper-evident, not tamper-proof;
// commitments, not certifications; admissibility is the court's call).
const HELP_QA: { q: string; a: string }[] = [
  {
    q: "What does Disclosed. do?",
    a: "It structures your own findings into a Rule 26(a)(2)(B)-organized report. Every factual sentence must carry a source ID you supplied, and it keeps an automatic record of any AI use. You review, independently verify, adopt, and sign it.",
  },
  {
    q: "Do I need an account to try it?",
    a: "No. You can build and preview a report, and load a worked example, with no sign-in. An account (free, magic-link) lets you save and reopen reports. The first report export is free; later exports use report credits once public billing opens.",
  },
  {
    q: "Can I use a real matter during early access?",
    a: "Not yet. Use the fictional worked example or properly de-identified material only. Anthropic's standard API retention can be up to 30 days, and zero-data-retention and counsel-reviewed terms are not yet in place.",
  },
  {
    q: "What leaves my browser?",
    a: "The original PDF, Word, Excel, or image bytes are read locally and are not uploaded by the document reader. The text you confirm is sent to the Disclosed. server for structuring and, when AI is on, to Anthropic. No-AI mode does not send it to a model provider.",
  },
  {
    q: "Do you train AI on my case data?",
    a: "Disclosed. does not use customer content to train models, and we do not opt into Anthropic training. Anthropic says standard commercial API inputs and outputs are deleted within 30 days, subject to its stated safety and legal exceptions. We do not yet have zero-data-retention.",
  },
  {
    q: "What is closed-world grounding?",
    a: "Every factual sentence must carry an evidence ID you supplied, and unknown or missing IDs block export. That proves source linkage, not semantic support: you still compare the sentence with the cited source and verify it.",
  },
  {
    q: "Why was my sentence flagged red?",
    a: "It makes a factual claim with no citation, or cites an ID that isn't in your evidence list. Add the source, or fix the [[E:id]] marker so it matches an evidence item, and it clears.",
  },
  {
    q: "What's in the AI-Disclosure record?",
    a: "For each AI-assisted section: the model and version, and exactly the evidence it was given. The log is append-only and tamper-evident (alteration is detectable, not impossible). In no-AI mode it states that no model produced any text.",
  },
  {
    q: "Can I use it with no AI at all?",
    a: "Yes. No-AI mode assembles the report with a fixed, rule-based engine, with no model involved. The same grounding and export gate apply, and the disclosure states plainly that no AI wrote anything.",
  },
  {
    q: "What does it cost?",
    a: "The founding, de-identified pilot is free. The post-pilot price being tested is $250 per report, with a planned five-report pack at $1,000. We are not selling an unlimited annual plan until real report volume and support needs are known.",
  },
  {
    q: "Why did my export fail?",
    a: "The export gate is hard: if any factual sentence lacks a citation to your evidence, or cites an unknown ID, export is blocked and shows you exactly which sentences. Resolve them and export again.",
  },
];

const F =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30";

export function HelpWidget() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const honeypot = useRef("");

  // Close on Escape for keyboard users.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const q = query.trim().toLowerCase();
  const matches = q
    ? HELP_QA.filter((x) => (x.q + " " + x.a).toLowerCase().includes(q))
    : HELP_QA;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) {
      setError("Add a short message first.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          email: email.trim(),
          source: "help-widget",
          page: typeof window !== "undefined" ? window.location.pathname.slice(0, 200) : undefined,
          company: honeypot.current,
        }),
      });
      if (!res.ok) {
        throw new Error((await res.json().catch(() => ({}))).error ?? "Could not send.");
      }
      setSent(true);
      setMessage("");
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="no-print fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {open && (
        <div
          role="dialog"
          aria-label="Help and feedback"
          className="rise-in mb-3 flex max-h-[min(34rem,80vh)] w-[min(23rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">
              {showForm ? "Send us a note" : "How can we help?"}
            </p>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close help"
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            {!showForm ? (
              <>
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setExpanded(null);
                  }}
                  placeholder="Search common questions…"
                  aria-label="Search common questions"
                  className={F}
                />
                <ul className="mt-3 space-y-1.5">
                  {matches.length === 0 && (
                    <li className="px-1 py-2 text-sm text-slate-500">
                      No match. Send us your question below and we&apos;ll reply.
                    </li>
                  )}
                  {matches.map((x) => {
                    const i = HELP_QA.indexOf(x);
                    const isOpen = expanded === i;
                    return (
                      <li key={i} className="overflow-hidden rounded-lg border border-slate-200">
                        <button
                          onClick={() => setExpanded(isOpen ? null : i)}
                          aria-expanded={isOpen}
                          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm font-medium text-slate-800 hover:bg-slate-50"
                        >
                          <span>{x.q}</span>
                          <span aria-hidden className="shrink-0 text-base leading-none text-slate-400">
                            {isOpen ? "−" : "+"}
                          </span>
                        </button>
                        {isOpen && (
                          <p className="fade-in border-t border-slate-100 px-3 py-2 text-sm leading-relaxed text-slate-600">
                            {x.a}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : sent ? (
              <div className="fade-in py-8 text-center">
                <p className="text-sm font-semibold text-slate-900">Thanks. We read every note.</p>
                <p className="mt-1 text-sm text-slate-600">
                  If you left an email, we&apos;ll reply there.
                </p>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setSent(false);
                  }}
                  className="mt-4 text-sm font-medium text-blue-800 hover:underline"
                >
                  Back to help
                </button>
              </div>
            ) : (
              <form onSubmit={send} className="space-y-2.5">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  maxLength={4000}
                  placeholder="Your question or feedback…"
                  aria-label="Your message"
                  className={`${F} resize-y`}
                />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="Email (optional, so we can reply)"
                  aria-label="Your email (optional)"
                  className={F}
                />
                {/* Honeypot — off-screen, not display:none, so simple bots fill it. */}
                <div aria-hidden className="pointer-events-none absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
                  <label>
                    Company
                    <input
                      tabIndex={-1}
                      autoComplete="off"
                      onChange={(e) => {
                        honeypot.current = e.target.value;
                      }}
                    />
                  </label>
                </div>
                {error && <p role="alert" aria-live="assertive" className="text-xs text-red-600">{error}</p>}
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={sending}
                    className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-950 disabled:opacity-50"
                  >
                    {sending ? "Sending…" : "Send"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setError(null);
                    }}
                    className="text-sm font-medium text-slate-500 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-500">
                  Your message, optional reply email, this page, and basic browser
                  information are stored for support. See the{" "}
                  <a href="/privacy" className="underline">
                    Privacy Notice
                  </a>
                  .
                </p>
              </form>
            )}
          </div>

          {!showForm && (
            <div className="border-t border-slate-100 px-4 py-3">
              <button
                onClick={() => {
                  setShowForm(true);
                  setError(null);
                }}
                className="text-sm font-semibold text-blue-800 hover:underline"
              >
                Didn&apos;t find it? Send us a note →
              </button>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                Or read the{" "}
                <a href="/help" className="text-blue-800 hover:underline">
                  full help center
                </a>{" "}
                · email{" "}
                <a href="mailto:hello@disclosed.app" className="text-blue-800 hover:underline">
                  hello@disclosed.app
                </a>
              </p>
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close help" : "Open help and feedback"}
        aria-expanded={open}
        className="flex h-12 items-center gap-2 rounded-full bg-blue-900 pl-3.5 pr-4 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-950"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          ) : (
            <>
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" strokeLinejoin="round" />
              <path d="M9.5 9.5a2.5 2.5 0 0 1 4.8.9c0 1.7-2.5 2.5-2.5 2.5" strokeLinecap="round" />
              <path d="M12 16.5h.01" strokeLinecap="round" />
            </>
          )}
        </svg>
        <span className="hidden sm:inline">{open ? "Close" : "Help"}</span>
      </button>
    </div>
  );
}
