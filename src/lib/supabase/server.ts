import "server-only";
import { createClient } from "@supabase/supabase-js";

// Server-only service-role client. Bypasses RLS, so it must NEVER be imported
// into client components. The `server-only` import makes that a build error.
// Used for trusted server actions like writing append-only audit_events.

function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export function createServiceClient() {
  const url = required(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  );
  const serviceKey = required(
    "SUPABASE_SERVICE_ROLE_KEY",
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
