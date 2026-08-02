import { describe, it, expect, beforeEach, vi } from "vitest";

// env.ts is the secret/public boundary: server secrets must never resolve from a
// NEXT_PUBLIC_ key, validation must be LAZY (keyless preview mode can't fail at
// import), and the presence view must never leak a value. resetModules per test
// clears the module-level success cache so each case starts clean.
describe("env — lazy, split server/public validation", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("getServerEnv throws ONE aggregated error naming the missing vars", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    const { getServerEnv } = await import("@/lib/env");
    expect(() => getServerEnv()).toThrow(/Invalid server environment/);
    try {
      getServerEnv();
    } catch (e) {
      const msg = (e as Error).message;
      expect(msg).toContain("ANTHROPIC_API_KEY");
      expect(msg).toContain("SUPABASE_SERVICE_ROLE_KEY");
    }
  });

  it("getServerEnv parses a valid env", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-test");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "svc-role");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proj.supabase.co");
    const { getServerEnv } = await import("@/lib/env");
    expect(getServerEnv().ANTHROPIC_API_KEY).toBe("sk-test");
  });

  it("getServerEnv defaults ANTHROPIC_DRAFT_MODEL when it is unset", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "sk");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "svc");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proj.supabase.co");
    const saved = process.env.ANTHROPIC_DRAFT_MODEL;
    delete process.env.ANTHROPIC_DRAFT_MODEL; // .default() only applies to undefined, not ""
    try {
      const { getServerEnv } = await import("@/lib/env");
      expect(getServerEnv().ANTHROPIC_DRAFT_MODEL).toBe("claude-sonnet-4-5");
    } finally {
      if (saved !== undefined) process.env.ANTHROPIC_DRAFT_MODEL = saved;
    }
  });

  it("getServerEnv caches: a later env change does not change the result", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-1");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "svc");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proj.supabase.co");
    const { getServerEnv } = await import("@/lib/env");
    const first = getServerEnv();
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-2");
    expect(getServerEnv().ANTHROPIC_API_KEY).toBe("sk-1");
    expect(getServerEnv()).toBe(first);
  });

  it("getPublicEnv requires the public Supabase url + anon key", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    const { getPublicEnv } = await import("@/lib/env");
    expect(() => getPublicEnv()).toThrow();
  });

  it("getPublicEnv returns the public pair when set", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proj.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-123");
    const { getPublicEnv } = await import("@/lib/env");
    expect(getPublicEnv().NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe("anon-123");
  });

  it("envPresence reports booleans only — never values — and treats whitespace as unset", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-secret-value");
    vi.stubEnv("STRIPE_SECRET_KEY", "   "); // whitespace-only counts as unset
    const { envPresence } = await import("@/lib/env");
    const p = envPresence();
    expect(p.ANTHROPIC_API_KEY).toBe(true);
    expect(p.STRIPE_SECRET_KEY).toBe(false);
    for (const v of Object.values(p)) expect(typeof v).toBe("boolean");
    // The actual secret value must never appear in the presence output.
    expect(JSON.stringify(p)).not.toContain("sk-secret-value");
  });
});
