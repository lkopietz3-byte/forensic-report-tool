// Build a safe, matter-identifying download filename (no extension). An expert
// filing 20 reports a year shouldn't get a folder full of identical
// "Expert-report-draft.docx"; derive a slug from the matter caption instead.
export function reportFilename(matter: string): string {
  const slug = matter
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return slug ? `Expert-report-${slug}` : "Expert-report-draft";
}
