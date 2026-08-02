import { describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";

// Guards against shipping UNFINISHED or editor-note copy to a user-facing page,
// and against regressing the legal-page completeness. This exists because a real
// regression happened: an AI-generated help page shipped with literal "[VERIFY: …]"
// editor notes and an overclaim in its strings. These tests would have caught it.
//
// Scope: the user-facing app routes (src/app). Like honesty.test.ts, it scans
// CODE + STRING content but NOT comments (a comment may legitimately mention these
// tokens to explain the guard).

const APP = path.join(process.cwd(), "src", "app");

async function collectTsx(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await collectTsx(full)));
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(full);
  }
  return out;
}

function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

// Bracketed editor notes / placeholders that must never reach a shipped page.
// Deliberately specific so it never collides with the product's own legitimate
// bracketed markers ([[E:id]] citations, "[Expert input needed: …]" placeholders).
const FORBIDDEN_PLACEHOLDERS: { pattern: RegExp; why: string }[] = [
  { pattern: /\[VERIFY\b/i, why: "an editor's [VERIFY: …] note must be resolved before shipping" },
  { pattern: /\[(TODO|FIXME|PLACEHOLDER)\b/i, why: "a bracketed editor note must not ship in user-facing copy" },
  { pattern: /\blorem ipsum\b/i, why: "lorem-ipsum filler must not ship" },
  { pattern: /\bTK TK\b|\bTKTK\b/i, why: "a TK placeholder must not ship" },
];

describe("shipping guard — no unfinished/editor-note copy in user-facing pages", () => {
  it("contains no [VERIFY]/TODO/FIXME/placeholder/lorem-ipsum tokens in src/app", async () => {
    const files = await collectTsx(APP);
    const violations: string[] = [];
    for (const file of files) {
      const scannable = stripComments(await fs.readFile(file, "utf8"));
      for (const { pattern, why } of FORBIDDEN_PLACEHOLDERS) {
        const m = scannable.match(pattern);
        if (m) violations.push(`${path.relative(process.cwd(), file)}: "${m[0]}" — ${why}`);
      }
    }
    expect(violations, violations.join("\n")).toEqual([]);
  });
});

describe("shipping guard — privacy notice stays complete", () => {
  it("names every subprocessor it shares data with", async () => {
    const src = await fs.readFile(path.join(APP, "privacy/page.tsx"), "utf8");
    // If a provider is added/removed, this forces the disclosure to be updated
    // rather than silently drifting out of sync (a transparency + CCPA concern).
    for (const provider of ["Vercel", "Supabase", "Stripe", "Anthropic"]) {
      expect(src, `privacy notice must name ${provider} as a subprocessor`).toContain(provider);
    }
  });

  it("has a cookies disclosure and a working contact channel for rights requests", async () => {
    const src = await fs.readFile(path.join(APP, "privacy/page.tsx"), "utf8");
    expect(/cookies/i.test(src), "privacy notice must disclose cookie use").toBe(true);
    expect(/@disclosed\.app/i.test(src), "privacy notice must give a contact email for rights requests").toBe(true);
    expect(/not directed to[\s\S]{0,40}under 18/i.test(src), "privacy notice must carry a children's-data line").toBe(true);
  });

  it("discloses application/feedback fields and standard Anthropic retention", async () => {
    const src = await fs.readFile(path.join(APP, "privacy/page.tsx"), "utf8");
    for (const required of [
      /design-partner application/i,
      /help or feedback messages/i,
      /within 30 days/i,
      /zero-data-retention/i,
      /Business Associate Agreement/i,
      /does not save work-session text/i,
    ]) {
      expect(required.test(src), `privacy notice missing ${required}`).toBe(true);
    }
  });
});

describe("shipping guard — terms keep the load-bearing liability clauses", () => {
  it("allocates preparation + responsibility to the expert and disclaims admissibility/warranty", async () => {
    const src = await fs.readFile(path.join(APP, "terms/page.tsx"), "utf8");
    expect(
      /professional who prepares, adopts, and signs/i.test(src),
      "terms must keep report preparation and signature responsibility with the expert",
    ).toBe(true);
    expect(/limitation of liability/i.test(src), "terms must limit liability").toBe(true);
    expect(/as is/i.test(src), "terms must disclaim warranties (as is)").toBe(true);
    expect(
      /admissibility is determined exclusively by the\s+court/i.test(src),
      "terms must state admissibility is the court's call",
    ).toBe(true);
    expect(/Early-access data boundary/i.test(src), "terms must prohibit real-matter data in preview").toBe(true);
    expect(/Fees and billing/i.test(src), "terms must address charges before checkout is enabled").toBe(true);
    expect(/Indemnity/i.test(src), "terms must include third-party claim allocation").toBe(true);
  });
});

describe("shipping guard — exported drafts do not manufacture privilege", () => {
  it("uses a factual draft legend instead of a work-product legal conclusion", async () => {
    for (const file of ["docx.ts", "pdf.ts"]) {
      const src = await fs.readFile(path.join(process.cwd(), "src", "lib", "export", file), "utf8");
      expect(src).toContain("DRAFT — NOT SIGNED");
      expect(src).not.toMatch(/prepared in anticipation of litigation/i);
    }
  });
});

describe("shipping guard — grounding claims stay within what the checks prove", () => {
  it("does not promise that the model cannot invent or reach outside supplied material", async () => {
    const files = await collectTsx(APP);
    const forbidden = [
      /nothing else may be cited/i,
      /can(?:not|'t|’t) reach past/i,
      /no outside knowledge to reach for/i,
      /unsupported fact can(?:not|'t|’t) reach/i,
      /keep that from ever reaching the page/i,
      /did not originate any facts/i,
    ];
    const violations: string[] = [];
    for (const file of files) {
      const scannable = stripComments(await fs.readFile(file, "utf8"));
      for (const pattern of forbidden) {
        if (pattern.test(scannable)) {
          violations.push(`${path.relative(process.cwd(), file)}: ${pattern}`);
        }
      }
    }
    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("tells users that a valid source marker does not prove semantic support", async () => {
    const [home, workspace, terms] = await Promise.all([
      fs.readFile(path.join(APP, "page.tsx"), "utf8"),
      fs.readFile(path.join(APP, "workspace", "ReportBuilder.tsx"), "utf8"),
      fs.readFile(path.join(APP, "terms", "page.tsx"), "utf8"),
    ]);
    expect(home).toMatch(/verify that\s+each source actually supports/i);
    expect(workspace).toMatch(/not that the source proves it/i);
    expect(terms).toMatch(/does not establish that the source[\s\S]*actually supports/i);
  });
});
