import type { Metadata } from "next";
import { VOCREHAB_TEMPLATE } from "@/lib/domain/template";
import { IntakeFlow, type DraftableSection } from "./IntakeFlow";

export const metadata: Metadata = {
  title: "Try the evidence-to-section workflow",
  description:
    "Paste fictional or de-identified material. The tool segments it into citable evidence items you confirm, then structures one Rule 26(a)(2)(B) section cited entirely to what you supplied. Nothing is saved to an account.",
};

// The page handles user-supplied text in its client UI, so middleware gives it
// the strict per-request nonce CSP rather than the static marketing-page policy.
export const dynamic = "force-dynamic";

// Only evidence-requiring sections can be structured from pasted evidence;
// profile sections (qualifications/compensation) come from the expert profile.
const DRAFTABLE: DraftableSection[] = VOCREHAB_TEMPLATE.sections
  .filter((s) => s.requiresEvidence)
  .map((s) => ({ key: s.key, title: s.title }));

export default function IntakePage() {
  return <IntakeFlow sections={DRAFTABLE} />;
}
