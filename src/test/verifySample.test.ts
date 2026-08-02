import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { verifyManifestChain, parseManifest } from "@/lib/domain/verifyManifest";

// The /verify page ships two static sample manifests so anyone can try
// independent verification. These tests pin the samples to the live verifier:
// if scripts/gen-sample-manifest.mjs or verifyManifest.ts ever drift, the demo
// would silently lie (a clean record reading "altered", or vice-versa). Catch it.
function load(path: string) {
  return parseManifest(JSON.parse(readFileSync(path, "utf8")));
}

describe("public sample disclosure manifests stay in sync with the verifier", () => {
  it("the clean sample verifies as intact", async () => {
    const m = load("public/sample-disclosure-manifest.json");
    expect(m).not.toBeNull();
    const r = await verifyManifestChain(m!.events);
    expect(r.ok).toBe(true);
    expect(r.count).toBe(4);
  });

  it("the altered sample is detected as tampered at the doctored entry", async () => {
    const m = load("public/sample-disclosure-manifest-altered.json");
    expect(m).not.toBeNull();
    const r = await verifyManifestChain(m!.events);
    expect(r.ok).toBe(false);
    expect(r.brokenAt).toBe(2);
  });
});
