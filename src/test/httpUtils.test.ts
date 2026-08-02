import { describe, it, expect, vi, afterEach } from "vitest";
import { createRateLimiter } from "@/lib/http/rateLimit";
import {
  clientIp,
  isSameOriginRequest,
  readBoundedJson,
  readBoundedText,
} from "@/lib/http/request";
import { log, logError } from "@/lib/log/logger";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("createRateLimiter", () => {
  it("allows up to the limit, then refuses, then resets after the window", () => {
    vi.useFakeTimers();
    const limited = createRateLimiter({ limit: 3, windowMs: 1_000 });
    expect(limited("ip")).toBe(false);
    expect(limited("ip")).toBe(false);
    expect(limited("ip")).toBe(false);
    expect(limited("ip")).toBe(true); // 4th in window refused
    vi.advanceTimersByTime(1_001);
    expect(limited("ip")).toBe(false); // window reset
  });

  it("tracks keys independently", () => {
    const limited = createRateLimiter({ limit: 1, windowMs: 60_000 });
    expect(limited("a")).toBe(false);
    expect(limited("a")).toBe(true);
    expect(limited("b")).toBe(false); // unaffected by a's count
  });
});

describe("clientIp", () => {
  it("prefers x-real-ip, then the LAST x-forwarded-for hop (spoof-resistant)", () => {
    expect(clientIp(new Request("http://x", { headers: { "x-real-ip": "1.2.3.4" } }))).toBe("1.2.3.4");
    expect(
      clientIp(new Request("http://x", { headers: { "x-forwarded-for": "6.6.6.6, 10.0.0.1" } })),
    ).toBe("10.0.0.1"); // attacker-controlled FIRST entry is ignored
    expect(clientIp(new Request("http://x"))).toBe("unknown");
  });
});

describe("readBoundedJson", () => {
  const post = (body: string, headers: Record<string, string> = {}) =>
    new Request("http://x", { method: "POST", body, headers });

  it("parses a valid body within bounds", async () => {
    const r = await readBoundedJson(post(JSON.stringify({ a: 1 })), 1_000);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toEqual({ a: 1 });
  });

  it("refuses an oversized body even when content-length lies", async () => {
    const big = JSON.stringify({ a: "x".repeat(2_000) });
    const r = await readBoundedJson(post(big, { "content-length": "10" }), 100);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.response.status).toBe(413);
  });

  it("counts UTF-8 bytes, not JavaScript characters", async () => {
    // Each emoji is four UTF-8 bytes but only two JS code units.
    const body = JSON.stringify({ a: "😀".repeat(20) });
    const r = await readBoundedJson(post(body, { "content-length": "1" }), 60);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.response.status).toBe(413);
  });

  it("stops a streamed body at the byte limit without trusting content-length", async () => {
    const encoder = new TextEncoder();
    let pulled = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulled += 1;
        controller.enqueue(encoder.encode("x".repeat(40)));
        if (pulled === 20) controller.close();
      },
    });
    const request = new Request("http://x", {
      method: "POST",
      body: stream,
      duplex: "half",
      headers: { "content-length": "2" },
    } as RequestInit & { duplex: "half" });
    const r = await readBoundedText(request, 100);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.response.status).toBe(413);
    expect(pulled).toBeLessThan(20);
  });

  it("returns 400 for malformed JSON", async () => {
    const r = await readBoundedJson(post("{nope"), 1_000);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.response.status).toBe(400);
  });
});

describe("same-origin mutation guard", () => {
  it("accepts same-origin browser requests", () => {
    const r = new Request("https://disclosed.app/api/report/save", {
      headers: {
        origin: "https://disclosed.app",
        "sec-fetch-site": "same-origin",
      },
    });
    expect(isSameOriginRequest(r)).toBe(true);
  });

  it("rejects a mismatched Origin and explicit cross-site provenance", () => {
    expect(
      isSameOriginRequest(
        new Request("https://disclosed.app/api/report/save", {
          headers: { origin: "https://evil.example" },
        }),
      ),
    ).toBe(false);
    expect(
      isSameOriginRequest(
        new Request("https://disclosed.app/api/report/save", {
          headers: { "sec-fetch-site": "cross-site" },
        }),
      ),
    ).toBe(false);
  });

  it("allows a headerless trusted server/test request", () => {
    expect(isSameOriginRequest(new Request("https://disclosed.app/api/report/save"))).toBe(true);
  });
});

describe("structured logger", () => {
  it("emits one JSON line, redacts sensitive keys, truncates huge values", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    log.error("test.event", { email: "a@b.com", token: "secret", note: "y".repeat(600) });
    expect(spy).toHaveBeenCalledTimes(1);
    const line = JSON.parse(spy.mock.calls[0]![0] as string);
    expect(line.level).toBe("error");
    expect(line.event).toBe("test.event");
    expect(line.email).toBe("[redacted]");
    expect(line.token).toBe("[redacted]");
    expect((line.note as string).length).toBeLessThan(600);
    expect(line.note).toContain("[truncated]");
  });

  it("logError normalizes Error objects into a message field", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logError("test.fail", new Error("boom"));
    const line = JSON.parse(spy.mock.calls[0]![0] as string);
    expect(line.err).toBe("boom");
  });
});
