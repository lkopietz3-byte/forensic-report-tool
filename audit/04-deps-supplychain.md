# 04 — Dependency & Supply-Chain Security Audit

**Scope:** package.json dependency ranges, installed versions (package-lock.json), `npm audit` results, version-staleness analysis for Next.js 15.x, and caret-range risk for a litigation-grade SaaS.

---

## Installed Versions (key packages)

| Package | Pinned Range | Installed | Latest |
|---|---|---|---|
| next | ^15.0.3 | 15.5.19 | 16.2.7 |
| react / react-dom | ^19.0.0 | 19.2.7 | — |
| @anthropic-ai/sdk | ^0.32.1 | 0.32.1 | 0.102.0 |
| @supabase/supabase-js | ^2.45.4 | 2.108.0 |  — |
| stripe | ^17.3.1 | 17.7.0 | 22.2.0 |
| zod | ^3.23.8 | 3.25.76 | 4.4.3 |
| docx | ^9.0.2 | 9.7.1 | — |
| vitest | ^2.1.5 | 2.1.9 | 4.1.8 |
| vite (transitive) | — | 5.4.21 | 6.4.2+ |
| esbuild (transitive) | — | 0.21.5 | 0.25+ |

---

## npm audit Results (7 vulnerabilities)

### [CRITICAL] vitest@2.1.9 — GHSA-5xrq-8626-4rwp (CVE score 9.8)
- **Issue:** When the Vitest UI server is listening, arbitrary files on the filesystem can be read and executed by any network-reachable client. Missing authorization check (CWE-862).
- **Affected range:** vitest ≤ 3.2.5
- **Impact:** Full filesystem read/code-execution exposure if `vitest --ui` is ever run on a networked machine (e.g., CI, staging). Even without `--ui`, vitest 2.x carries this advisory flag.
- **Fix:** Upgrade `vitest` to **≥ 3.2.6** (semver-minor bump within v3) or **4.1.8** (latest). The `^2.1.5` range will not auto-resolve to v3; manual bump required.
- **Note:** `@vitest/ui` is NOT currently installed, which lowers immediate runtime risk, but the vulnerability exists in the vitest core server code.

### [MODERATE] postcss@8.4.31 (bundled inside next) — GHSA-qx2v-qp2m-jg93
- **Issue:** PostCSS < 8.5.10 emits unescaped `</style>` in CSS stringify output, enabling reflected XSS in any pipeline that passes attacker-controlled CSS through PostCSS to an HTML page (CWE-79; CVSS 6.1).
- **Affected range:** postcss < 8.5.10
- **Installed:** next bundles its own postcss@8.4.31 at `node_modules/next/node_modules/postcss`.
- **Fix:** Upgrade `next` to a release that bundles postcss ≥ 8.5.10. The top-level postcss@8.5.15 (for Tailwind) is already safe; only Next's internal copy is vulnerable. Monitor next releases; no Next 15.x point-release that fixes this is yet available per audit output (`fixAvailable` points to next@9.3.3, which is a registry data artifact — watch next@15.x changelogs).

### [MODERATE] vite@5.4.21 — GHSA-4w7w-66w2-5vf9
- **Issue:** Path traversal in optimized-deps `.map` file handling (CWE-22/CWE-200). Attacker can read arbitrary files from the dev server's filesystem if the Vite dev port is reachable.
- **Affected range:** vite ≤ 6.4.1
- **Impact:** Dev-only risk (vite is a transitive dep of vitest, not used in Next.js production builds). Dangerous in CI environments or shared dev machines with exposed ports.
- **Fix:** Resolved by upgrading vitest to **4.1.8**, which pulls vite ≥ 6.4.2.

### [MODERATE] esbuild@0.21.5 — GHSA-67mh-4wv8-2f99
- **Issue:** esbuild ≤ 0.24.2 allows any website to send arbitrary requests to the esbuild dev-server and read the response (CORS/origin-isolation bypass, CWE-346; CVSS 5.3).
- **Affected range:** esbuild ≤ 0.24.2
- **Impact:** Dev-only (esbuild is a transitive dep via vite/vitest). Risk if dev server is accessible from a browser session on the same machine.
- **Fix:** Resolved by upgrading vitest to **4.1.8**.

### [MODERATE] @vitest/mocker, vite-node (transitive chain)
- Both flagged moderate, cascading from the vite/esbuild issues above. Resolved by the same vitest upgrade.

---

## Next.js 15.x — Known Security Advisories (manual review)

### CVE-2025-29927 — Middleware Auth Bypass (CRITICAL in affected versions)
- **Issue:** x-middleware-subrequest header spoofing allows an attacker to bypass middleware-based authentication entirely by setting a crafted header. No auth check is applied when the internal header is present.
- **Affected:** next ≤ 15.2.2 and ≤ 14.2.25
- **Installed:** 15.5.19 — **PATCHED** (fixed in 15.2.3). This project is safe, but this CVE class is exactly what a litigated SaaS must monitor.

### Cache Poisoning / SSRF class (Next 15.x)
- No unpatched known SSRF or cache-poisoning advisory against 15.5.x as of audit date. Next 15.5.19 is the current 15.x release and is considered up-to-date within the major.

---

## Version-Staleness Risk

### @anthropic-ai/sdk — SEVERELY STALE (0.32.1 installed vs 0.102.0 latest)
- **Risk:** 70 minor versions behind. Anthropic SDK has had breaking changes, security patches, and model API changes in this gap (including streaming changes, tool-use API revisions, and prompt-caching fixes). Staying on 0.32.x means running against a deprecated API surface and missing any SDK-level mitigations applied in later releases.
- **Recommendation:** Upgrade to **^0.102.0** (or latest stable). This is a major compatibility risk as well as a security posture issue.

### stripe — Stale (17.7.0 vs 22.2.0 latest)
- **Risk:** 5 major versions behind. Stripe's Node SDK major bumps typically include deprecated endpoint removals and security hardening. PCI compliance considerations apply.
- **Recommendation:** Upgrade to **^22.x** before launch; review changelog for breaking changes in payment flow handling.

### vitest — Stale (2.1.9 vs 4.1.8) with active CRITICAL CVE
- Already covered above. Upgrade is both a security and functional requirement.

---

## Caret (^) Range Risk Assessment

For a litigation-grade product where reproducibility and auditability are material:

| Risk | Detail |
|---|---|
| **Supply-chain drift** | `^` ranges allow any minor/patch bump on fresh installs. A compromised patch release of any dependency would auto-resolve. |
| **Non-reproducible builds** | Without a locked CI install strategy (`npm ci` from lockfile), `^` ranges create audit-trail gaps. `npm ci` is the correct deploy command — verify CI config uses it. |
| **Recommendation** | For security-critical deps (next, @anthropic-ai/sdk, stripe, @supabase/supabase-js), consider pinning exact versions in package.json after validating each upgrade, and use `npm ci` exclusively in build/deploy pipelines. |

---

## Top 3 Must-Fix

1. **[CRITICAL — URGENT] Upgrade `vitest` to ≥ 3.2.6 (prefer 4.1.8).**
   GHSA-5xrq-8626-4rwp: CVSS 9.8, arbitrary file read/exec. Even with `--ui` not currently used, this is a critical advisory in a security-sensitive codebase and will fail any third-party security review. The `^2.1.5` range does not resolve it; bump must be manual. Upgrading to 4.1.8 also fixes all moderate vite/esbuild/mocker issues.

2. **[HIGH — URGENT before launch] Upgrade `@anthropic-ai/sdk` from 0.32.1 to ^0.102.0.**
   70 minor versions behind the current SDK. This is both a security posture failure (missing patches over 70 releases) and a reliability risk — Anthropic may deprecate 0.32.x API endpoints, causing silent failures or broken AI features in production. For a product whose core value is AI-generated forensic reports, this is critical path.

3. **[MODERATE — PRE-LAUNCH] Upgrade `stripe` to ^22.x and pin exact version.**
   5 major versions behind (17.7.0 vs 22.2.0). Payment processing code is PCI-adjacent; running a stale Stripe SDK exposes the product to deprecated API patterns, webhook signature verification gaps, and missing security hardening. A forensic SaaS handling client billing must present a clean dependency posture to enterprise buyers.

---

## Additional Recommendations

- **postcss inside next:** Monitor next@15.x point releases for a bundled postcss ≥ 8.5.10 upgrade. The XSS risk (GHSA-qx2v-qp2m-jg93) is moderate but real if any user-controlled CSS passes through the Next.js PostCSS pipeline.
- **Use `npm ci` in all CI/CD pipelines** — never `npm install` — to ensure lockfile determinism.
- **Consider exact pinning** of next, stripe, and @anthropic-ai/sdk in package.json to prevent unexpected supply-chain drift between deploys.
- **No abandoned or obviously malicious transitive packages detected** in the 258-package tree. The dependency surface is relatively tight for a Next.js app.
