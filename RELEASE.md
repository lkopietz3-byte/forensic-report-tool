# Disclosed engineering and release contract

This is the repository-owned contract for changing or releasing Disclosed. It
separates local proof, disposable-database proof, production verification, and
customer/legal validation. A green local build is not a production or legal
readiness claim.

## Critical paths and invariants

1. **No originated expert facts or opinions.** Structuring, grounding,
   disclosure, reconstruction, readiness, and export may use only the expert's
   supplied material. User-facing copy must not promise admissibility,
   compliance, defensibility, or a court outcome.
2. **No partial saved-report success.** `GET /api/report/[id]` returns `200` only
   after the report, inputs/evidence, sections, profile, and audit reads all
   succeed. A real empty child set is allowed; a dependency error or rejected
   request is a retryable `503` and exposes no partial report or integrity
   verdict. Absent and non-owned identifiers share the same non-disclosing
   `404`.
3. **Tenant isolation is enforced twice.** Supabase RLS is the primary data
   boundary; server routes also verify the authenticated owner before exposing
   case material. Browser roles cannot mutate trusted ledgers or invoke the
   credit-spend function.
4. **Disclosure integrity is never inferred.** Persisted audit events are
   append-only while retained and re-verified on load. Existing owner-confirmed
   permanent deletion removes the report and its disclosure record; this is
   not an indefinite-retention guarantee. Missing events are explicitly
   unverified, never treated as a valid empty chain.
5. **Credits are server-only and append-only.** Migration `0013` returns
   `debited`, `already_paid`, or `insufficient`. One report fingerprint is
   charged once. Render completes before spend, so a failed render creates no
   debit or refund race; successful concurrent renders serialize to one debit.
   Advisory locking prevents a one-credit double spend. Stripe session and
   event identifiers remain idempotency keys.
6. **Tests use synthetic, disposable data only.** Never aim integration tests at
   production, real accounts, real case material, or live payment activity.

## Local setup and focused checks

```sh
npm ci
npm run typecheck
npm test -- --maxWorkers=1 src/test/reportLoadRoute.test.ts src/test/savedReportsPanel.test.ts
npm test -- --maxWorkers=1 src/test/creditLedger.test.ts src/test/creditSafety.test.ts src/test/credits-integration.test.ts
```

Run `npm run check` on a stable candidate. It performs source custody, genuine ESLint, typecheck, runner guards, the complete
ordinary test suite, and a production build. Record the exact revision and
dirty state alongside the result; skipped external suites are not evidence that
their boundaries passed.

## Required disposable Supabase gate

Before enabling saved real case data or billing, apply all migrations through
`0016_save_report_snapshot.sql` to a local loopback test project, then run:

```sh
TEST_SUPABASE_URL=... \
TEST_SUPABASE_SERVICE_ROLE_KEY=... \
TEST_SUPABASE_ANON_KEY=... \
TEST_SUPABASE_SCHEMA_VERSION=0016 \
npm run test:db
```

The gate refuses every remote database, even one labeled as throwaway. Missing
credentials, a non-loopback URL, or a missing migration-`0016` operator
acknowledgement exits non-zero; it must never be recorded as a pass or an
acceptable skip. The database behavior tests—not the acknowledgement alone—are
what verify the `0013`, `0014`, and `0015` contracts.

The database gate proves cross-user RLS isolation, append-only audit behavior,
single-credit concurrency, the three migration-`0013` spend statuses,
fingerprint/legacy-adjustment behavior, Stripe replay rejection, service-only RPC access,
migration-`0014` intake-table lockdown, and owner-scoped atomic report deletion
(including shared-case refusal, non-owner isolation, repeat and anonymous calls).

## Rendered-path checks

At both desktop and phone widths:

- Open a complete synthetic saved report and confirm its fields restore only
  after the load succeeds.
- Force a saved-report dependency failure. Confirm the existing workspace does
  not change, the error is announced, and that row offers **Try again**.
- Restore the dependency and retry. Confirm the full report opens and the
  disclosure-chain result is shown honestly.
- Exercise keyboard focus, loading/disabled states, timeout recovery, reload,
  and back/return navigation.

## Release and rollback record

For any authorized release, record: revision, pre-release dirty state, commands
and results, disposable database identity and migration version, rendered-path
evidence, production environment changed, and the prior deploy/revision to
restore. A database migration needs its own reviewed forward and recovery plan;
never use application rollback language as proof that a schema change is
reversible.

Do not deploy while required audit findings or gates are open. Do not enable
real protective-order material until qualified counsel approves the customer
terms, confidentiality posture, provider/data-processing terms, and the exact
claims presented in-product. These are external gates; code and test counts
cannot close them.

## Authentication mutation and lint contract

Sign-out must fail explicitly if Auth is unavailable, its operation errors, or
required session-cookie persistence throws. Auth mutation routes require cookie
writes; read-only Server Components retain the tolerant refresh adapter. Never
return a sign-out success acknowledgement on those failures. The enhanced
workspace form keeps unsaved inputs mounted, announces uncertainty, prevents
duplicate submission, and offers retry. A 15-second client timeout is unknown
server state, not proof the user remains signed in. Successful native form POSTs
retain a relative 303 redirect; enhanced POSTs receive an explicit success body.

`npm run lint` executes ESLint against first-party source/config/tests using
Next core-web-vitals and TypeScript rules. Only generated build/coverage outputs,
next-env.d.ts, dependencies, and bundled third-party OCR JavaScript are excluded.
There are no disabled lint rules in the added configuration. Existing warnings
remain visible and must be reported; an exit-zero result is not zero warnings.
CI and `npm run check` include lint; a configured local gate is not proof of a
hosted run. ESLint 9.39.5 is the newest 9.x version identified from npm and is
compatible with eslint-config-next15.5.21, but npm marks ESLint9 unsupported.
Treat migration to a supported lint/config generation as framework upgrade debt,
not grounds to override peer requirements or silently upgrade this app.

Mounted sign-out tests use pinned jsdom30.0.1, requiring Node22.22.2+ or24.15.0+
(within the supported major lines). The locally exercised runtime is Node24.19.0;
CI and local setup now pin that exact Node24.19.0 through .nvmrc, matching the
locally exercised runtime. Older incompatible Node installations are not valid
clean-test environments for this dependency.

## Saved-report deletion and recovery

The existing privacy policy and explicit confirmation allow permanent owner
deletion, including evidence, sections, and the disclosure record. Migration
`0015` implements this atomically with caller RLS: lock the owned case before
the report, revalidate it after waiting, and refuse a case shared with another
report. This sibling-protection contract applies to this route/RPC, not to
all existing direct database permissions. Only `deleted` yields HTTP204; missing/non-owned yields404, shared
case yields409 with no deletion, and dependency/ambiguous results yield503.
Transport failure can happen after commit; never describe it as proof nothing
was deleted. Existing direct owner case deletion remains permitted by RLS.

The saved list has an explicit refresh action. Authentication or query failures
are unavailable, never an empty-success fallback. The client validates the whole
latest-50 response, rejects stale responses, and retains prior rows and unsaved
workspace fields on failure. A successful refresh only describes this bounded
list; it does not establish that an older report outside the latest50 is absent.

Before release, exercise refresh during a real local dependency outage and
recovery at desktop and phone widths. Verify the active SQL implementation with
late-cascade rollback and controlled lock-contention schedules, using disposable
fixtures only. Current local proof lives in the Studio deletion checkpoint; it
is not a hosted migration or release. App rollback alone does not remove the
RPC; reverting the app reintroduces the old deletion behavior. Leave0015 in
place during investigation; any schema rollback needs separate review.

A shared-case409 is deterministic, not an uncertain deletion. The UI explains
that shared-case deletion is unavailable here and directs the owner to Help
without case material; refresh is not represented as its remedy. The current
SQL schedule receipt proves only the listed controlled orders (including
delete-lock-first insertion), not every possible concurrency schedule.

## Atomic saves and historical fidelity (0016)

Saving allocates the report UUID before assembly; its audit events bind that ID.
`save_report_snapshot` uses SECURITY INVOKER with auth.uid ownership, generates
case/input IDs itself, and writes profile defaults, report-owned profile, evidence,
sections and exact audit fields in one transaction. It verifies audit order/identity
and inserted counts. No compensating DELETE remains in the save route. Missing,
malformed, mismatched or failed RPC acknowledgement yields503; a lost response
may follow commit. Refresh before another save, which intentionally creates a new
snapshot. Save retries are not idempotent and never run automatically.

Reports saved from0016 load their own profile even after defaults change. Legacy
rows are not backfilled with invented history: their response/UI identifies the
current-profile fallback. Internal legacy chain-hash verification is preserved
separately from reportBound; new snapshot verification also requires binding to
the requested report ID. Empty audit is explicitly unverified, never a green
chain or proof that AI ran. A profile-only report can have no drafting events.

New snapshot loads reject malformed profiles, missing sections or missing input
anchors. After child reads they revalidate the same report/case/owner so a whole
report deleted or moved during loading cannot return partial200. This is not a
transactional snapshot against arbitrary direct child mutation. Existing owner
table mutation policies remain unchanged; no stronger immutability/tamper-proof
database claim is made. Profiles are snapshot-preserved by the app, not immutable
against their owner issuing direct SQL.

Required DB gate now includes reportSave.integration.test.ts on schema0016.
Release proof includes late-write rollback (including previous profile), reportA
reopened after reportB changes defaults, exact audit persistence and cross-owner
isolation. SQL migration rollback is not an app rollback: preserve historical
profile_snapshot data and0016 while investigating; do not drop it automatically.

The RPC validates storage types/cardinalities and audit identity; it is not a
complete semantic citation validator for direct callers. Direct authenticated
RPC/table callers can still supply duplicate evidence labels or orphan logical
references. The normal save route rejects duplicate IDs and uses the report
assembly pipeline; export grounding remains required. No claim is made that
owner-written database rows are inherently valid expert evidence.


## Publication custody and review boundary

`npm run check:custody` compares every local source/test, script, public asset
and migration path with the Git index and rejects symlinks in those directories.
Run it before committing; CI also runs it before installation. It detects a
locally present file hidden by an ignore rule. It cannot reconstruct a file
already omitted from a remote checkout; the local pre-publication run matters.
The root build-output ignore is `/build/`, so the real `/api/report/build` source
route is included in version control.

The `review/disclosed-persistence-20260914` branch disables Vercel automatic
deployment through its branch-specific `vercel.json` rule. Main and other branches
retain their existing behavior. This is a review branch, not a migration or
production promotion. CI runs on main pushes and pull requests, not this branch
push alone. Its token has read-only contents permission, superseded runs cancel,
and the job is bounded to 20 minutes. A pull request still requires available
included Actions capacity or explicit cost authorization before activation.

Existing PR #1 documents missing database execution in hosted CI. The current
loopback-only `npm run test:db` fails when explicitly required but unavailable;
the CI configuration now provisions a fresh required database gate using the
checksum-pinned CLI and the local Docker socket. See
[disposable database gate](docs/disposable-database-gate.md) for prerequisites,
cleanup and receipt limitations. This configuration has not yet run on hosted
Linux. The separately executed local receipt is real evidence, not a substitute
for hosted reproduction. Keep PR #1 open until that hosted gap is resolved.
