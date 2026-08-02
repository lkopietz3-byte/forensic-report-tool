import { NextResponse } from "next/server";
import { z } from "zod";
import { AuditLog } from "@/lib/domain/audit";
import { generateDisclosureAppendix } from "@/lib/domain/disclosure";
import { VOCREHAB_TEMPLATE } from "@/lib/domain/template";
import type { EvidenceUnit } from "@/lib/domain/types";
import { draftSection } from "@/lib/draft/section";
import { getLiveClientOrNull } from "@/lib/draft/liveClient";
import { isLiveDraftingEnabled } from "@/lib/flags/featureFlags";
import { getCurrentUser } from "@/lib/auth/user";
import { MAX_UNITS } from "@/lib/draft/extract";
import { createRateLimiter, aiCircuitBreaker } from "@/lib/http/rateLimit";
import { clientIp, readBoundedJson } from "@/lib/http/request";
import { logError } from "@/lib/log/logger";

export const runtime = "nodejs";

// Draft ONE evidence-grounded section from the expert's confirmed evidence set.
// Live mode structures it with a model; keyless preview uses deterministic
// structuring (no AI). Either way the grounding contract is enforced and the
// model call is recorded. Nothing is persisted.

const MAX_BODY_BYTES = 120_000;

// Only evidence-requiring sections can be drafted from pasted evidence; profile
// sections (qualifications/compensation) come from the expert profile, not here.
const DRAFTABLE = new Map(
  VOCREHAB_TEMPLATE.sections
    .filter((s) => s.requiresEvidence)
    .map((s) => [s.key, s] as const),
);

const rateLimited = createRateLimiter({ limit: 20, windowMs: 60_000 });

const UnitSchema = z.object({
  id: z.string().trim().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/),
  content: z.string().trim().min(1).max(2_000),
  location: z.string().trim().min(1).max(160),
});

const InputSchema = z.object({
  sectionKey: z.string().refine((k) => DRAFTABLE.has(k as never), "Unknown or non-draftable section"),
  units: z.array(UnitSchema).min(1).max(MAX_UNITS),
});

export async function POST(request: Request) {
  // Live drafting calls a paid model, so require a signed-in user — an
  // unauthenticated caller must not be able to burn API tokens. Keyless preview
  // (no live model) is a deterministic, no-cost path, so it stays open.
  if (isLiveDraftingEnabled() && !(await getCurrentUser())) {
    return NextResponse.json({ error: "Sign in to use AI drafting." }, { status: 401 });
  }
  if (rateLimited(clientIp(request))) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 },
    );
  }
  if (aiCircuitBreaker("ai")) {
    return NextResponse.json(
      { error: "The service is busy right now. Please try again in a moment." },
      { status: 429 },
    );
  }
  const body = await readBoundedJson(request, MAX_BODY_BYTES);
  if (!body.ok) return body.response;

  const parsed = InputSchema.safeParse(body.value);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // Reject duplicate evidence ids — they would corrupt the closed-world id set
  // and the citation-resolution mapping.
  const ids = parsed.data.units.map((u) => u.id);
  if (new Set(ids).size !== ids.length) {
    return NextResponse.json({ error: "Duplicate evidence ids" }, { status: 400 });
  }

  const section = DRAFTABLE.get(parsed.data.sectionKey as never)!;
  const units: EvidenceUnit[] = parsed.data.units.map((u) => ({
    id: u.id,
    inputId: "intake",
    content: u.content,
    location: u.location,
  }));

  try {
    const llm = await getLiveClientOrNull();
    const audit = new AuditLog();
    const result = await draftSection({
      reportId: "intake-preview",
      section,
      units,
      llm,
      audit,
    });

    // Build the real disclosure record from the append-only audit log this draft
    // just wrote — the same generator a finished report uses, so the demo shows
    // the actual moat, not a mock-up. One section here = one appendix entry.
    const appendix = generateDisclosureAppendix("intake-preview", audit, units);
    const entry = appendix.entries[0] ?? null;

    return NextResponse.json(
      {
        sectionTitle: section.title,
        draftText: result.draftText,
        mode: result.mode,
        model: result.model,
        modelVersion: result.modelVersion,
        fedEvidenceIds: result.fedEvidenceIds,
        citedEvidenceIds: result.grounding.citedEvidenceIds,
        ungroundedFlags: [
          ...result.grounding.ungroundedSentences,
          ...result.grounding.invalidCitationSentences,
        ],
        isClean: result.grounding.isClean,
        disclosure: {
          statement: appendix.statement,
          models: appendix.models,
          integrity: appendix.integrity,
          entry: entry && {
            model: entry.model,
            modelVersion: entry.modelVersion,
            timestamp: entry.timestamp,
            evidenceSources: entry.evidenceSources,
          },
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    logError("draft.section_failed", err);
    return NextResponse.json({ error: "Drafting failed. Please try again." }, { status: 500 });
  }
}
