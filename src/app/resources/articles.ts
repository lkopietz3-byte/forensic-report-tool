// Lightweight registry for the Resources/insights section. Keeping article
// metadata in one place lets the index, the article pages, and (later) a sitemap
// stay in sync. Bodies live in each article's own page component.

export interface ArticleMeta {
  slug: string;
  title: string;
  dek: string;
  /** Human date shown to readers. */
  date: string;
  /** ISO date for metadata / sorting. */
  isoDate: string;
  readMinutes: number;
  tag: string;
}

export const ARTICLES: ArticleMeta[] = [
  {
    slug: "rule-26-expert-report-checklist",
    title: "The Rule 26(a)(2)(B) expert report: a plain-English completeness checklist",
    dek: "The six things every federal expert report must contain — and the procedural gaps that get reports struck or testimony limited, in plain English.",
    date: "June 2026",
    isoDate: "2026-06-13",
    readMinutes: 8,
    tag: "Rule 26",
  },
  {
    slug: "ai-disclosure-in-expert-reports",
    title: "AI in expert reports: what the 2025–2026 rulings mean for your methodology",
    dek: "A plain-English guide for forensic experts and the lawyers who retain them — what has sunk experts who used AI, what has been fine, and how to stay on the right side of it.",
    date: "June 2026",
    isoDate: "2026-06-09",
    readMinutes: 9,
    tag: "AI disclosure",
  },
];

export function getArticle(slug: string): ArticleMeta | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}
