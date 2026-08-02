/**
 * Keep a user-controlled post-auth destination on this origin. A leading slash
 * alone is insufficient: WHATWG URLs interpret `/\evil.example` as a
 * scheme-relative cross-origin URL.
 */
export function safeInternalPath(
  candidate: string | null | undefined,
  fallback = "/workspace",
): string {
  if (
    !candidate ||
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\") ||
    /[\u0000-\u001F\u007F]/.test(candidate)
  ) {
    return fallback;
  }

  const base = "https://internal.invalid";
  try {
    const parsed = new URL(candidate, base);
    if (parsed.origin !== base) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
