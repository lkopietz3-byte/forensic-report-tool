import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { parseFeedbackInput } from "@/lib/feedback/schema";
import { createRateLimiter } from "@/lib/http/rateLimit";
import { clientIp, readBoundedJson } from "@/lib/http/request";
import { logError } from "@/lib/log/logger";

export const runtime = "nodejs";

// Capture in-app help questions + product feedback. Mirrors the waitlist route's
// posture: rate-limited, body-bounded, honeypot, and Supabase-or-fail-closed
// (a local file fallback only outside production, never PII to disk in prod).
const MAX_BODY_BYTES = 8_192;
const rateLimited = createRateLimiter({ limit: 6, windowMs: 60_000 });

function supabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

type FeedbackRecord = {
  message: string;
  email?: string;
  source?: string;
  page?: string;
  userAgent?: string;
};

async function persistToFile(r: FeedbackRecord) {
  const dir = path.join(process.cwd(), ".data");
  await fs.mkdir(dir, { recursive: true });
  const line =
    JSON.stringify({
      message: r.message,
      email: r.email || null,
      source: r.source ?? null,
      page: r.page ?? null,
      user_agent: r.userAgent ?? null,
      created_at: new Date().toISOString(),
    }) + "\n";
  await fs.appendFile(path.join(dir, "feedback.jsonl"), line, "utf8");
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

  const parsed = parseFeedbackInput(body.value);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // Honeypot tripped — pretend success, persist nothing.
  if (parsed.data.company) {
    return NextResponse.json({ ok: true });
  }

  const { message, email, source, page } = parsed.data;
  const userAgent = (request.headers.get("user-agent") ?? "").slice(0, 400) || undefined;

  try {
    if (supabaseConfigured()) {
      const { createServiceClient } = await import("@/lib/supabase/server");
      const supabase = createServiceClient();
      // Columns come from migration 0011_feedback.sql.
      const { error } = await supabase.from("feedback").insert({
        message,
        email: email || null,
        source: source ?? null,
        page: page ?? null,
        user_agent: userAgent ?? null,
      });
      if (error) throw error;
    } else if (process.env.NODE_ENV !== "production") {
      await persistToFile({ message, email, source, page, userAgent });
    } else {
      throw new Error("feedback storage not configured");
    }
  } catch (err) {
    logError("feedback.persist_failed", err);
    return NextResponse.json(
      { error: "Could not send your note. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
