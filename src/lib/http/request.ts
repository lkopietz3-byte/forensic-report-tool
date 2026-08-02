import { NextResponse } from "next/server";

// Shared request plumbing for API routes — one implementation of the
// client-IP heuristic and the bounded-JSON-body read that every POST route
// needs. Centralized so the limits and error shapes can't drift apart between
// routes (they previously existed as five hand-copied versions).

/**
 * Best-effort client IP for rate-limiting. Prefers x-real-ip, then the LAST
 * x-forwarded-for hop (the one appended by our own edge, hardest to spoof).
 * Never trusted for auth — only as a rate-limit key.
 */
export function clientIp(request: Request): string {
  const real = request.headers.get("x-real-ip");
  if (real?.trim()) return real.trim();
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) {
    const parts = fwd.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1]!;
  }
  return "unknown";
}

export type BoundedJson =
  | { ok: true; value: unknown }
  | { ok: false; response: NextResponse };

export type BoundedText =
  | { ok: true; value: string }
  | { ok: false; response: NextResponse };

function tooLarge(): BoundedText {
  return {
    ok: false,
    response: NextResponse.json({ error: "Payload too large" }, { status: 413 }),
  };
}

/**
 * Read a request body with a hard BYTE cap. The declared content-length is only
 * an early refusal; the body stream itself is counted because that header may
 * be absent or dishonest. Streaming also prevents an unbounded request from
 * being fully buffered before we notice it is too large.
 */
export async function readBoundedText(
  request: Request,
  maxBytes: number,
): Promise<BoundedText> {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > maxBytes) {
    return tooLarge();
  }

  if (!request.body) return { ok: true, value: "" };

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  const parts: string[] = [];
  let bytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel();
        return tooLarge();
      }
      parts.push(decoder.decode(value, { stream: true }));
    }
    parts.push(decoder.decode());
    return { ok: true, value: parts.join("") };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid request body" }, { status: 400 }),
    };
  }
}

/**
 * Read a JSON body with the same streaming byte cap, then parse it. Returns the
 * parsed value or the exact 413/400 response the route should send.
 */
export async function readBoundedJson(
  request: Request,
  maxBytes: number,
): Promise<BoundedJson> {
  const raw = await readBoundedText(request, maxBytes);
  if (!raw.ok) return raw;
  try {
    return { ok: true, value: JSON.parse(raw.value) };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid JSON" }, { status: 400 }),
    };
  }
}

/**
 * Defense-in-depth for cookie-authenticated mutation routes. SameSite cookies
 * are the primary CSRF control; this also rejects an explicit cross-site browser
 * request or a mismatched Origin. Requests without browser provenance headers
 * remain allowed for trusted server clients and tests.
 */
export function isSameOriginRequest(request: Request): boolean {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
