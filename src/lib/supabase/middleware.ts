import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseAuthConfigured } from "./config";

// Refreshes the Supabase auth session on every matched request and (optionally)
// stamps the response with a CSP header, threading caller-supplied request
// headers (e.g. the per-request CSP nonce) through to the rendered page so
// Next.js applies the nonce to its inline scripts. In keyless preview it still
// runs — it just skips the session refresh and only applies the CSP.

interface SessionInit {
  /** Request headers to expose to the render (carry the CSP nonce). */
  requestHeaders?: Headers;
  /** CSP to set on the response, or null to leave it unset (e.g. dev). */
  cspHeader?: string | null;
}

export async function updateSession(
  request: NextRequest,
  init: SessionInit = {},
): Promise<NextResponse> {
  const reqHeaders = init.requestHeaders ?? new Headers(request.headers);
  const makeResponse = () => {
    const res = NextResponse.next({ request: { headers: reqHeaders } });
    if (init.cspHeader) res.headers.set("Content-Security-Policy", init.cspHeader);
    return res;
  };

  if (!supabaseAuthConfigured()) {
    return makeResponse();
  }

  let response = makeResponse();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = makeResponse();
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // IMPORTANT: do not run code between createServerClient and getUser() — it
  // refreshes the token and is what keeps the session alive.
  await supabase.auth.getUser();

  return response;
}
