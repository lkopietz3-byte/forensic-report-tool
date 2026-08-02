"use client";

import { useEffect, useRef, useState } from "react";

// A small, accessible info affordance: an "i" trigger that reveals a short
// explanation on hover, keyboard focus, AND tap. On a touchscreen there is no
// hover (an iPad is the target expert's likely device), so a tap opens it and a
// tap anywhere outside — or Escape, or moving focus away — closes it. The same
// text is the button's aria-label, so screen readers get it too.
//
// Visibility is driven by React state toggling plain opacity utilities rather
// than `group-hover`/`group-focus-within` variants — those proved unreliable
// here. Pure presentation; never affects report content or the invariants.
export function InfoTip({ text, className }: { text: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  // When open (typically after a tap, where there's no blur to rely on), close
  // on the next pointer-down outside this control.
  useEffect(() => {
    if (!open) return;
    const onOutside = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onOutside);
    return () => document.removeEventListener("pointerdown", onOutside);
  }, [open]);

  return (
    <span ref={ref} className={`relative inline-flex align-middle ${className ?? ""}`}>
      <button
        type="button"
        aria-label={text}
        aria-expanded={open}
        // Hover for a MOUSE only: pointer events exclude touch, so a tap doesn't
        // trip a hover-open that a synthetic event would immediately re-close.
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") setOpen(true);
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") setOpen(false);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        // A tap/click opens it (and must not submit a form, scroll, or toggle a
        // control this icon happens to sit inside). Outside-tap / Escape close it.
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 text-[10px] font-semibold leading-none text-slate-500 transition hover:border-slate-400 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
      >
        i
      </button>
      <span
        role="tooltip"
        className={`pointer-events-none absolute bottom-full right-0 z-30 mb-1.5 w-48 max-w-[calc(100vw-3rem)] rounded-lg bg-slate-900 px-3 py-2 text-left text-xs font-normal normal-case leading-relaxed tracking-normal text-slate-100 shadow-lg sm:left-1/2 sm:right-auto sm:w-60 sm:-translate-x-1/2 ${open ? "block opacity-100" : "hidden opacity-0"}`}
      >
        {text}
      </span>
    </span>
  );
}
