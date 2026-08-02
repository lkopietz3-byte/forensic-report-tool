// Best-effort, in-memory rate limiter for API routes.
//
// SCALE CAVEAT (by design): this is PER-INSTANCE. On serverless (Vercel) each
// isolate keeps its own counters, so the effective limit is roughly
// limit × (warm instances) and resets on cold start. It is an abuse speed-bump,
// NOT a global control. For a true cross-instance limit, back it with Redis /
// Vercel KV. Entries are pruned when the map grows large so it can't leak memory
// (an IP seen once would otherwise linger forever).

interface Entry {
  count: number;
  resetAt: number;
}

export function createRateLimiter(opts: {
  limit: number;
  windowMs: number;
  maxKeys?: number;
}) {
  const { limit, windowMs, maxKeys = 10_000 } = opts;
  const hits = new Map<string, Entry>();

  return function rateLimited(key: string): boolean {
    const now = Date.now();
    // Bound memory: when the map grows past the cap, drop expired entries.
    if (hits.size > maxKeys) {
      for (const [k, e] of hits) {
        if (e.resetAt <= now) hits.delete(k);
      }
    }
    const e = hits.get(key);
    if (!e || now > e.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return false;
    }
    e.count += 1;
    return e.count > limit;
  };
}

// A per-instance circuit breaker shared across the AI-backed routes (intake
// extraction, report build, section draft). It caps TOTAL model-backed requests
// per minute on this instance regardless of source IP, so a flood — even one that
// rotates IPs to defeat the per-IP limiter — can't run an unbounded model bill
// before the durable cross-instance limit (Redis / Vercel KV, see the caveat
// above) is in place. Defense-in-depth, not a substitute for that durable limit.
export const aiCircuitBreaker = createRateLimiter({ limit: 120, windowMs: 60_000 });
