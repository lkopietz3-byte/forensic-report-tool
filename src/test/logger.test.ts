import { describe, it, expect, vi, afterEach } from "vitest";
import { log, logError } from "@/lib/log/logger";

// The logger is the one place case content or secrets could leak into a drain.
// These pin the denylist redaction, value truncation, and the Error→message
// normalization so a future edit can't quietly start logging raw PII.
function capture(method: "log" | "warn" | "error") {
  return vi.spyOn(console, method).mockImplementation(() => {});
}
afterEach(() => vi.restoreAllMocks());

describe("structured logger", () => {
  it("emits a single JSON line carrying level + event + fields", () => {
    const spy = capture("log");
    log.info("user.signed_in", { userId: "u1" });
    expect(spy).toHaveBeenCalledTimes(1);
    const obj = JSON.parse(spy.mock.calls[0]![0] as string);
    expect(obj).toMatchObject({ level: "info", event: "user.signed_in", userId: "u1" });
  });

  it("redacts denylisted fields case-insensitively", () => {
    const spy = capture("log");
    log.info("evt", {
      password: "p",
      Token: "t",
      AUTHORIZATION: "a",
      email: "x@y.com",
      stripe_customer_id: "cus_123",
      userId: "u1",
    });
    const obj = JSON.parse(spy.mock.calls[0]![0] as string);
    expect(obj.password).toBe("[redacted]");
    expect(obj.Token).toBe("[redacted]");
    expect(obj.AUTHORIZATION).toBe("[redacted]");
    expect(obj.email).toBe("[redacted]");
    expect(obj.stripe_customer_id).toBe("[redacted]");
    expect(obj.userId).toBe("u1"); // non-sensitive identifiers pass through
  });

  it("redacts sensitive keys recursively through objects and arrays", () => {
    const spy = capture("log");
    log.info("evt", {
      nested: {
        user: { email: "person@example.com" },
        rows: [{ prompt: "private case prompt" }, { access_token: "abc" }],
      },
    });
    const obj = JSON.parse(spy.mock.calls[0]![0] as string);
    expect(obj.nested.user.email).toBe("[redacted]");
    expect(obj.nested.rows[0].prompt).toBe("[redacted]");
    expect(obj.nested.rows[1].access_token).toBe("[redacted]");
  });

  it("scrubs emails, bearer credentials, API secrets, and token query values inside error strings", () => {
    const spy = capture("error");
    logError(
      "provider.failed",
      new Error(
        "user person@example.com Bearer abc.def sk_abcdefghijk https://x.test/?token=very-secret",
      ),
    );
    const obj = JSON.parse(spy.mock.calls[0]![0] as string);
    expect(obj.err).not.toContain("person@example.com");
    expect(obj.err).not.toContain("abc.def");
    expect(obj.err).not.toContain("sk_abcdefghijk");
    expect(obj.err).not.toContain("very-secret");
  });

  it("truncates oversized string values so case content can't leak wholesale", () => {
    const spy = capture("warn");
    log.warn("big", { blob: "x".repeat(600) });
    const obj = JSON.parse(spy.mock.calls[0]![0] as string);
    expect((obj.blob as string).length).toBeLessThan(600);
    expect(obj.blob).toMatch(/\[truncated\]$/);
  });

  it("routes each level to the right console method", () => {
    const e = capture("error");
    const w = capture("warn");
    const l = capture("log");
    log.error("e");
    log.warn("w");
    log.info("i");
    log.debug("d");
    expect(e).toHaveBeenCalledTimes(1);
    expect(w).toHaveBeenCalledTimes(1);
    expect(l).toHaveBeenCalledTimes(2); // info + debug both use console.log
  });

  it("logError normalizes an Error to its message and keeps extra fields", () => {
    const spy = capture("error");
    logError("op.failed", new Error("boom"), { userId: "u1" });
    const obj = JSON.parse(spy.mock.calls[0]![0] as string);
    expect(obj).toMatchObject({ level: "error", event: "op.failed", err: "boom", userId: "u1" });
  });

  it("logError stringifies a non-Error throw", () => {
    const spy = capture("error");
    logError("op.failed", "plain string");
    const obj = JSON.parse(spy.mock.calls[0]![0] as string);
    expect(obj.err).toBe("plain string");
  });

  it("serializes circular fields safely without dropping the whole event", () => {
    const spy = capture("log");
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    log.info("evt", circular);
    const obj = JSON.parse(spy.mock.calls[0]![0] as string);
    expect(obj.self.self).toBe("[circular]");
  });
});
