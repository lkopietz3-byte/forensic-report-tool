import "server-only";
import { isLiveDraftingEnabled } from "../flags/featureFlags";
import type { LLMClient } from "./llm.js";

// Resolve the model-backed client for the structuring path, or null to fall back
// to deterministic (no-AI) handling. Returns null unless the LIVE_DRAFTING flag
// is on AND a key is present (isLiveDraftingEnabled enforces both server-side),
// so keyless preview always stays in the safe deterministic mode. The Anthropic
// SDK is imported lazily so keyless deployments never load it.
export async function getLiveClientOrNull(): Promise<LLMClient | null> {
  if (!isLiveDraftingEnabled()) return null;
  try {
    const { AnthropicClient } = await import("./anthropic");
    return new AnthropicClient();
  } catch {
    return null;
  }
}
