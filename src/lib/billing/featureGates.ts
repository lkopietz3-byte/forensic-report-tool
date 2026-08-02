// Free vs. Pro access rules — the single source of truth for what the preview
// tier can and cannot do. UI reads `canAccess()`; never re-implement the rule
// inline, or the gate and the billing logic drift apart.
//
// IMPORTANT (hard lesson from the sibling app): a client-side gate is a UX
// nudge, NOT enforcement. Anyone can edit state or replay a request. When auth
// and billing land, the deliverable-producing actions (DOCX/PDF export, full
// disclosure appendix generation) MUST be re-checked server-side against the
// caller's real subscription before any file is produced. This module exists so
// that the free/pro boundary is defined in exactly one place when that happens.

export type Tier = "free" | "pro";

// Deliverables a free preview teases but does not hand over. The label is what
// the upgrade prompt shows the user.
export const GATED_FEATURES = {
  docx_export: "Export to Word & PDF",
  full_disclosure_appendix: "The complete AI-Disclosure Appendix",
} as const;

export type GatedFeature = keyof typeof GATED_FEATURES;

// Free tier shows the first N appendix rows, then locks the rest behind the
// upgrade wall — enough to prove the record exists, not enough to walk away
// with it.
export const FREE_TIER_LIMITS = {
  DISCLOSURE_PREVIEW_ROWS: 2,
} as const;

// Everything the interactive preview CAN do, free, so an expert feels the full
// drafting-and-verification loop before hitting a wall.
const FREE_FEATURES = new Set<string>([
  "intake",
  "evidence",
  "draft_editing",
  "grounding_guardrail",
  "section_approval",
  "rule26_checklist",
  "disclosure_preview",
  // Saving your own work to your own account is free — gating persistence
  // behind Pro would punish the exact behavior we want (signup + retention).
  // Only the deliverable (export) and the full appendix are Pro.
  "save_report",
]);

export function canAccess(feature: GatedFeature | string, tier: Tier): boolean {
  if (tier === "pro") return true;
  return FREE_FEATURES.has(feature);
}

// --- Tier derivation: one function, shared by client UX and the server gate ---
//
// The sibling app's hardest-won lesson: when the UI and the server compute the
// tier separately, they drift, and a user sees "Pro" while the server says
// "free" (or worse, vice-versa). Derive the tier in exactly ONE place from the
// subscription record. When billing lands, the Stripe webhook writes this shape;
// until then everyone is "free".

export type SubscriptionRecord = {
  // Stripe subscription status, as mirrored into our DB. `null` = no record.
  status?: "active" | "trialing" | "past_due" | "canceled" | "incomplete" | null;
  // End of the current paid period (ISO), mirrored from Stripe. Used as a
  // self-healing backstop so a dropped terminal webhook can't grant Pro forever.
  currentPeriodEnd?: string | null;
} | null | undefined;

// Statuses that still grant Pro. `past_due` is intentionally included: a failed
// card should not instantly revoke a deliverable the expert is mid-export on —
// dunning handles recovery. `canceled`/`incomplete` do not grant.
const PRO_STATUSES = new Set(["active", "trialing", "past_due"]);

// Grace beyond current_period_end before we revoke on the period-end backstop.
// Absorbs Stripe webhook delay (retries ~72h) and the dunning window, so a
// genuinely-renewing payer isn't falsely downgraded if a renewal event is late;
// a truly-dead sub whose terminal webhook was lost still expires after this.
const PERIOD_GRACE_MS = 5 * 24 * 60 * 60 * 1000;

export function deriveTier(sub: SubscriptionRecord, now: number = Date.now()): Tier {
  if (!sub || !sub.status || !PRO_STATUSES.has(sub.status)) return "free";
  const end = sub.currentPeriodEnd ? Date.parse(sub.currentPeriodEnd) : NaN;
  const hasValidEnd = Number.isFinite(end);
  // Backstop: entitlement should not depend solely on inbound webhooks. If the
  // mirrored period end is well in the past, treat the sub as lapsed.
  if (hasValidEnd && now > end + PERIOD_GRACE_MS) return "free";
  // past_due is a FAILED payment. Keep Pro only while we can PROVE the paid
  // period hasn't clearly ended (a known, in-grace period end). With no period
  // end we can't tell "just missed a renewal" from "dead for months", so fail
  // closed — otherwise a null current_period_end (e.g. an API-version mapping
  // gap) would grant Pro forever. active/trialing are current payments and keep
  // Pro regardless.
  if (sub.status === "past_due" && !hasValidEnd) return "free";
  return "pro";
}

// --- Server-gate contract -----------------------------------------------------
//
// The deliverable-producing routes (DOCX/PDF export, full disclosure appendix)
// MUST call this server-side against the caller's REAL subscription before
// producing any file. `canAccess` above is a client UX nudge only. This returns
// a transport-agnostic decision the route turns into a 401/403; it does not
// import Next so it stays unit-testable in the dependency-light domain layer.

export type GateDecision =
  | { ok: true; tier: Tier }
  | { ok: false; status: 401 | 403; code: "AUTH_REQUIRED" | "PRO_REQUIRED"; feature: string };

export function checkServerAccess(
  feature: GatedFeature | string,
  ctx: { authenticated: boolean; subscription: SubscriptionRecord },
): GateDecision {
  if (!ctx.authenticated) {
    return { ok: false, status: 401, code: "AUTH_REQUIRED", feature };
  }
  const tier = deriveTier(ctx.subscription);
  if (canAccess(feature, tier)) return { ok: true, tier };
  return { ok: false, status: 403, code: "PRO_REQUIRED", feature };
}
