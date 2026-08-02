import { z } from "zod";

// Typed environment access. Two deliberate rules:
//
//  1. Split NEXT_PUBLIC_* (shipped to the browser) from server-only secrets, so
//     a secret can never be referenced from a key that Next would inline into
//     client bundles.
//  2. Validate LAZILY, at the point of use — never with a top-level parse. The
//     app is designed to run in a keyless preview mode (sample data, no
//     Supabase/Anthropic). A fail-fast import would break that mode. Each
//     server feature validates only the vars it actually needs, when it needs
//     them, with a clear aggregated error.

const serverEnvSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1),
  ANTHROPIC_DRAFT_MODEL: z.string().min(1).default("claude-sonnet-4-5"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
});

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type PublicEnv = z.infer<typeof publicEnvSchema>;

let cachedServer: ServerEnv | null = null;

/**
 * Validate and return the full server env, caching on success. Throws a single
 * error listing every missing/invalid var. Call this from server code that
 * genuinely requires the keys (e.g. the live drafting pipeline) — not at module
 * load, or you break keyless preview mode.
 */
export function getServerEnv(): ServerEnv {
  if (cachedServer) return cachedServer;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid server environment: ${issues}`);
  }
  cachedServer = parsed.data;
  return cachedServer;
}

export function getPublicEnv(): PublicEnv {
  return publicEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

/**
 * Presence-only view of every known env var. Reports whether each is SET, never
 * its value — safe to surface from a (token-gated) health endpoint. Used to
 * answer "is this deployment configured?" without leaking secrets.
 */
export function envPresence(): Record<string, boolean> {
  const keys = [
    "ANTHROPIC_API_KEY",
    "ANTHROPIC_DRAFT_MODEL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "HEALTH_CHECK_TOKEN",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_PRICE_SINGLE",
    "STRIPE_PRICE_PACK5",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  ] as const;
  return Object.fromEntries(
    keys.map((k) => [k, Boolean(process.env[k]?.trim())]),
  );
}
