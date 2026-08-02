import { describe, expect, it } from "vitest";
import { assembleUserReport, type AssembleInput } from "@/lib/report/assemble";
import type { LLMClient } from "@/lib/draft/llm";

// The build→export handoff. On export the client round-trips each section's LIVE
// draft (draftText/draftModel/draftModelVersion) so the deliverable is re-recorded,
// NOT re-drafted. This guards:
//   1. No second paid model call at export.
//   2. The exported text is EXACTLY the build's draft — no drift from what the
//      expert reviewed and signed off on.
//   3. An edited section discloses the AI's original draft but ships the edit.
//   4. Grounding still runs on the ADOPTED text, so a precomputed draft can never
//      bypass the export gate (the one invariant).

class CountingLLM implements LLMClient {
  calls = 0;
  async complete(_args: { system: string; user: string }) {
    this.calls++;
    // A grounded draft citing the only fed id, so the fresh path is clean and each
    // call is distinguishable (the counter proves a re-draft would DIFFER).
    return {
      text: `Structured functional finding number ${this.calls} [[E:E1]].`,
      model: "claude-sonnet-4-5",
      modelVersion: "claude-sonnet-4-5-20250929",
    };
  }
}

const BASE: AssembleInput = {
  meta: { matter: "Doe v. Roe", retainingCounsel: "Smith LLP", expertRole: "Vocational expert" },
  profile: {
    fullName: "Pat Lee, M.S., CRC",
    credentials: "Certified Rehabilitation Counselor",
    publicationsLast10yr: [],
    priorTestimonyLast4yr: [],
    compensationStatement: "$300/hour for review; not contingent on outcome.",
  },
  evidence: [
    { id: "E1", content: "Permanent restriction: no lifting over 25 pounds", location: "Dr. Reyes p.3" },
  ],
  sections: [{ key: "functional_capacity", evidenceIds: ["E1"] }],
};

/** Mirror the client: take a built report and produce the export input carrying
 *  the section's live draft provenance from the build's audit events. */
function exportInputFrom(built: Awaited<ReturnType<typeof assembleUserReport>>, edit?: string): AssembleInput {
  const ev = built.appendix.rawEvents.find((e) => e.sectionKey === "functional_capacity")!;
  return {
    ...BASE,
    sections: [
      {
        key: "functional_capacity",
        evidenceIds: ["E1"],
        ...(edit ? { finalText: edit } : {}),
        draftText: ev.output,
        draftModel: ev.model,
        draftModelVersion: ev.modelVersion,
      },
    ],
  };
}

describe("build→export handoff", () => {
  it("export re-records the build's draft instead of re-drafting (no second model call, no drift)", async () => {
    const llm = new CountingLLM();
    const built = await assembleUserReport(BASE, llm);
    expect(llm.calls).toBe(1);
    const draft = built.sections.find((s) => s.key === "functional_capacity")!.text;

    const exported = await assembleUserReport(exportInputFrom(built), llm);
    // The whole point: export made ZERO new calls.
    expect(llm.calls).toBe(1);
    // And ships EXACTLY the reviewed draft — not "finding number 2".
    expect(exported.sections.find((s) => s.key === "functional_capacity")!.text).toBe(draft);
    expect(exported.appendix.integrity.verified).toBe(true);
  });

  it("an edited section discloses the AI's original draft but ships the expert's edit", async () => {
    const llm = new CountingLLM();
    const built = await assembleUserReport(BASE, llm);
    const originalDraft = built.appendix.rawEvents.find((e) => e.sectionKey === "functional_capacity")!.output;
    const edit = "The expert adopts the 25-pound lifting restriction [[E:E1]].";

    const exported = await assembleUserReport(exportInputFrom(built, edit), llm);
    expect(llm.calls).toBe(1); // no re-draft
    // Ships the edit...
    expect(exported.sections.find((s) => s.key === "functional_capacity")!.text).toBe(edit);
    // ...but the disclosure records the AI's ORIGINAL output (honest: AI drafted X,
    // expert edited to Y — not "AI produced Y").
    const ev = exported.appendix.rawEvents.find((e) => e.sectionKey === "functional_capacity")!;
    expect(ev.output).toBe(originalDraft);
    expect(ev.output).not.toBe(edit);
    expect(exported.appendix.integrity.verified).toBe(true);
  });

  it("a precomputed draft cannot bypass the gate: an ungrounded ghost-cite draft is flagged", async () => {
    const llm = new CountingLLM();
    const exported = await assembleUserReport(
      {
        ...BASE,
        sections: [
          {
            key: "functional_capacity",
            evidenceIds: ["E1"],
            // A crafted draft citing E9 — an id never fed to this section.
            draftText: "The claimant can lift 500 pounds [[E:E9]].",
            draftModel: "claude-sonnet-4-5",
            draftModelVersion: "claude-sonnet-4-5-20250929",
          },
        ],
      },
      llm,
    );
    // Honored the precomputed draft (no model call)...
    expect(llm.calls).toBe(0);
    // ...but grounding runs on the adopted text, so the ghost cite is caught and
    // the export gate (non-profile && !isClean) trips.
    const fc = exported.sections.find((s) => s.key === "functional_capacity")!;
    expect(fc.grounding.isClean).toBe(false);
    expect(fc.grounding.invalidCitationSentences.length).toBeGreaterThan(0);
  });

  it("a forged precomputed draft claiming the no-AI structurer is rejected and re-drafted (no false 'no AI' disclosure)", async () => {
    const llm = new CountingLLM();
    const exported = await assembleUserReport(
      {
        ...BASE,
        sections: [
          {
            key: "functional_capacity",
            evidenceIds: ["E1"],
            // A forged payload: AI-authored text stamped as the deterministic
            // structurer, which would otherwise force a FALSE "no generative AI"
            // disclosure over model-written prose.
            draftText: "Structured functional finding [[E:E1]].",
            draftModel: "deterministic-structurer",
            draftModelVersion: "no-ai-v1",
          },
        ],
      },
      llm,
    );
    // The forgery is not honored: the live model is actually called...
    expect(llm.calls).toBe(1);
    const ev = exported.appendix.rawEvents.find((e) => e.sectionKey === "functional_capacity")!;
    // ...and the recorded model reflects reality (live), not the claimed structurer.
    expect(ev.model).toBe("claude-sonnet-4-5");
    expect(ev.model).not.toBe("deterministic-structurer");
    // So the disclosure honestly reports AI was used.
    expect(exported.appendix.statement).not.toMatch(/no generative ai/i);
  });

  it("the deterministic (no-AI) path ignores any precomputed draft and re-runs identically", async () => {
    // No llm: even if a draft is supplied, the free deterministic structurer runs —
    // there is nothing to preserve and its output is the expert's own evidence.
    const exported = await assembleUserReport({
      ...BASE,
      sections: [
        {
          key: "functional_capacity",
          evidenceIds: ["E1"],
          draftText: "Ignored precomputed draft [[E:E1]].",
          draftModel: "claude-sonnet-4-5",
          draftModelVersion: "claude-sonnet-4-5-20250929",
        },
      ],
    });
    const fc = exported.sections.find((s) => s.key === "functional_capacity")!;
    expect(fc.text).not.toContain("Ignored precomputed draft");
    expect(fc.grounding.isClean).toBe(true);
    // Disclosed honestly as no-AI.
    const ev = exported.appendix.rawEvents.find((e) => e.sectionKey === "functional_capacity")!;
    expect(ev.model).toBe("deterministic-structurer");
  });
});
