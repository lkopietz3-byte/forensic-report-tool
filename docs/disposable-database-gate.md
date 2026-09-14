# Disclosed disposable database gate

Integrated into the package commands and prepared CI configuration. Hosted
Linux execution has not yet been run.
It uses an existing local Docker daemon and existing pinned tools. It does not
install tools, change Docker/global settings, select a remote database, or start
the Mac VM itself.

Prerequisites: Node **24.19.0**, Supabase CLI **2.117.0**, a local Docker Unix
socket, and the Disclosed checkout with its declared dependencies installed.
The four original database test files and exactly migrations **0001–0016** must
exist. These source files remain in the app checkout rather than being vendored
into this runner package.

Run with the existing Node executable:

```sh
DOCKER_HOST=unix:///path/to/local/docker.sock \
npm run test:db:disposable -- /path/outside/repo/new-run 55421
```

The parent of `new-run` must exist; `new-run` itself must not exist. It must be
outside the app checkout and all `.git` directories, including through symlinks.
The optional last argument is the API port; the database uses the next port.
On this Mac, **55321** was exercised through the existing VM's loopback-only
forwarding. Linux/default-port operation has not yet been independently run.
The runner requires both API and database ports to be loopback-only; it also
inspects host forwarding on macOS. No `--ignore-health-check` is used.

The runner creates a fresh random-ID project and labeled network, copies and
hash-checks the migrations, starts the stack, verifies actual migration history,
and runs the four required test suites. A generated Vitest config preserves
the app's test settings while disabling `.env` discovery and moving its cache
outside the app. Tool HOME, Docker configuration and cache are empty directories
owned by this run; host/app credential environment variables are not inherited.
Local status credentials stay in process memory and are not persisted in logs.
Failed command diagnostics are redacted; successful credential-bearing output
is omitted.

All four suites must be present, nonempty and entirely passed. Missing inputs,
wrong endpoints, skipped/failed tests, unexpected source changes or cleanup
errors are nonzero failures. A receipt cannot say `PASS` until cleanup is done.
The final receipt is written by atomic rename and includes exact runner/source,
configuration, migration and image identities plus the executed case names.

Cleanup targets only the generated project. After every CLI stop attempt,
leftover containers/volumes require both the exact generated name and Supabase
ownership label before removal. Network removal requires its unique run label.
A stop failure remains a failed gate even if fallback cleanup succeeds. The
runner never stops all projects or prunes unrelated Docker resources.

An external hard kill or machine failure can prevent cleanup. Such a run must
remain incomplete; inspect its receipt and exact resource ownership before
recovery. Local run directories retain configuration, copied migrations and
sanitized evidence for review. Do not publish tool HOME/cache directories or
raw local service state. No production database or customer data is used.

Focused wrapper checks use the existing app's Vitest for a synthetic `.env`
positive control, alongside Node's built-in test runner:

```sh
npm run test:db-runner
```

Current local evidence: **10 wrapper checks passed**; a fresh final database
run applied **16 migrations** and passed **38 database tests, zero skips**;
cleanup passed and the VM was stopped. Genuine ESLint passed using the app's
existing configuration; that reused React/Next configuration emitted two
context diagnostics outside the app. No Linux/hosted reproduction, clean
dependency installation, CI activation or production-readiness claim is made.

## CI integration and evidence boundary

The existing CI job is configured for Ubuntu 24.04, pinned Node 24.19.0 and
Supabase CLI 2.117.0 from its official GitHub release. The Linux x64 tarball is
checked against SHA-256
`69c05f85b9e47ee706d30f1a6ca8a526b4e337bfd12c7ef1ef522d24e7280d24`
before extraction into the runner's temporary directory. No Bun or additional
package installation is introduced. Docker must be available on the hosted
runner's local Unix socket; missing tools or service startup fails the job.

`npm run check` includes the ten runner checks. The full disposable gate is a
separate required CI step after the ordinary checks/build; it is not silently
enabled for every local `check`. Use the explicit disposable command above when
the local Docker runtime is available. The existing manually configured
`npm run test:db` remains available.

CI retains the compact result in its job summary and sanitized command logs;
it does not upload artifacts or persist the temporary run directory. The full
hash-bearing receipt is available only during that runner's lifetime. This is
a deliberate storage boundary, not durable artifact custody. Hosted Linux,
fresh CLI extraction, and clean dependency installation still require a real
authorized hosted run. The 20-minute timeout can terminate cleanup; a cancelled
or timed-out run is not a passing gate. Hosted ephemeral runner teardown is
separate from the runner's verified normal cleanup.
