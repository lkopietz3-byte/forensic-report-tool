import { describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";

// Guardrail: the product's whole value proposition is honesty (see CLAUDE.md).
// This test fails the build if a forbidden overclaim ever lands in source —
// catching the failure mode where well-meaning "make it sound stronger" copy
// quietly violates a rule we cannot break. It scans CODE and STRING content,
// not comments (comments may legitimately discuss why a claim is forbidden,
// e.g. "tamper-evident, not tamper-proof").

const SRC = path.join(process.cwd(), "src");

// Each pattern is a claim that is never acceptable in user-facing text,
// regardless of context. Keep this list conservative and specific so it stays
// a true guardrail, not a nuisance. Paired with a short reason for the failure.
const FORBIDDEN: { pattern: RegExp; why: string }[] = [
  { pattern: /court[\s-]?defensible/i, why: 'we renamed away from "court-defensible"; admissibility is the court\'s call' },
  { pattern: /defensible\s+(ai[\s-]?use\s+)?record/i, why: 'a "defensible … record" implies court-survival; call it an "automatic, tamper-evident record of how AI was used"' },
  { pattern: /defensible\s+(expert\s+)?reports?\b/i, why: '"defensible expert reports" implies admissibility; say "Rule 26(a)(2)(B)-structured" instead ("defensible methodology" is fine)' },
  { pattern: /tamper[\s-]?proof/i, why: 'the audit chain is "tamper-evident", never "tamper-proof"' },
  { pattern: /\bsoc[\s-]?2\b/i, why: "we do not hold a SOC 2 certification" },
  { pattern: /guaranteed?\s+admissib/i, why: "no tool can guarantee admissibility" },
  { pattern: /fully\s+admissible|legally\s+admissible/i, why: "do not assert admissibility as a fact" },
  { pattern: /(we|it|the tool)\s+(draft|write|generate)s?\s+(your\s+)?(opinion|finding|report)/i, why: 'the tool structures the expert\'s own findings; it does not "draft/generate" opinions' },
  { pattern: /never\s+hallucinat/i, why: "do not claim the tool can never hallucinate; claim the closed-world contract instead" },
  { pattern: /100%\s*(accurate|admissible|compliant|reliable)/i, why: "no absolute accuracy/admissibility claims" },
  { pattern: /judge[\s-]?proof|bulletproof\s+(report|opinion|admissib)/i, why: "no invulnerability claims about court outcomes" },
  { pattern: /guarantee[ds]?\s+(your\s+)?(outcome|result|case|win)/i, why: "no outcome guarantees" },
  { pattern: /win\s+your\s+case/i, why: "the tool does not affect case outcomes" },
  { pattern: /\bHIPAA[\s-]?compliant\b/i, why: "we do not assert HIPAA compliance" },
];

// Pages that, by CLAUDE.md, must carry the not-a-law-firm / not-legal-advice
// posture. Their absence is itself an honesty/legality failure.
const REQUIRED_DISCLAIMERS: { file: string; mustMatch: RegExp[] }[] = [
  { file: "app/terms/page.tsx", mustMatch: [/not a law firm/i, /not legal advice/i] },
  { file: "app/disclaimer/page.tsx", mustMatch: [/not a law firm/i, /not legal advice/i] },
  { file: "app/privacy/page.tsx", mustMatch: [/not a law firm/i] },
];

async function collectFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "test") continue; // don't scan the guardrail's own fixtures
      out.push(...(await collectFiles(full)));
    } else if (/\.(ts|tsx)$/.test(e.name)) {
      out.push(full);
    }
  }
  return out;
}

/** Remove block comments and whole-line `//` comments, leaving code + strings. */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

describe("honesty guardrail", () => {
  it("contains no forbidden overclaim phrases in user-facing source", async () => {
    const files = await collectFiles(SRC);
    const violations: string[] = [];

    for (const file of files) {
      const raw = await fs.readFile(file, "utf8");
      const scannable = stripComments(raw);
      for (const { pattern, why } of FORBIDDEN) {
        const m = scannable.match(pattern);
        if (m) {
          const rel = path.relative(process.cwd(), file);
          violations.push(`${rel}: "${m[0]}" — ${why}`);
        }
      }
    }

    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("keeps the not-a-law-firm / not-legal-advice posture on legal pages", async () => {
    for (const { file, mustMatch } of REQUIRED_DISCLAIMERS) {
      const raw = await fs.readFile(path.join(SRC, file), "utf8");
      for (const re of mustMatch) {
        expect(re.test(raw), `${file} is missing required disclaimer ${re}`).toBe(true);
      }
    }
  });

  it("frames the exported deliverable carefully (admissibility is the court's)", async () => {
    for (const file of ["lib/export/docx.ts", "lib/export/pdf.ts"]) {
      const raw = await fs.readFile(path.join(SRC, file), "utf8");
      // The readiness section must disclaim admissibility, and the sample export
      // must mark itself not-for-filing.
      expect(/admissibility[^.]*court/i.test(raw), `${file} missing admissibility disclaimer`).toBe(true);
      expect(/not for filing/i.test(raw), `${file} missing not-for-filing notice`).toBe(true);
    }
  });
});
