import { z } from "zod";
import { normalizeStyle } from "@/lib/export/style";

const savedReportResponseSchema = z.object({
  reportId:z.string().uuid(),
  profileSource:z.enum(["saved_snapshot","legacy_current_profile"]),
  input: z.object({
    meta: z.object({
      matter: z.string(),
      retainingCounsel: z.string(),
      expertRole: z.string(),
    }),
    profile: z.object({
      fullName: z.string(),
      credentials: z.string(),
      compensationStatement: z.string(),
      priorTestimonyLast4yr: z.array(z.string()),
    }),
    evidence: z.array(z.object({
      id: z.string(),
      content: z.string(),
      location: z.string(),
    })),
    sections: z.array(z.object({
      key: z.string(),
      evidenceIds: z.array(z.string()),
      finalText: z.string().optional(),
    })),
    style: z.object({
      font: z.enum(["default", "times", "sans", "century"]).optional(),
      fontSizePt: z.union([z.literal(11), z.literal(12)]).optional(),
      lineSpacing: z.enum(["single", "onehalf", "double"]).optional(),
      headingNumbering: z.enum(["decimal", "roman", "none"]).optional(),
      includeCoverPage: z.boolean().optional(),
      footerText: z.string().optional(),
      reportDate: z.string().optional(),
      includeDisclosure: z.boolean().optional(),
      includeMapping: z.boolean().optional(),
      includeReadiness: z.boolean().optional(),
      lineNumbers: z.boolean().optional(),
      coverLogo: z.string().optional(),
    }).optional().nullable(),
  }),
  integrity: z.object({ verified: z.boolean(), reportBound:z.boolean() }),
});

export function materializeSavedReport(
  value: unknown,
  defaultSectionKey: string,
  expectedReportId: string,
) {
  const parsed = savedReportResponseSchema.safeParse(value);
  if (!parsed.success || parsed.data.reportId !== expectedReportId) {
    throw new Error(
      "The saved report response was incomplete. Your current workspace was not changed. Please try again.",
    );
  }

  const { input, integrity } = parsed.data;
  const sectionByEvidence = new Map<string, string>();
  const edits: Record<string, string> = {};
  for (const section of input.sections) {
    for (const evidenceId of section.evidenceIds) {
      sectionByEvidence.set(evidenceId, section.key);
    }
    if (section.finalText?.trim()) edits[section.key] = section.finalText;
  }

  // Build every derived value before the component commits any React state.
  // If validation or materialization throws, the current workspace is intact.
  return {
    matter: input.meta.matter,
    retainingCounsel: input.meta.retainingCounsel,
    expertRole: input.meta.expertRole,
    fullName: input.profile.fullName,
    credentials: input.profile.credentials,
    compensationStatement: input.profile.compensationStatement,
    priorTestimony: input.profile.priorTestimonyLast4yr.join("\n"),
    edits,
    style: normalizeStyle(input.style),
    units: input.evidence.map((evidence) => ({
      id: evidence.id,
      content: evidence.content,
      location: evidence.location,
      sectionKey: sectionByEvidence.get(evidence.id) ?? defaultSectionKey,
    })),
    integrityVerified: integrity.verified,
    profileSource: parsed.data.profileSource,
    reportBound: integrity.reportBound,
  };
}
