// Single source of truth for the site's public origin. Set NEXT_PUBLIC_SITE_URL
// in the deploy environment to the real domain; the fallback is a placeholder so
// metadata/sitemap still resolve in dev and preview.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://disclosed.app"
).replace(/\/$/, "");

export const SITE_NAME = "Disclosed.";

/** Build a same-origin public URL without trusting an inbound Host header. */
export function publicSiteUrl(path: string): string {
  const base = new URL(SITE_URL);
  if (!["http:", "https:"].includes(base.protocol)) {
    throw new Error("NEXT_PUBLIC_SITE_URL must use http or https");
  }
  const url = new URL(path, `${base.origin}/`);
  if (url.origin !== base.origin) {
    throw new Error("Public URL path must remain on the site origin");
  }
  return url.toString();
}

/** Routes worth indexing, with rough change cadence + priority for the sitemap. */
export const SITE_ROUTES: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/sample", priority: 0.8 },
  { path: "/intake", priority: 0.8 },
  { path: "/for-experts", priority: 0.7 },
  { path: "/for-counsel", priority: 0.7 },
  { path: "/for-firms", priority: 0.7 },
  { path: "/resources", priority: 0.7 },
  { path: "/resources/ai-disclosure-in-expert-reports", priority: 0.7 },
  { path: "/resources/rule-26-expert-report-checklist", priority: 0.7 },
  { path: "/help", priority: 0.5 },
  { path: "/verify", priority: 0.6 },
  { path: "/terms", priority: 0.3 },
  { path: "/privacy", priority: 0.3 },
  { path: "/disclaimer", priority: 0.3 },
];
