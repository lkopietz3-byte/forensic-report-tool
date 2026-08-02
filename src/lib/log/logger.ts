// Tiny structured logger. One line of JSON per event so a log drain (Vercel,
// Datadog, etc.) can parse it, with a single seam to later forward errors to an
// error tracker (Sentry) without touching call sites. No dependency, no PII: a
// denylist redacts sensitive fields, and call sites should pass identifiers
// (e.g. a user id), never raw case content or secrets.

type Level = "debug" | "info" | "warn" | "error";

type Fields = Record<string, unknown>;

const REDACT_KEYS = new Set([
  "password", "token", "secret", "apikey", "api_key",
  "authorization", "cookie", "email", "stripe_customer_id",
  "access_token", "refresh_token", "client_secret", "stripe_signature",
  "supabase_service_role_key", "anthropic_api_key",
  // Case material must never enter an observability drain, even if a future
  // call site accidentally passes one of these conventional field names.
  "content", "case_content", "case_data", "evidence", "prompt", "output", "body",
]);

// Cap individual values so a giant error string (or accidentally-logged case
// content) can't blow up a log line or leak wholesale into a drain.
const MAX_VALUE_CHARS = 500;
const MAX_DEPTH = 6;

function sensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return (
    REDACT_KEYS.has(normalized) ||
    /(?:^|_)(?:password|passwd|token|secret|authorization|cookie|api_?key)(?:$|_)/.test(
      normalized,
    )
  );
}

function sanitizeString(value: string): string {
  const scrubbed = value
    // Email addresses can appear inside provider/database error messages.
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted-email]")
    // Common bearer/JWT/API/webhook secret shapes.
    .replace(/\bBearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/\b(?:sk|rk|whsec|sb_secret)_[A-Za-z0-9_-]{8,}\b/g, "[redacted-secret]")
    .replace(/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}(?:\.[A-Za-z0-9_-]{5,})?\b/g, "[redacted-token]")
    // Token-like URL/query fragments are commonly copied into thrown messages.
    .replace(/([?&](?:token|code|key|secret|signature)=)[^&#\s]+/gi, "$1[redacted]");
  return scrubbed.length > MAX_VALUE_CHARS
    ? `${scrubbed.slice(0, MAX_VALUE_CHARS)}…[truncated]`
    : scrubbed;
}

function sanitizeValue(
  value: unknown,
  key: string,
  depth: number,
  seen: WeakSet<object>,
): unknown {
  if (sensitiveKey(key)) return "[redacted]";
  if (typeof value === "string") return sanitizeString(value);
  if (
    value === null ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "undefined"
  ) {
    return value;
  }
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "symbol" || typeof value === "function") return `[${typeof value}]`;
  if (depth >= MAX_DEPTH) return "[max-depth]";
  if (value instanceof Error) {
    return {
      name: sanitizeString(value.name),
      message: sanitizeString(value.message),
    };
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    if (seen.has(value)) return "[circular]";
    seen.add(value);
    if (Array.isArray(value)) {
      return value.map((item) => sanitizeValue(item, "", depth + 1, seen));
    }
    const out: Fields = {};
    for (const [nestedKey, nestedValue] of Object.entries(value)) {
      out[nestedKey] = sanitizeValue(nestedValue, nestedKey, depth + 1, seen);
    }
    return out;
  }
  return String(value);
}

function redact(fields: Fields): Fields {
  const out: Fields = {};
  const seen = new WeakSet<object>();
  for (const [k, v] of Object.entries(fields)) {
    out[k] = sanitizeValue(v, k, 0, seen);
  }
  return out;
}

function emit(level: Level, event: string, fields?: Fields): void {
  let line: string;
  try {
    line = JSON.stringify({ level, event, ...(fields ? redact(fields) : {}) });
  } catch {
    line = JSON.stringify({ level, event, note: "unserializable fields" });
  }
  // Single forwarding point. When an error tracker is configured (e.g. Sentry),
  // wire it here for level === "error" — every error already funnels through.
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const log = {
  debug: (event: string, fields?: Fields) => emit("debug", event, fields),
  info: (event: string, fields?: Fields) => emit("info", event, fields),
  warn: (event: string, fields?: Fields) => emit("warn", event, fields),
  error: (event: string, fields?: Fields) => emit("error", event, fields),
};

/** Convenience: log an error event with a normalized message field. */
export function logError(event: string, err: unknown, fields?: Fields): void {
  log.error(event, { ...fields, err: err instanceof Error ? err.message : String(err) });
}
