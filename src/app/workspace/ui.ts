// Shared presentational class strings, so the input style and the primary-button
// color stay identical across the workspace instead of drifting card-to-card.
// (They had drifted: two different field text sizes in one view, and two
// competing primary blues stacked on the same screen.)

export const FIELD =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-base text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30";

// The one primary-action color (brand navy-blue). Visual hierarchy comes from
// placement and surrounding controls, not from using a second, brighter blue.
export const BTN_PRIMARY =
  "rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-950 disabled:opacity-50";
