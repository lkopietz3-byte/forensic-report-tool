export const TEST_SUPABASE_URL = process.env.TEST_SUPABASE_URL;
export const TEST_SUPABASE_SERVICE_ROLE_KEY = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY;
export const TEST_SUPABASE_ANON_KEY = process.env.TEST_SUPABASE_ANON_KEY;
export const REQUIRE_SUPABASE_INTEGRATION = process.env.REQUIRE_SUPABASE_INTEGRATION === "1";

function isLoopback(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const hostname = new URL(url).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

type SupabaseTestEnvironment = Readonly<Record<string, string | undefined>>;

export function supabaseTestGateFailures(env: SupabaseTestEnvironment = process.env): string[] {
  const url = env.TEST_SUPABASE_URL;
  const serviceKey = env.TEST_SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = env.TEST_SUPABASE_ANON_KEY;
  const loopback = isLoopback(url);
  const failures: string[] = [];
  if (!(url && serviceKey && anonKey)) {
    failures.push("set TEST_SUPABASE_URL, TEST_SUPABASE_SERVICE_ROLE_KEY, and TEST_SUPABASE_ANON_KEY");
  }
  if (!loopback) {
    failures.push("use a loopback Supabase target; remote database integration is intentionally refused");
  }
  if (env.TEST_SUPABASE_SCHEMA_VERSION !== "0016") {
    failures.push("set TEST_SUPABASE_SCHEMA_VERSION=0016 after applying migrations through 0016");
  }
  return failures;
}

export const SUPABASE_TEST_TARGET_SAFE = supabaseTestGateFailures().length === 0;
