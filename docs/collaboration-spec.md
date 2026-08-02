# Collaboration / Shared Case Rooms — Feature Spec

Build-ready spec for letting more than one person contribute to a case file
while authorship stays with the single expert who signs. **Blocked on auth +
database + RLS landing** (see DEFERRED.md) — design it now, build it when the
multi-tenant backend exists.

## The one rule this feature must not break

Contributors send **evidence (inputs)**. They never author opinions, findings,
or report narrative. Only the named, signing expert authors the report. This is
the CLAUDE.md invariant applied to multi-user: a contribution is raw material
the expert still reviews and confirms; it is not a sentence in the report.

Concretely, the feature must guarantee:
- A contribution can only ever become a **candidate evidence unit**, never a
  drafted section or a confirmed unit. Confirmation is an expert-only action.
- No contributor role can edit report narrative, confirm/promote evidence, run
  the draft pipeline, or export the deliverable.
- Provenance (who/when) is captured for every contribution and is immutable.

## Roles

| Role | Can do | Cannot do |
| --- | --- | --- |
| **Owner** (member, holds the credit) | Everything: structure sections, confirm evidence, edit, sign, export, invite/revoke | — |
| **Co-expert** (member, optional) | Structure sections, confirm evidence, edit | Sign/export unless also designated signer; manage billing |
| **Contributor** (member or guest) | Upload/paste documents; add candidate evidence units; comment | Edit narrative, confirm evidence, run draft, export, see other cases |

Signer designation is explicit and separate from "can edit." A co-expert helps
structure; the report still carries the designated expert's signature and the
ToS attaches authorship to that person.

## Guest evidence-link flow (the v1 wedge — lowest friction)

The high-value, low-build version: a paralegal or the retaining attorney's
office contributes **without an account**.

1. Owner creates a **case invite token** scoped to ONE case room, with a role
   (`contributor`), an optional label ("Smith firm — paralegal"), an expiry, and
   a revoked flag. Store a hash of the token, never the raw value.
2. Owner shares the link (`/case/<caseId>/contribute?t=<token>`).
3. Guest lands on a minimal upload page: drop files / paste text + a "from"
   label. No access to the report, other evidence, or case metadata beyond what's
   needed to orient them (case title only, if owner opts in).
4. Each submission creates an **evidence contribution** record (status
   `pending`) + stores the raw file in case-scoped storage. The extractor runs to
   propose candidate units exactly as in the normal intake path.
5. Owner sees a "Contributions" queue: review → confirm (promotes to a real
   evidence unit) or discard. Confirmation is the expert's act and is what lets
   the unit ground a draft.
6. Token is revocable and expires; revocation is immediate and logged.

Guests are rate-limited and file-type/size capped (reuse `MAX_INPUT_CHARS` and
the existing upload caps). Treat all guest input as untrusted data (same
prompt-injection posture as `extract.ts`).

## Data model (additive to the MVP schema)

```
case_room        (id, owner_id, title, discipline, created_at)
case_member      (case_id, user_id, role)                 -- members only
case_invite      (id, case_id, token_hash, role, label,
                  expires_at, revoked_at, created_by)      -- guest links
evidence_contribution
                 (id, case_id, source_label, submitted_by_user_id NULL,
                  submitted_via_invite_id NULL, submitted_at,
                  raw_file_ref, status: pending|confirmed|discarded,
                  confirmed_by_user_id NULL, confirmed_at NULL)
```

An evidence unit gains `origin_contribution_id` (nullable) so a confirmed unit
points back to who supplied it and when.

## RLS (non-negotiable — litigation-sensitive, often under protective order)

- All case data is readable only by `case_member` rows for that case (owner +
  invited members). Reuse the cross-user-isolation test discipline from
  DEFERRED.md.
- Guest contributions write through a **token-scoped server action**, not direct
  table access: the server validates the token (hash match, not expired, not
  revoked), then inserts the contribution server-side. Guests never get a DB
  session or read scope beyond the single insert path.
- `evidence_contribution` is insert + status-update only; raw submissions are
  never deletable in a way that erases provenance (discard = status change, row
  retained).

## Provenance → the disclosure trail (the moat synergy)

Every contribution and confirmation appends to the existing hash-chained
`AuditLog` (`src/lib/domain/audit.ts`):
- `evidence.contributed` — {caseId, sourceLabel, submittedBy | inviteLabel, at}
- `evidence.confirmed`  — {unitId, originContributionId, confirmedBy, at}
- `invite.created` / `invite.revoked`

The AI-Disclosure Appendix (`src/lib/domain/disclosure.ts`) gains a
**chain-of-custody section**: for each cited evidence unit, who supplied it and
when, and who confirmed it into the report. This is exactly the kind of
methodology record courts have begun ordering — collaboration *strengthens* the
audit layer instead of diluting it. Keep wording "tamper-evident," never
"tamper-proof."

## Billing fit

- Contributors and guests are **free** — they consume no seat and no credit.
- Credits stay attached to the **report**, drawn from the owner's balance.
- A firm buying a pack runs a **pooled credit
  balance** across shared case rooms — this is the home for the "pooled credit
  balance" line already on the pricing section.
- Server-side credit check at draft/export time still gates on the owner's real
  balance (ties into the server-side gate enforcement in DEFERRED.md).

## Explicitly deferred past v1

- **Real-time co-editing / presence ("cowork" in the live sense).** Bigger build
  (CRDT/presence, conflict resolution) and premature pre-validation. The
  contribution queue above covers the actual need (multiple people supplying
  evidence) without it.
- Threaded comments / case chat beyond a simple per-contribution note.
- External-system intake (e-discovery / case-management connectors) — already
  Phase 2 in DEFERRED.md.

## Build order when unblocked

1. `case_room` + `case_member` + RLS + isolation test.
2. Owner-side Contributions queue against existing intake/extract path.
3. Guest invite token (hash, expiry, revoke) + token-scoped server action +
   minimal upload page.
4. Provenance events into `AuditLog`; chain-of-custody section in the appendix.
5. Pooled-credit accounting + server-side gate at draft/export.
