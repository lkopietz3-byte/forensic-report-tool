// Generates the static sample disclosure manifests served at /verify so anyone
// can try independent verification without building their own report:
//   public/sample-disclosure-manifest.json          (intact → verifies OK)
//   public/sample-disclosure-manifest-altered.json  (one opinion doctored → fails)
//
// The hashing here MUST mirror src/lib/domain/audit.ts exactly (canonicalJSON +
// SHA-256 over each event minus entryHash). Re-run with:
//   node scripts/gen-sample-manifest.mjs
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";

const GENESIS = "0".repeat(64);

function canonicalJSON(v) {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(canonicalJSON).join(",")}]`;
  const ks = Object.keys(v).sort();
  return `{${ks.map((k) => `${JSON.stringify(k)}:${canonicalJSON(v[k])}`).join(",")}}`;
}
function hashEvent(e) {
  return createHash("sha256").update(canonicalJSON(e), "utf8").digest("hex");
}

// A fictional vocational-rehabilitation / earning-capacity matter (the same
// sample the marketing site uses). Each event is one AI-structured section.
const raw = [
  {
    sectionKey: "scope_of_assignment",
    prompt: "Structure the scope of assignment from the engagement letter [[E:e1]].",
    inputIds: ["e1"],
    output:
      "Counsel retained the expert to evaluate the plaintiff's post-injury earning capacity and vocational options [[E:e1]].",
  },
  {
    sectionKey: "facts_and_data_considered",
    prompt: "Structure the facts considered from the records reviewed [[E:e2]] [[E:e3]].",
    inputIds: ["e2", "e3"],
    output:
      "The expert reviewed the functional capacity evaluation [[E:e2]] and the plaintiff's pre-injury earnings records [[E:e3]].",
  },
  {
    sectionKey: "opinions",
    prompt: "Structure the opinions from the vocational evaluation and labor-market survey [[E:e4]].",
    inputIds: ["e4"],
    output:
      "Within the assessed restrictions, the plaintiff retains capacity for sedentary occupations identified in the labor-market survey [[E:e4]].",
  },
  {
    sectionKey: "bases_and_reasons",
    prompt: "Structure the bases and reasons from the evaluation methodology [[E:e4]] [[E:e2]].",
    inputIds: ["e4", "e2"],
    output:
      "These opinions rest on the documented functional restrictions [[E:e2]] applied to the surveyed local labor market [[E:e4]].",
  },
];

let prevHash = GENESIS;
const events = raw.map((r, i) => {
  const base = {
    id: `evt_sample_${i + 1}`,
    reportId: "sample-alvarez-brightline",
    sectionKey: r.sectionKey,
    prompt: r.prompt,
    model: "claude-sonnet-4-5",
    modelVersion: "claude-sonnet-4-5-20250929",
    inputIds: r.inputIds,
    output: r.output,
    createdAt: `2026-06-18T17:${String(10 + i).padStart(2, "0")}:00.000Z`,
    prevHash,
  };
  const entryHash = hashEvent(base);
  prevHash = entryHash;
  return { ...base, entryHash };
});

const algorithm = {
  hash: "SHA-256",
  canonicalization:
    "Recursive key-sorted JSON over each event with its entryHash field removed, UTF-8 encoded.",
  chain:
    "entryHash = SHA-256(canonicalJSON(event without entryHash)). The first event's prevHash is 64 zeros; each later prevHash equals the previous event's entryHash.",
};

const manifest = {
  format: "disclosed.ai-disclosure-manifest",
  version: 1,
  algorithm,
  report: { matter: "Alvarez v. Brightline (sample)", generatedAt: "2026-06-18T17:14:00.000Z" },
  events,
};

// The altered copy: silently doctor one opinion AFTER the fact, without
// recomputing its hash — exactly the tampering the chain is meant to expose.
const altered = JSON.parse(JSON.stringify(manifest));
altered.report.matter = "Alvarez v. Brightline (sample — altered)";
altered.events[2].output =
  "Within the assessed restrictions, the plaintiff is permanently and totally unemployable [[E:e4]].";

// Self-check: clean must verify; altered must break at the doctored entry (2).
function verify(evts) {
  let expectedPrev = GENESIS;
  for (let i = 0; i < evts.length; i++) {
    const { entryHash, ...b } = evts[i];
    if (evts[i].prevHash !== expectedPrev) return { ok: false, brokenAt: i };
    if (hashEvent(b) !== entryHash) return { ok: false, brokenAt: i };
    expectedPrev = entryHash;
  }
  return { ok: true, brokenAt: -1 };
}
const cleanCheck = verify(manifest.events);
const alteredCheck = verify(altered.events);
if (!cleanCheck.ok) throw new Error("Clean sample failed self-check — generator drifted from audit.ts");
if (alteredCheck.ok || alteredCheck.brokenAt !== 2)
  throw new Error(`Altered sample self-check unexpected: ${JSON.stringify(alteredCheck)}`);

writeFileSync("public/sample-disclosure-manifest.json", JSON.stringify(manifest, null, 2) + "\n");
writeFileSync("public/sample-disclosure-manifest-altered.json", JSON.stringify(altered, null, 2) + "\n");
console.log(`OK — clean verifies, altered breaks at entry ${alteredCheck.brokenAt}. Wrote 2 manifests to public/.`);
