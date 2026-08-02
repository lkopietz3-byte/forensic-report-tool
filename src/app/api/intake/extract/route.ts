import { NextResponse } from "next/server";
import { z } from "zod";
import { extractEvidence, MAX_INPUT_CHARS } from "@/lib/draft/extract";
import { getLiveClientOrNull } from "@/lib/draft/liveClient";
import { isLiveDraftingEnabled } from "@/lib/flags/featureFlags";
import { getCurrentUser } from "@/lib/auth/user";
import { createRateLimiter, aiCircuitBreaker } from "@/lib/http/rateLimit";
import { clientIp, readBoundedJson } from "@/lib/http/request";
import { logError } from "@/lib/log/logger";

export const runtime = "nodejs";

// Segment a pasted document into candidate evidence units the expert then
// confirms. The text is processed transiently to draft a report — never stored
// here (no persistence wired). Honesty: extraction STRUCTURES the expert's own
// document; it never originates facts (see src/lib/draft/extract.ts contract).

const MAX_BODY_BYTES = 80_000; // ~50k chars of text + JSON overhead

const rateLimited = createRateLimiter({ limit: 20, windowMs: 60_000 });

const InputSchema = z.object({
  text: z.string().min(1).max(MAX_INPUT_CHARS),
  sourceLabel: z.string().trim().min(1).max(120),
});

export async function POST(request: Request) {
  // Live extraction calls a paid model, so require a signed-in user — an
  // unauthenticated caller must not be able to burn API tokens. Keyless preview
  // (no live model) is a deterministic, no-cost path, so it stays open.
  if (isLiveDraftingEnabled() && !(await getCurrentUser())) {
    return NextResponse.json({ error: "Sign in to use AI extraction." }, { status: 401 });
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

  try {
    const llm = await getLiveClientOrNull();
    const result = await extractEvidence({
      text: parsed.data.text,
      sourceLabel: parsed.data.sourceLabel,
      llm,
    });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    logError("intake.extract_failed", err);
    return NextResponse.json({ error: "Extraction failed. Please try again." }, { status: 500 });
  }
}
