/**
 * Guard for suites that need a real Postgres.
 *
 * Skipping is correct locally — most runs have no database, and forcing one
 * would make the suite unrunnable for anyone who just cloned the repo. In CI it
 * is not correct: `describe.skip` registers the block as skipped and leaves the
 * exit code at 0, so a run with no database is indistinguishable from a run that
 * proved cross-user isolation and credit-ledger integrity hold.
 *
 * These are the only behavioral tests of either property. RLS is the primary
 * scope for every case-owned table (the app-code owner checks in
 * `src/app/api/report/[id]/route.ts` are defense-in-depth layered on top), and
 * the credit tests are the only proof the atomic spend RPC actually prevents
 * double-spend. A green tick that verifies neither invites exactly the drift
 * they were written to catch.
 *
 * `rls-isolation.test.ts` already says it: "A skipped security test is a
 * liability; this is wired so it becomes REQUIRED (RELEASE.md) the moment real
 * case data is accepted." This makes that requirement enforceable by CI instead
 * of by remembering.
 */
export function requireTestDbInCI(vars: Record<string, string | undefined>): boolean {
  const missing = Object.entries(vars)
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length === 0) return true;

  if (process.env.CI) {
    throw new Error(
      `Database-backed security tests cannot run: missing ${missing.join(", ")}.\n` +
        "Refusing to skip in CI — a vacuous pass here would claim coverage that does not exist.\n" +
        "Provision an ephemeral database in the workflow (no hosted credentials needed):\n" +
        "  supabase start && supabase db push\n" +
        "then export TEST_SUPABASE_URL / TEST_SUPABASE_ANON_KEY / TEST_SUPABASE_SERVICE_ROLE_KEY\n" +
        "from `supabase status -o json`.\n" +
        "To run the rest of the suite without a database, unset CI.",
    );
  }

  return false;
}
