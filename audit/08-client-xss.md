# Audit 08 — Client-side XSS & DOM Render Safety
Scope: Workspace.tsx (tokens/sentenceTint helpers, textarea path), sample/page.tsx, page.tsx, _components/Waitlist.tsx, app/app/page.tsx

---

## Findings

### [SAFE] No dangerouslySetInnerHTML or raw HTML sinks anywhere
Grep across all src/ files finds zero uses of `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `document.write`, `insertAdjacentHTML`, or `eval()`. All text content in Workspace.tsx, sample/page.tsx, and page.tsx is passed as React children (JSX text nodes), which React serialises as text and never as markup. Confirmed safe.

### [SAFE] tokens() and renderProse() — no HTML string construction
Both helpers (`Workspace.tsx:73` and `sample/page.tsx:27`) work by calling `line.matchAll(TOKEN_RE)`, slicing plain-string segments off the raw line, and pushing either a React `<span>` / `<mark>` / `<a>` element or the raw substring. No string concatenation produces markup; all segments end up as `React.ReactNode[]`. React escapes every text node. The `[[E:id]]` marker regex (`TOKEN_RE`) is anchored to `[a-zA-Z0-9_-]+` for the id portion, so a crafted marker cannot smuggle `<`, `>`, `"`, or `&` through the tokeniser into a prop — the pattern simply won't match. Confirmed safe.

### [SAFE] evidence.content, evidence.location, draftText — all plain React children
Every place these values appear in the UI (EvidenceStage list, source panel, DraftStage sentence loop, Disclosure table, sample page evidence list) passes them as bare JSX text or as the `value` prop of a controlled `<textarea>`. No rendering path turns them into HTML. Confirmed safe.

### [LOW] SourceChip `href={#${id}}` — fragment injection risk is real but confined
`sample/page.tsx:18`: `href={\`#${id}\`}` where `id` comes from `WSEvidence.id`. In the current sample data, ids are hardcoded strings matching `[a-zA-Z0-9_-]+`. However, the `WSEvidence.id` type is `string` — there is no runtime validation that an id cannot contain a `javascript:` prefix or other scheme before the `#`. If a future real-data path populates ids from untrusted input (e.g., database rows seeded from uploaded opposing documents), a malformed id like `" onmouseover="alert(1)` in an `href` attribute would be escaped by React's prop serialisation, so standard text-injection is neutralised. A `javascript:` value — e.g., if id were `javascript:alert(1)` without the leading `#` — would be blocked by Next.js's built-in `href` sanitisation for `<a>` tags (it strips `javascript:` schemes). Risk is low given current architecture, but wardens should add an id allow-list validation at the data layer before any untrusted source populates `WSEvidence.id`.
**Fix**: In `src/lib/domain/types.ts` (or wherever `EvidenceUnit.id` is validated on ingestion), assert `id` matches `/^[a-zA-Z0-9_-]+$/` before persisting. No UI change needed.

### [LOW] Waitlist honeypot value sent in request body — confirmed intentional, no leak
`Waitlist.tsx:122–131`: the honeypot field is visually hidden via `position: absolute; left: -9999px` and `aria-hidden`. The `company` value is submitted in the JSON body (`Waitlist.tsx:34`) to allow the API route to reject bot submissions server-side. The honeypot field name and placement are not secret — they are visible in the client bundle. This is standard practice and carries no meaningful XSS risk. No secrets are exposed. Confirmed acceptable.

### [SAFE] No URL/query params reflected into the DOM
No file uses `useSearchParams`, `useRouter().query`, or reads `window.location` and writes any part of the URL into the DOM. Confirmed safe.

### [INFO] NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in client bundle
`src/lib/supabase/client.ts:14–19`: Both `NEXT_PUBLIC_` vars are shipped to the browser by design (Supabase anon key is intended to be public; RLS enforces row-level isolation). `ANTHROPIC_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are only referenced in server-side files (`src/lib/draft/anthropic.ts`, `src/lib/supabase/server.ts`, `src/app/api/waitlist/route.ts`) — none of which are `"use client"` modules. No secret leaks into the client bundle. Confirmed safe.

### [SAFE] No target="_blank" links anywhere
Grep across all src/ finds zero `target="_blank"` attributes. The `rel="noopener noreferrer"` finding is therefore moot. Confirmed safe.

---

## Summary

**No critical XSS found. Hardening items:**

1. **[LOW] Validate `WSEvidence.id` at ingestion** — add a `/^[a-zA-Z0-9_-]+$/` assertion before any real database write so the `href={\`#${id}\`}` fragment in `sample/page.tsx:18` can never be a `javascript:` URL or carry injected attribute characters. Currently safe because sample data is hardcoded; must be gated before real uploads land.

2. **[INFO] No other actionable issues** — the tokeniser is HTML-string-free, all draft/evidence text flows through React children, no HTML sinks exist, no URL params are reflected, and no secrets leak to the client bundle.
