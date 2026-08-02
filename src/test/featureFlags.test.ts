import { afterEach, describe, expect, it, vi } from "vitest";
import { isLiveDraftingEnabled } from "../lib/flags/featureFlags.js";

const FLAG = "NEXT_PUBLIC_FF_LIVE_DRAFTING";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isLiveDraftingEnabled (fail-closed)", () => {
  it("is off when the flag is unset", () => {
    vi.stubEnv(FLAG, "");
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-present");
    expect(isLiveDraftingEnabled()).toBe(false);
  });

  it("is off when the flag is on but the API key is missing (server)", () => {
    vi.stubEnv(FLAG, "1");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    // Node test env => server (no window), so the key prerequisite applies.
    expect(isLiveDraftingEnabled()).toBe(false);
  });

  it("is on only when the flag is set AND the key is present", () => {
    vi.stubEnv(FLAG, "1");
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-present");
    expect(isLiveDraftingEnabled()).toBe(true);
  });

  it("accepts 'true' as well as '1'", () => {
    vi.stubEnv(FLAG, "true");
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-present");
    expect(isLiveDraftingEnabled()).toBe(true);
  });

  it("ignores other truthy-looking values", () => {
    vi.stubEnv(FLAG, "yes");
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-present");
    expect(isLiveDraftingEnabled()).toBe(false);
  });
});
