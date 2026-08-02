// Single source of truth for "is Supabase wired up?" — used to keep every
// persistence/auth path FAIL-CLOSED and to degrade gracefully in the keyless
// preview. When these return false the app stays in session-only mode: the
// report builder still works, it just can't sign in or save.

/** Browser/auth path: needs the public URL + anon key (RLS protects the data). */
export function supabaseAuthConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
}

/** Trusted server path: needs the URL + the RLS-bypassing service-role key. */
export function supabaseServiceConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}
