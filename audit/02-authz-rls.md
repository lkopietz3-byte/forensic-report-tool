# Scope: AuthN/AuthZ & multi-tenant RLS isolation — 0001_init.sql, 0002_waitlist.sql, src/lib/supabase/client.ts, src/lib/supabase/server.ts

---

## Findings

### [CRITICAL] /app workspace route is publicly accessible with no auth gate
**Problem:** `src/app/app/page.tsx` and `src/app/app/Workspace.tsx` are fully rendered Server Components with no session check, no middleware redirect, and no `auth.uid()` guard at the route level. There is zero Next.js middleware (`src/middleware.ts` does not exist). Any anonymous visitor can reach `/app`.
**Why it matters here:** Even though `/app` currently renders only static sample data (`buildSampleReport()`), this route is the intended real workspace. The moment a real Supabase-backed case is wired up, unauthenticated users will reach the drafting UI. Establishing the pattern now prevents a silent regression when live data is added.
**Fix:** Add `src/middleware.ts` using `@supabase/ssr` (or `@supabase/auth-helpers-nextjs`) to refresh the session cookie and redirect unauthenticated requests on `/app/*` and any future `/api/cases/*` routes to `/login`. Also add a server-side session check at the top of each Server Component page under `/app`.

---

### [CRITICAL] No authenticated Supabase client — RLS is currently inert
**Problem:** `src/lib/supabase/client.ts` creates a bare anon client (`createClient(url, anonKey)`) with no `@supabase/ssr` cookie adapter. There is no code anywhere that calls `supabase.auth.getSession()`, `supabase.auth.getUser()`, signs in a user, or attaches a JWT. Because `auth.uid()` returns `NULL` when no JWT is present, every RLS policy (`owner_id = auth.uid()`, `c.owner_id = auth.uid()`) evaluates to FALSE for every row — all data is invisible, but not because of isolation: it is invisible because auth doesn't exist at all yet.
**Why it matters here:** The RLS policies are syntactically correct but operationally dormant. The first moment a developer wires up a real insert without auth plumbing, `auth.uid()` = NULL and the WITH CHECK clause on `cases` rejects the insert — but if `SUPABASE_SERVICE_ROLE_KEY` is accidentally used on the browser path instead, RLS is bypassed and cross-tenant reads become trivially possible.
**Fix:** Integrate `@supabase/ssr` for both server and browser clients so every request carries the user's session JWT. Use `createServerClient` (with cookie read/write) in Server Components and Route Handlers, and `createBrowserClient` from `@supabase/ssr` in Client Components. Only then do the RLS policies actually enforce isolation.

---

### [HIGH] RLS EXISTS-subquery chains are correct but carry a TOCTOU-like risk under concurrent schema changes
**Problem:** The policies for `inputs`, `evidence_units`, `reports`, `report_sections`, and `audit_events` all use chained `EXISTS` subqueries back to `cases.owner_id`. These are logically sound for read/insert/update/delete when the FK chain is intact. However, the `cases` table's own RLS policy is `FOR ALL` (read + write in one policy), meaning the subquery that evaluates ownership also relies on the `cases` row being visible under RLS at subquery time. In Postgres, a policy on a table does not automatically apply to the same table when it appears in a subquery within another table's policy — the subquery runs with the caller's privileges and RLS is re-evaluated. This is correct behavior, but it means that if `cases` RLS is ever accidentally disabled (e.g., during a migration that temporarily does `ALTER TABLE cases DISABLE ROW LEVEL SECURITY`), all child-table policies silently widen to allow cross-owner access.
**Why it matters here:** Litigation-sensitive data. A migration mistake or a developer toggling RLS off to debug would expose all clients' evidence and report drafts to each other instantly.
**Fix:** Add a dedicated `owner_id` column to `inputs`, `reports`, and `report_sections` (denormalized, set via trigger on insert) so ownership checks on child tables are direct column comparisons rather than multi-hop joins. This is belt-and-suspenders: correct even if a parent table's RLS is momentarily disabled. Alternatively, document the dependency explicitly and add a CI migration-lint step that refuses to run any migration that disables RLS on `cases`.

---

### [HIGH] audit_events append-only guarantee is correct at the SQL level but fully bypassed by the service-role client
**Problem:** The migration correctly omits UPDATE and DELETE policies for `audit_events`, meaning the anon/authenticated Postgres roles cannot modify or remove audit records. However, `createServiceClient()` in `server.ts` uses the service role key, which bypasses RLS entirely. Any Server Action or Route Handler that imports `createServiceClient()` can DELETE or UPDATE `audit_events` rows without restriction.
**Why it matters here:** The append-only audit log is the product's primary court-defensible artifact. If a bug or a compromised server-side code path calls `supabase.from('audit_events').delete()`, the disclosure appendix is silently destroyed and the expert's Rule 26 compliance claim collapses.
**Fix:** (a) Never call `.delete()` or `.update()` on `audit_events` from the service-role client — enforce this via ESLint custom rule or a thin typed wrapper that omits those methods for the `audit_events` table. (b) Consider creating a dedicated Postgres role with INSERT-only privileges on `audit_events` and using that role's credentials for audit writes rather than the omnipotent service role. (c) Add Postgres-level `RULE` or a trigger that raises an exception on UPDATE/DELETE of `audit_events` so it is enforced at the DB layer regardless of which Postgres role is used.

---

### [HIGH] Service-role client is protected by `server-only` at build time only; dynamic import in Route Handler bypasses the static check
**Problem:** `src/app/api/waitlist/route.ts` uses a dynamic `await import("@/lib/supabase/server")` inside the POST handler body. The `server-only` package works by having Next.js's bundler detect the static import graph and throw at build time if a Client Component imports a `server-only`-marked module. A dynamic `import()` inside a Server Component or Route Handler is not analyzed by the static client-bundle check in the same way — it is safe here because Route Handlers always run server-side, but it establishes a pattern that is easy to copy into a Client Component accidentally (where it would only throw at runtime, not at build time, and only when that code path is hit).
**Why it matters here:** The service-role key is an all-privileges credential. If a developer copies the dynamic-import pattern into a Client Component (e.g., to call a helper that calls `createServiceClient()`), the build will succeed silently — the runtime error only fires in the browser, after the bundle has already shipped.
**Fix:** Change `src/app/api/waitlist/route.ts` to use a static top-level import: `import { createServiceClient } from "@/lib/supabase/server"`. This is always safe in a Route Handler and restores build-time protection. Document that `createServiceClient` must only ever be statically imported, never dynamically.

---

### [MEDIUM] `waitlist` table: public INSERT with `check (true)` allows spam/abuse without rate limiting
**Problem:** The `public waitlist signup` policy accepts any INSERT with no conditions. The Route Handler validates email format and has a honeypot field, but there is no rate limiting (no IP throttling, no Supabase Edge Function rate limiter, no CAPTCHA). A bot can enumerate valid emails or flood the table to exhaustion.
**Why it matters here:** Lower severity than the above, but the waitlist table is also managed by the service-role client for outreach reads. A flooded table could degrade admin reads and inflate email-marketing costs.
**Fix:** Add rate limiting at the Next.js Route Handler layer (e.g., `@upstash/ratelimit` with a Redis store, or Vercel Edge Middleware rate limiting). Consider adding a `UNIQUE` constraint email normalization (lowercasing) to prevent `User@Example.com` vs `user@example.com` duplicates bypassing the existing `unique (email)` constraint.

---

### [MEDIUM] `templates` table has RLS enabled but no policy defined — all authenticated users are denied reads
**Problem:** `ALTER TABLE templates ENABLE ROW LEVEL SECURITY` is run, but no `CREATE POLICY` is defined for `templates`. In Postgres, when RLS is enabled and no policy matches, the default is DENY for all roles except the table owner and superusers. This means authenticated users cannot read templates at all via the anon/authenticated client.
**Why it matters here:** Templates drive the report section schema. When the UI tries to load a template to initialize a new report, the query will silently return zero rows, likely causing a confusing "no template found" error rather than a clear auth error.
**Fix:** Add an explicit read-all policy for authenticated users: `CREATE POLICY "read templates" ON templates FOR SELECT USING (true);` Templates are not sensitive (they are discipline-level schema definitions, not user data), so public read access is appropriate. Write access should remain restricted to service-role only (no INSERT/UPDATE/DELETE policy for anon/authenticated).

---

### [MEDIUM] No owner-scoping on future API routes — IDOR risk for case/report IDs
**Problem:** There are no API route handlers yet for cases, reports, or report sections. When they are built, the risk is that a route like `GET /api/cases/[id]` fetches by UUID without verifying `owner_id = auth.uid()`, trusting RLS to do it. If the browser client is used without proper JWT propagation (see Finding 2), RLS returns no rows but also no error — the developer may interpret "no row returned" as "not found" and add a fallback that queries the service-role client, bypassing RLS entirely.
**Why it matters here:** UUIDs are not guessable, but once one is leaked (e.g., in a URL, a log, or a referrer header), any authenticated expert could access another expert's case data if ownership is not verified.
**Fix:** Establish a server-side helper `requireOwnedCase(caseId, userId)` that always performs an explicit `WHERE id = $1 AND owner_id = $2` check using the service-role client. Never rely solely on RLS for authorization in Route Handlers that receive user-supplied IDs — use explicit ownership checks as a defense-in-depth layer.

---

### [LOW] `auth.uid()` return type is `uuid`; `owner_id` columns are `uuid` — types match, but JWT sub claim must be kept in sync
**Problem:** Supabase `auth.uid()` returns the `sub` claim from the JWT, which Supabase Auth always sets to the `auth.users.id` UUID. This is correct. However, if a custom JWT provider or a third-party auth system is ever integrated (e.g., for SSO for law firms), the `sub` claim format could differ and silently break RLS comparisons.
**Why it matters here:** Low risk now, but worth noting given the litigation context where auth chain-of-custody matters.
**Fix:** Document in `CLAUDE.md` or a security runbook that `sub` claims must always be Supabase-managed UUIDs matching `auth.users.id`. Any future SSO integration must map external identities to Supabase auth users rather than using raw external tokens.

---

### [LOW] `profiles.id` cascades on `auth.users` delete — audit log orphan risk
**Problem:** `profiles` has `ON DELETE CASCADE` from `auth.users`. If an expert's account is deleted (even by mistake or by an admin using the service-role client), `profiles`, `cases`, and all cascading child rows (inputs, evidence, reports, report_sections, audit_events) are deleted. The audit log — the court-defensible disclosure appendix — is destroyed.
**Why it matters here:** An expert's completed report under protective order could be under a litigation hold. Cascading deletion could expose the company to spoliation liability.
**Fix:** Change `cases`, `reports`, and `audit_events` to `ON DELETE RESTRICT` (or `SET NULL` with a soft-delete pattern) so that account deletion is blocked if live cases exist. Add a soft-delete `deleted_at` column to `profiles` and `cases` instead of hard-deleting. Require explicit admin confirmation before purging any account with associated reports.

---

## Top 3 Must-Fix Before Touching Real Litigation Data

1. **[CRITICAL] Add Next.js middleware + server-side session checks to gate `/app/*`** — the workspace is currently open to the public; RLS cannot protect data that is never queried because auth doesn't exist yet, and the UI must not be reachable before a verified session is established.

2. **[CRITICAL] Wire up `@supabase/ssr` so RLS policies actually fire with a real `auth.uid()`** — until a JWT is attached to every Supabase query, the carefully written RLS policies are completely inert; multi-tenant isolation does not exist in practice even though it appears correct in the schema.

3. **[HIGH] Enforce audit_events immutability at the Postgres layer, not just via missing policies** — the service-role client (used server-side) bypasses RLS entirely; a Postgres trigger or RULE on `audit_events` that raises on UPDATE/DELETE is the only guarantee that survives code-level mistakes, and it protects the product's core court-defensibility claim.
