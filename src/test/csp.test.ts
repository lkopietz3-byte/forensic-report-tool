import { describe, it, expect, afterEach, vi } from "vitest";
import { nonceCsp, staticCsp, isSensitivePath } from "@/lib/security/csp";

/** Pull a single directive (e.g. "script-src") out of a CSP string. */
function directive(csp: string, name: string): string {
  const part = csp.split(";").map((s) => s.trim()).find((s) => s.startsWith(name + " "));
  return part ?? "";
}

afterEach(() => vi.unstubAllEnvs());

describe("CSP script-src hardening", () => {
  it("the nonce variant authorizes the nonce and DROPS 'unsafe-inline' from script-src", () => {
    const csp = nonceCsp("abc123");
    const script = directive(csp, "script-src");
    expect(script).toContain("'nonce-abc123'");
    expect(script).toContain("'self'");
    expect(script).toContain("'wasm-unsafe-eval'"); // OCR still works
    expect(script).not.toContain("'unsafe-inline'");
  });

  it("the static variant keeps 'unsafe-inline' for build-time-rendered pages", () => {
    const script = directive(staticCsp(), "script-src");
    expect(script).toContain("'unsafe-inline'");
    expect(script).toContain("'wasm-unsafe-eval'");
  });

  it("style-src-elem drops 'unsafe-inline' on nonce'd routes but keeps style-src-attr for runtime styles", () => {
    const csp = nonceCsp("xyz");
    const elem = directive(csp, "style-src-elem");
    expect(elem).toContain("'nonce-xyz'");
    expect(elem).not.toContain("'unsafe-inline'"); // injected <style> blocked
    expect(directive(csp, "style-src-attr")).toContain("'unsafe-inline'"); // React style attrs ok
    // Static pages can't nonce, so they retain inline <style> capability.
    expect(directive(staticCsp(), "style-src-elem")).toContain("'unsafe-inline'");
  });

  it("keeps the rest of the lockdown identical across variants", () => {
    for (const csp of [nonceCsp("n"), staticCsp()]) {
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).toContain("base-uri 'self'");
      expect(csp).toContain("worker-src 'self' blob:"); // OCR workers
    }
  });

  it("allows the Supabase origin in connect-src so client-side sign-in works in prod", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abcxyz.supabase.co");
    const connect = directive(nonceCsp("n"), "connect-src");
    expect(connect).toContain("'self'");
    expect(connect).toContain("https://abcxyz.supabase.co");
    expect(connect).toContain("wss://abcxyz.supabase.co"); // realtime
  });

  it("falls back to bare 'self' connect-src when Supabase isn't configured", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    expect(directive(staticCsp(), "connect-src")).toBe("connect-src 'self'");
  });

  it("scopes the nonce policy to the dynamic case-data routes only", () => {
    for (const p of ["/workspace", "/workspace/x", "/intake", "/verify", "/signin", "/auth/callback"]) {
      expect(isSensitivePath(p), p).toBe(true);
    }
    for (const p of ["/", "/sample", "/resources", "/for-experts", "/for-counsel", "/for-firms"]) {
      expect(isSensitivePath(p), p).toBe(false);
    }
  });
});
