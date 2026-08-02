import { afterEach, describe, expect, it, vi } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import { safeInternalPath } from "@/lib/http/redirect";
import { GET as healthCheck } from "@/app/api/health/route";
import { SITE_URL, publicSiteUrl } from "@/lib/site";

afterEach(() => vi.unstubAllEnvs());

describe("safeInternalPath", () => {
  it("preserves a normal local path, query, and hash", () => {
    expect(safeInternalPath("/workspace?report=1#preview")).toBe(
      "/workspace?report=1#preview",
    );
  });

  it("rejects absolute, scheme-relative, backslash, and control-character redirects", () => {
    for (const unsafe of [
      "https://evil.example",
      "//evil.example",
      "/\\evil.example",
      "/\nevil.example",
      "javascript:alert(1)",
    ]) {
      expect(safeInternalPath(unsafe), unsafe).toBe("/workspace");
    }
  });

  it("uses the caller's fallback for empty or malformed values", () => {
    expect(safeInternalPath(null, "/")).toBe("/");
    expect(safeInternalPath("not-a-path", "/signin")).toBe("/signin");
  });
});

describe("configured public return URLs", () => {
  it("builds checkout/portal destinations on the configured site origin", () => {
    const url = new URL(publicSiteUrl("/workspace?purchased=5"));
    expect(url.origin).toBe(new URL(SITE_URL).origin);
    expect(url.pathname).toBe("/workspace");
    expect(url.searchParams.get("purchased")).toBe("5");
  });

  it("refuses a scheme-relative return destination", () => {
    expect(() => publicSiteUrl("//evil.example/checkout")).toThrow(
      /remain on the site origin/i,
    );
  });
});

describe("public capture-table lockdown migration", () => {
  it("drops direct public policies and revokes anon/authenticated table access", async () => {
    const sql = await fs.readFile(
      path.join(
        process.cwd(),
        "supabase",
        "migrations",
        "0014_lock_public_capture_tables.sql",
      ),
      "utf8",
    );
    expect(sql).toMatch(/drop policy if exists "public waitlist signup"/i);
    expect(sql).toMatch(/drop policy if exists "public feedback submit"/i);
    expect(sql).toMatch(/revoke all on table public\.waitlist from anon, authenticated/i);
    expect(sql).toMatch(/revoke all on table public\.feedback from anon, authenticated/i);
    expect(sql).not.toMatch(/create policy/i);
  });
});

describe("saved-report deletion contract", () => {
  it("uses same-origin + explicit owner checks and cascades through the case", async () => {
    const route = await fs.readFile(
      path.join(process.cwd(), "src", "app", "api", "report", "[id]", "route.ts"),
      "utf8",
    );
    expect(route).toMatch(/export async function DELETE/);
    expect(route).toMatch(/isSameOriginRequest\(request\)/);
    expect(route).toMatch(/owner_id !== user\.id/);
    expect(route).toMatch(/from\("cases"\)[\s\S]*\.delete\(\)/);
  });

  it("requires an irreversible-action confirmation in the workspace", async () => {
    const ui = await fs.readFile(
      path.join(process.cwd(), "src", "app", "workspace", "ReportBuilder.tsx"),
      "utf8",
    );
    expect(ui).toMatch(/window\.confirm/);
    expect(ui).toMatch(/This cannot be undone/);
    expect(ui).toMatch(/method: "DELETE"/);
  });
});

describe("deep health-check secret handling", () => {
  it("never accepts a secret in the query string", async () => {
    vi.stubEnv("HEALTH_CHECK_TOKEN", "test-health-secret");
    const response = healthCheck(
      new Request(
        "https://disclosed.app/api/health?deep=1&token=test-health-secret",
      ),
    );
    const body = await response.json();
    expect(body.env).toBeUndefined();
  });

  it("accepts the deep-check secret only in its dedicated header", async () => {
    vi.stubEnv("HEALTH_CHECK_TOKEN", "test-health-secret");
    const response = healthCheck(
      new Request("https://disclosed.app/api/health?deep=1", {
        headers: { "x-health-token": "test-health-secret" },
      }),
    );
    const body = await response.json();
    expect(body.env).toBeDefined();
  });
});

describe("pricing implementation matches the public offer", () => {
  it("does not leave a hidden unlimited-subscription checkout reachable", async () => {
    const checkout = await fs.readFile(
      path.join(process.cwd(), "src", "app", "api", "billing", "checkout", "route.ts"),
      "utf8",
    );
    expect(checkout).not.toMatch(/plan === "pro"/);
    expect(checkout).not.toMatch(/mode: "subscription"/);
    expect(checkout).not.toMatch(/proPriceId/);

    const workspace = await fs.readFile(
      path.join(process.cwd(), "src", "app", "workspace", "page.tsx"),
      "utf8",
    );
    expect(workspace).not.toMatch(/buy === "pro"/);
  });
});

describe("sensitive-route cache controls", () => {
  it("explicitly prevents browser and edge caching on case-data and auth routes", async () => {
    const config = await fs.readFile(
      path.join(process.cwd(), "next.config.mjs"),
      "utf8",
    );
    for (const route of [
      "/workspace",
      "/intake",
      "/verify",
      "/signin",
      "/auth/(.*)",
      "/api/intake/(.*)",
      "/api/draft/(.*)",
      "/api/report/(.*)",
      "/api/(.*)",
    ]) {
      expect(config, `missing no-store rule for ${route}`).toContain(
        `source: "${route}"`,
      );
    }
    expect(config.match(/no-store, max-age=0/g)?.length).toBeGreaterThanOrEqual(8);
    expect(config).toMatch(/poweredByHeader:\s*false/);
  });
});

describe("exported expert certification", () => {
  it("states preparation, review, adoption, and responsibility without inventing an authorship label", async () => {
    for (const file of ["docx.ts", "pdf.ts"]) {
      const source = await fs.readFile(
        path.join(process.cwd(), "src", "lib", "export", file),
        "utf8",
      );
      expect(source).toMatch(/I prepared this report/);
      expect(source).toMatch(/reviewed and adopted|reviewed and adopt/);
      expect(source).toMatch(/remain responsible/);
      expect(source).not.toMatch(/author of record/i);
    }
  });
});
