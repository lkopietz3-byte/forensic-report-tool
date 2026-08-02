# RUNBOOK: Secrets

Where the secrets live, how to rotate them, and what to do if one leaks. Case
files are litigation-sensitive and often under protective order, so a leaked
admin key is a P0 (see `INCIDENT_RESPONSE.md`). All wording here describes our
data-handling as **commitments/intent** — no certifications we don't hold.

## Where secrets live

| Secret | Service | Scope / power | Rotate |
| --- | --- | --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | **RLS-BYPASS admin.** Highest stakes — reads/writes every tenant's case data. | On leak, else 90d |
| `ANTHROPIC_API_KEY` | Anthropic | Billing exposure + drafting path. | On leak, else 90d |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase | Public by design; RLS is the real guard. | Only on project reset |
| `HEALTH_CHECK_TOKEN` | self | Gates `/api/health?deep=1` env-presence view. | On leak, else 180d |

Stripe secrets are deferred (see `DEFERRED.md`); add a dual-secret rotation
window row here when billing lands.

## Rotating a secret (zero-downtime where possible)

1. Generate/issue the **new** key in the provider console.
2. Set it in the host (Vercel project env) for all environments that need it.
3. Redeploy so the new value is picked up.
4. Verify: `GET /api/health?deep=1` with `x-health-token` → expected presence
   booleans; exercise one drafting call (Anthropic) or one authed read (Supabase).
5. **Revoke the old key** in the provider console. Do not skip this step.

## Detecting a leaked secret

Signs: a key string in a commit/log/screenshot/error payload; unexpected
Anthropic spend; Supabase rows changed by no known code path; the key appearing
in any third-party tool's history.

Response: treat as P0. Rotate **immediately** (steps above, new key first), then
follow the data-breach flow in `INCIDENT_RESPONSE.md` to assess whether any case
data was exposed and which experts/counsel to notify.

## After ANY rotation

- [ ] Old key revoked at the provider.
- [ ] `/api/health?deep=1` shows the expected presence booleans.
- [ ] One real call per affected service succeeds.
- [ ] No secret value was pasted into chat, a ticket, or a log line.
