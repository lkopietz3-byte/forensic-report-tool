import { createClient } from "@supabase/supabase-js";

// Browser/anon client. RLS (see supabase/migrations/0001_init.sql) is what
// actually enforces per-expert isolation — the anon key is safe to ship to the
// client only because every table denies cross-owner access at the database.

function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export function createBrowserClient() {
  const url = required(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  );
  const anonKey = required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  return createClient(url, anonKey);
}
