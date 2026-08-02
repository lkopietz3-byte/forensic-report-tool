import { buildSampleReport, getSampleDefinition } from "@/lib/domain/sample";
import { exportReportDocx } from "@/lib/export/docx";
import type { ReportSection } from "@/lib/domain/types";
import { createRateLimiter } from "@/lib/http/rateLimit";
import { clientIp } from "@/lib/http/request";

export const runtime = "nodejs";

// This is a PUBLIC, unauthenticated route linked from the indexed /sample page,
// and every miss runs the full DOCX pipeline. Cap the request rate as a
// speed-bump against a render-flood, on top of the edge caching below.
const rateLimited = createRateLimiter({ limit: 30, windowMs: 60_000 });

// Serves the worked sample report as a real .docx — the same export path a paid
// matter would use — so a prospect or design partner can hold the actual
// deliverable (report + AI-Disclosure Appendix + data→opinion mapping) in Word.
// It is built from fictional sample data and is marked as such inside the file;
// it is not a real expert report and must never be presented as one.
const SAMPLE_NOTICE =
  "SAMPLE — fictional matter, illustrative output only. Not a real expert report and not for filing.";

export async function GET(request: Request) {
  if (rateLimited(clientIp(request))) {
    return new Response("Too many requests. Please try again shortly.", { status: 429 });
  }
  const def = getSampleDefinition(new URL(request.url).searchParams.get("d") ?? undefined);
  const report = buildSampleReport(def);

  const sections: ReportSection[] = report.sections.map((s) => ({
    key: s.key,
    title: s.title,
    draftText: s.draftText,
    citedEvidenceIds: s.grounding.citedEvidenceIds,
    ungroundedFlags: s.grounding.ungroundedSentences,
  }));

  const buf = await exportReportDocx({
    meta: report.meta,
    sections,
    disclosure: report.appendix,
    reconstructions: report.reconstructions,
    readiness: report.readiness,
    exhibits: report.exhibits,
    expert: {
      fullName: report.profile.fullName,
      credentials: report.profile.credentials,
    },
    notice: SAMPLE_NOTICE,
  });

  return new Response(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="Disclosed-${def.kind}-sample.docx"`,
      // Cache the rendered sample at the EDGE (not the browser) so a public flood
      // can't force a render on every hit. The sample only changes on deploy, and
      // Vercel gives each deployment a fresh cache, so design changes still appear
      // immediately after a redeploy. Local dev has no CDN, so it stays live.
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
