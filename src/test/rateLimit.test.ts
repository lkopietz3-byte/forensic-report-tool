import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRateLimiter, aiCircuitBreaker } from "@/lib/http/rateLimit";

// The per-IP limiter and the shared AI circuit breaker are the app's abuse
// guards (a flood that rotates IPs still hits the breaker). rateLimited(key)
// returns TRUE when the caller is OVER the limit and should be refused.
describe("createRateLimiter", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("allows exactly `limit` requests in a window, then blocks", () => {
    vi.setSystemTime(0);
    const limited = createRateLimiter({ limit: 3, windowMs: 1000 });
    expect(limited("ip")).toBe(false); // 1
    expect(limited("ip")).toBe(false); // 2
    expect(limited("ip")).toBe(false); // 3
    expect(limited("ip")).toBe(true); // 4 → over limit
    expect(limited("ip")).toBe(true); // stays blocked within the window
  });

  it("resets once the window elapses", () => {
    vi.setSystemTime(0);
    const limited = createRateLimiter({ limit: 1, windowMs: 1000 });
    expect(limited("ip")).toBe(false);
    expect(limited("ip")).toBe(true);
    vi.setSystemTime(1001); // past resetAt
    expect(limited("ip")).toBe(false); // fresh window → allowed
  });

  it("isolates keys — one IP's flood does not block another", () => {
    vi.setSystemTime(0);
    const limited = createRateLimiter({ limit: 1, windowMs: 1000 });
    expect(limited("a")).toBe(false);
    expect(limited("a")).toBe(true); // a is blocked
    expect(limited("b")).toBe(false); // b is independent
  });

  it("keeps enforcing limits across many distinct keys", () => {
    vi.setSystemTime(0);
    const limited = createRateLimiter({ limit: 1, windowMs: 1000, maxKeys: 4 });
    for (let i = 0; i < 50; i++) expect(limited(`k${i}`)).toBe(false); // each first hit allowed
    expect(limited("k49")).toBe(true); // a repeat within the window is still blocked
  });
});

describe("aiCircuitBreaker — shared model-route flood guard", () => {
  afterEach(() => vi.useRealTimers());

  it("allows the first call and caps a sustained flood within the window", () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    expect(aiCircuitBreaker("ai")).toBe(false); // first call allowed
    let blocked = false;
    for (let i = 0; i < 1000; i++) {
      if (aiCircuitBreaker("ai")) {
        blocked = true;
        break;
      }
    }
    expect(blocked).toBe(true); // an IP-rotating flood is still capped globally
  });
});
