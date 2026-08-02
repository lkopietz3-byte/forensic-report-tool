// Fail-closed feature flags. The single source of truth for whether a guarded
// capability is live. Resolution rule for every flag: DEFAULT OFF. A flag is on
// only when explicitly enabled AND its prerequisites are present. This keeps the
// keyless preview safe with zero config and makes "is it on?" answerable in one
// place — flip it off here and the whole path reverts.
//
// HONESTY / INVARIANT NOTE: the live-drafting flag only enables the model-backed
// path that STRUCTURES the expert's own supplied evidence. It must NEVER be
// repurposed to route to a prompt that lets the model originate a fact, number,
// or citation (see CLAUDE.md, "the one invariant that cannot break"). Enabling
// the flag changes *who renders* the structuring, not *what may be originated*.

export const FLAGS = {
  LIVE_DRAFTING: "NEXT_PUBLIC_FF_LIVE_DRAFTING",
  BILLING_ENFORCED: "NEXT_PUBLIC_FF_BILLING",
} as const;

function envOn(value: string | undefined): boolean {
  return value === "1" || value === "true";
}

/**
 * Whether Pro entitlements are enforced on deliverable routes (export, full
 * appendix). Default OFF: until Stripe is wired and a real subscription can
 * exist, enforcing would lock every (free) user out of their own export and
 * break the core demo. With the flag off, those routes stay open; the
 * server-gate code path is still present and unit-tested, ready to switch on
 * the moment billing lands.
 */
export function isBillingEnforced(): boolean {
  try {
    return envOn(process.env[FLAGS.BILLING_ENFORCED]);
  } catch {
    return false;
  }
}

/**
 * Whether the live, model-backed drafting path is enabled.
 *
 * Off unless `NEXT_PUBLIC_FF_LIVE_DRAFTING` is set to "1"/"true". On the server
 * it additionally requires `ANTHROPIC_API_KEY`, so flipping the flag without a
 * key cannot half-enable the path — it stays in safe sample/preview mode.
 * Wrapped so a thrown env access can never leave the path accidentally on.
 */
export function isLiveDraftingEnabled(): boolean {
  try {
    if (!envOn(process.env[FLAGS.LIVE_DRAFTING])) return false;
    // Server-only prerequisite. On the client `process.env.ANTHROPIC_API_KEY`
    // is undefined (never inlined), so this correctly gates client UI off until
    // a server confirms the key exists.
    const isServer = typeof window === "undefined";
    if (isServer && !process.env.ANTHROPIC_API_KEY?.trim()) return false;
    return true;
  } catch {
    return false;
  }
}
