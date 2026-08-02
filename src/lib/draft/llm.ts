// Pluggable LLM boundary. The pipeline depends only on this interface so it can
// be unit-tested with a deterministic fake and swapped to Claude in production.

export interface LLMCompletion {
  text: string;
  model: string;
  /** Concrete model build/version string for the audit record. */
  modelVersion: string;
}

export interface LLMClient {
  /**
   * Closed-world completion: the implementation must pass `system` + `user`
   * verbatim and must NOT enable web/tool browsing in the drafting path.
   */
  complete(args: { system: string; user: string }): Promise<LLMCompletion>;
}
