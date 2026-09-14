import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cookie-bound, RLS-SCOPED Supabase client for the signed-in expert. Unlike the
// service client (server.ts), this carries the user's session, so every query
// is filtered by the database's row-level-security policies (own cases / own
// reports / own audit). This is the client all user-facing data paths use —
// isolation is enforced by Postgres, not by app code.
//
// Returns null when Supabase isn't configured (keyless preview), so callers can
// fall back to session-only mode instead of throwing.

export async function createSupabaseServerClient(
  { requireCookieWrites = false }: { requireCookieWrites?: boolean } = {},
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;

  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch (error) {
          if (requireCookieWrites) throw error;
          // Called from a Server Component, where cookies are read-only. The
          // middleware (src/middleware.ts) refreshes the session cookie instead,
          // so this is safe to ignore.
        }
      },
    },
  });
}
