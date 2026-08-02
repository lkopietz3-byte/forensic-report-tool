import { createBrowserClient } from "@supabase/ssr";

// SSR-aware browser client. Stores the session (and the PKCE code-verifier for
// magic-link sign-in) in cookies that the server client + middleware can read —
// this is what makes the email-link round trip complete server-side. Returns
// null when Supabase isn't configured so client UI can hide sign-in.
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  return createBrowserClient(url, anon);
}
