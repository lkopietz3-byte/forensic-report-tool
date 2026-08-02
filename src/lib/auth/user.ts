import "server-only";
import { createSupabaseServerClient } from "../supabase/serverClient";

export interface CurrentUser {
  id: string;
  email: string | null;
}

// The single way server code asks "who is signed in?". Returns null in keyless
// preview or when no session — callers degrade to session-only mode rather than
// failing. Uses getUser() (not getSession()) so the token is verified against
// Supabase, never trusted from the cookie alone.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return { id: user.id, email: user.email ?? null };
}
