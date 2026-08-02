import { describe, it, expect } from "vitest";
import { parseFeedbackInput } from "../lib/feedback/schema.js";

// The in-app feedback/help capture is attacker-reachable (an open POST), so the
// schema is the hardening boundary: a real message, optional/validated email, a
// slug-only source, a bounded page, and a honeypot the route uses to drop bots.

describe("parseFeedbackInput", () => {
  it("accepts a minimal valid message", () => {
    expect(parseFeedbackInput({ message: "The export button didn't work for me." }).success).toBe(true);
  });

  it("rejects an empty, whitespace-only, or missing message", () => {
    expect(parseFeedbackInput({ message: "" }).success).toBe(false);
    expect(parseFeedbackInput({ message: "   " }).success).toBe(false);
    expect(parseFeedbackInput({}).success).toBe(false);
  });

  it("bounds the message at 4000 characters", () => {
    expect(parseFeedbackInput({ message: "x".repeat(4000) }).success).toBe(true);
    expect(parseFeedbackInput({ message: "x".repeat(4001) }).success).toBe(false);
  });

  it("accepts an empty email (the form sends '' when left blank)", () => {
    expect(parseFeedbackInput({ message: "hi", email: "" }).success).toBe(true);
  });

  it("accepts and normalizes a valid email", () => {
    const r = parseFeedbackInput({ message: "hi", email: "  Expert@Firm.COM " });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("expert@firm.com");
  });

  it("rejects a malformed email", () => {
    expect(parseFeedbackInput({ message: "hi", email: "not-an-email" }).success).toBe(false);
  });

  it("constrains source to a slug charset (blocks log/CSV/SQL injection)", () => {
    expect(parseFeedbackInput({ message: "hi", source: "help-widget" }).success).toBe(true);
    expect(parseFeedbackInput({ message: "hi", source: "a/b_c-1" }).success).toBe(true);
    expect(parseFeedbackInput({ message: "hi", source: "bad source!" }).success).toBe(false);
    expect(parseFeedbackInput({ message: "hi", source: "'; DROP TABLE feedback; --" }).success).toBe(false);
  });

  it("bounds the page path", () => {
    expect(parseFeedbackInput({ message: "hi", page: "/workspace" }).success).toBe(true);
    expect(parseFeedbackInput({ message: "hi", page: "x".repeat(201) }).success).toBe(false);
  });

  it("carries the honeypot field through so the route can detect a bot", () => {
    const r = parseFeedbackInput({ message: "hi", company: "Acme Spam Co" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.company).toBe("Acme Spam Co");
  });
});
