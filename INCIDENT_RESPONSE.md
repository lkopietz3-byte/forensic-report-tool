# INCIDENT_RESPONSE.md

Solo-appropriate incident playbook for **Disclosed.** Our highest-severity
events are NOT billing — they are confidentiality and integrity: case data is
litigation-sensitive, often under protective order, and the audit chain is part
of a client's litigation record. When unsure of severity, **treat it one level
up.**

## Severity ladder

| Sev | Definition | Example |
| --- | --- | --- |
| **P0** | Confidentiality or integrity breach | Case data leaks across accounts/users; protective-order data exposed; `SUPABASE_SERVICE_ROLE_KEY` leaked; audit chain corrupted (`verifyAuditChain` fails) |
| **P1** | Core flow down for everyone | Intake/structuring/export broken; auth failing |
| **P2** | Degraded / partial | One discipline template broken; elevated errors |
| **P3** | Minor / cosmetic | Copy bug, non-blocking UI defect |

## P0: data exposure / protective-order violation

1. **Contain** — revoke the leaked credential (`docs/RUNBOOK-SECRETS.md`),
   disable the offending path/deploy (rollback below).
2. **Assess scope** — which cases/experts, what data, over what window. Use the
   audit chain (`src/lib/domain/audit.ts`, `verifyAuditChain`) to bound what was
   touched; record findings as you go.
3. **Notify** — direct notice to each affected expert/retaining counsel. State
   what we know factually; do not speculate and do not assert a breach-
   notification SLA or guarantee we have not committed to.
4. **Document** — timeline, scope, remediation; feed into the post-mortem.

## 60-second rollback

1. Vercel → Deployments → previous known-good → **Promote to Production**.
2. If a DB migration is implicated: apply its `-- ROLLBACK:` block. Keep
   migrations **additive, not destructive**, so promote-previous stays safe.
3. Verify `GET /api/health` is green and one intake→structure→export path works.

## Blameless post-mortem (within a few days of any P0/P1)

- **Timeline** — what happened, when (UTC).
- **Impact** — who/what was affected, for how long.
- **Root cause** — the actual cause, not the trigger.
- **Resolution** — how it was contained and fixed.
- **Action items** — concrete, owned, dated; link the follow-up commits.

## Pre-launch on-call readiness

- [ ] Errors report to a real, watched inbox.
- [ ] Uptime monitor on `/api/health`.
- [ ] One rollback rehearsed end-to-end.
- [ ] `docs/RUNBOOK-SECRETS.md` rotation steps verified once for real.
