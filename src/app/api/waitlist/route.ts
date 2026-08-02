import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { designPartnerQualityIssue, parseWaitlistInput } from "@/lib/waitlist/schema";
import {
  isDesignPartnerSource,
  mergeWaitlistRecord,
  type IncomingWaitlistRecord,
  type WaitlistRecord,
} from "@/lib/waitlist/merge";
import { createRateLimiter } from "@/lib/http/rateLimit";
import { clientIp, readBoundedJson } from "@/lib/http/request";
import { log, logError } from "@/lib/log/logger";

export const runtime = "nodejs";

// Three discovery answers may each contain up to 1,000 characters. Keep the
// transport limit aligned with the schema so thoughtful applications do not
// fail with a mysterious 413 after the client accepted them.
const MAX_BODY_BYTES = 8_192;

// Per-instance abuse speed-bump (see rateLimit.ts for the cross-instance caveat).
const rateLimited = createRateLimiter({ limit: 5, windowMs: 60_000 });

function supabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

async function persistToFile(r: IncomingWaitlistRecord) {
  const dir = path.join(process.cwd(), ".data");
  await fs.mkdir(dir, { recursive: true });
  const line =
    JSON.stringify({
      email: r.email,
      discipline: r.discipline ?? null,
      source: r.source ?? null,
      role: r.role ?? null,
      reports_per_year: r.reportsPerYear ?? null,
      pain_point: r.painPoint ?? null,
      ai_experience: r.aiExperience ?? null,
      must_have: r.mustHave ?? null,
      notes: r.notes ?? null,
      created_at: new Date().toISOString(),
    }) + "\n";
  await fs.appendFile(path.join(dir, "waitlist.jsonl"), line, "utf8");
}

export async function POST(request: Request) {
  if (rateLimited(clientIp(request))) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 },
    );
  }

  const body = await readBoundedJson(request, MAX_BODY_BYTES);
  if (!body.ok) return body.response;

  const parsed = parseWaitlistInput(body.value);
  if (!parsed.success) {
    // Do not echo field-level issues: that leaks the honeypot field name and
    // internal schema shape to bots probing the endpoint.
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // Honeypot tripped — pretend success, persist nothing.
  if (parsed.data.company) {
    return NextResponse.json({ ok: true });
  }

  // Design-partner applications must clear a quality bar (a free slot is earned,
  // not auto-granted). The plain waitlist signup is exempt.
  const qualityIssue = designPartnerQualityIssue(parsed.data);
  if (qualityIssue) {
    return NextResponse.json({ error: qualityIssue }, { status: 422 });
  }

  const {
    email,
    discipline,
    source,
    role,
    reportsPerYear,
    painPoint,
    aiExperience,
    mustHave,
    notes,
  } = parsed.data;

  try {
    if (supabaseConfigured()) {
      const { createServiceClient } = await import("@/lib/supabase/server");
      const supabase = createServiceClient();
      // A lightweight signup may already exist for this email. Read and merge
      // before upsert so a full application upgrades it and a later short form
      // cannot erase the richer answers.
      const { data: existing, error: readError } = await supabase
        .from("waitlist")
        .select(
          "email, discipline, source, role, reports_per_year, pain_point, ai_experience, must_have, notes",
        )
        .eq("email", email)
        .maybeSingle();
      if (readError) throw readError;

      const merged = mergeWaitlistRecord(
        existing as Partial<WaitlistRecord> | null,
        {
          email,
          discipline,
          source,
          role,
          reportsPerYear,
          painPoint,
          aiExperience,
          mustHave,
          notes,
        },
      );

      const { error } = await supabase
        .from("waitlist")
        .upsert(merged, { onConflict: "email" });
      if (error) throw error;

      log.info("waitlist.persisted", {
        source: merged.source,
        discipline: merged.discipline,
        application: isDesignPartnerSource(source),
        upgradedExisting: Boolean(existing && isDesignPartnerSource(source)),
      });
    } else if (process.env.NODE_ENV !== "production") {
      // File fallback is a local-dev convenience only. In production without
      // Supabase configured we fail closed rather than write PII to disk.
      await persistToFile({
        email,
        discipline,
        source,
        role,
        reportsPerYear,
        painPoint,
        aiExperience,
        mustHave,
        notes,
      });
    } else {
      throw new Error("waitlist storage not configured");
    }
  } catch (err) {
    logError("waitlist.persist_failed", err);
    return NextResponse.json(
      { error: "Could not save your request. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
