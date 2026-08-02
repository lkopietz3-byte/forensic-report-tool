"use client";

import { useState } from "react";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#disclosure", label: "AI disclosure" },
  { href: "#faq", label: "FAQ" },
  { href: "#pricing", label: "Pricing" },
  { href: "/sample", label: "Sample report" },
  { href: "/resources", label: "Resources" },
  { href: "/workspace", label: "Try the worked example" },
];

// The full nav only fits at lg (1024px+). Below that, this hamburger keeps the
// site navigable on tablet/mobile without crowding the header. Rendered inside
// the sticky header so the panel drops full-width beneath it.
export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden>
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      {open && (
        <>
          {/* Click-away backdrop */}
          <button
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-0 cursor-default bg-slate-900/10"
          />
          <div className="absolute left-0 right-0 top-full z-10 border-b border-slate-200 bg-white shadow-lg">
            <nav
              aria-label="Mobile"
              className="mx-auto flex max-w-6xl flex-col px-4 py-2"
            >
              {LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-base font-medium text-slate-700 no-underline transition hover:bg-slate-100"
                >
                  {l.label}
                </a>
              ))}
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
