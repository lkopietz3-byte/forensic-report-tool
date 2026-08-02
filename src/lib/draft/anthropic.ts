import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { LLMClient, LLMCompletion } from "./llm.js";

// Production LLM client. Deliberately closed-world: no tools, no web access in
// the drafting path (grounding depends on the model only seeing supplied
// evidence). Uses the commercial Claude API. Disclosed. does not opt into
// training; Anthropic's standard API retention can be up to 30 days, so the UI
// restricts this early-access path to fictional/de-identified material.

export class AnthropicClient implements LLMClient {
  private readonly client: Anthropic;
  private readonly model: string;

  constructor(opts?: { apiKey?: string; model?: string }) {
    const apiKey = opts?.apiKey ?? process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY is not set. Configure it in .env.local (see .env.example).",
      );
    }
    // Bound each call: a drafting completion (max_tokens 4096) returns in a few
    // seconds, so a 30s per-attempt timeout catches a hung connection, and a
    // single retry (down from the SDK default of 2) keeps a transient 429/529
    // from multiplying latency inside the serverless time budget.
    this.client = new Anthropic({ apiKey, timeout: 30_000, maxRetries: 1 });
    this.model = opts?.model ?? process.env.ANTHROPIC_DRAFT_MODEL ?? "claude-sonnet-4-5";
  }

  async complete(args: { system: string; user: string }): Promise<LLMCompletion> {
    const res = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      temperature: 0,
      system: args.system,
      messages: [{ role: "user", content: args.user }],
    });

    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    return { text, model: this.model, modelVersion: res.model };
  }
}
