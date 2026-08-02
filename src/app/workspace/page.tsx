import Link from "next/link";
import type { Metadata } from "next";
import { VOCREHAB_TEMPLATE } from "@/lib/domain/template";
import { supabaseAuthConfigured } from "@/lib/supabase/config";
import { getCurrentUser } from "@/lib/auth/user";
import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import { getSubscriptionFor } from "@/lib/billing/subscription";
import { deriveTier } from "@/lib/billing/featureGates";
import { isBillingLive, creditsPurchasable } from "@/lib/billing/stripe";
import { getCreditBalance } from "@/lib/billing/credits";
import { ReportBuilder } from "./ReportBuilder";

export const metadata: Metadata = {
  title: "Build your report",
  description:
    "Assemble a full Rule 26(a)(2)(B) report from your own evidence — every sentence cited, with an automatic AI-disclosure record.",
  // The case-data app shouldn't be indexed.
  robots: { index: false, follow: false },
};

// Always evaluate the session at request time. Without this, a build that ran
// without Supabase env could prerender the signed-out shell and serve it stale
// to signed-in users in production.
export const dynamic = "force-dynamic";

// The evidence-backed sections an expert assigns their findings to. Profile
// sections (qualifications / prior testimony / compensation) are filled from the
// expert's own details in the builder, not here.
const EVIDENCE_SECTIONS = VOCREHAB_TEMPLATE.sections
  .filter((s) => s.requiresEvidence)
  .map((s) => ({ key: s.key, title: s.title }));

// Neutral coverage prompts per section, for the private challenge-readiness
// self-check. Pure static data from the template — nothing about it is ever
// persisted or disclosed (see ChallengeChecklist.tsx).
const SECTION_GUIDE = VOCREHAB_TEMPLATE.sections.map((s) => ({
  key: s.key,
  title: s.title,
  rule26Required: s.rule26Required,
  requiresEvidence: Boolean(s.requiresEvidence),
  prompts: (s.coveragePrompts ?? []).map((p) => p.q),
}));

export default async function Workspace({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string; purchased?: string; buy?: string }>;
}) {
  const authConfigured = supabaseAuthConfigured();
  const user = authConfigured ? await getCurrentUser() : null;
  const billingConfigured = isBillingLive();
  const canBuyCredits = creditsPurchasable();

  let isPro = false;
  let credits: number | null = null;
  if (user) {
    const sb = await createSupabaseServerClient();
    if (sb) isPro = deriveTier(await getSubscriptionFor(sb, user.id)) === "pro";
    if (!isPro) credits = await getCreditBalance(user.id);
  }
  const { upgraded, purchased, buy } = await searchParams;
  const autoBuy =
    buy === "single" || buy === "pack5" ? buy : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-slate-50/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-6 py-3">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-900 text-sm font-bold text-white">
              D
            </span>
            <span className="text-sm font-semibold tracking-tight text-slate-900">
              Disclosed.
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/sample"
              className="hidden text-sm font-medium text-slate-600 no-underline transition hover:text-slate-900 sm:inline"
            >
              See a finished sample →
            </Link>
            {user ? (
              <div className="flex items-center gap-2">
                {isPro && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                    Pro
                  </span>
                )}
                <span className="hidden max-w-[12rem] truncate text-xs text-slate-500 sm:inline">
                  {user.email}
                </span>
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            ) : authConfigured ? (
              <Link
                href="/signin"
                className="rounded-lg bg-blue-900 px-3 py-1.5 text-sm font-semibold text-white no-underline transition hover:bg-blue-950"
              >
                Sign in to save
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight">Build your report</h1>
          <p className="mt-3 text-pretty text-slate-600">
            Assign your own findings to their sections, and the tool assembles a full
            Rule 26(a)(2)(B) report — every sentence cited to evidence you supplied,
            with an automatic AI-disclosure record. You review, edit, and sign it.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Forensic vocational-rehabilitation template (draft).{" "}
            {user
              ? "Saved reports live in your account, isolated to you at the database. "
              : "Nothing is saved to an account unless you sign in and choose Save. "}
            The drafting prompt restricts output to supplied material, citation
            IDs must resolve to your evidence, and you verify that each source
            actually supports the sentence.{" "}
            <Link href="/privacy" className="underline decoration-slate-300 underline-offset-2 hover:text-slate-700">
              How we handle data
            </Link>
            {" · "}
            <Link href="/terms" className="underline decoration-slate-300 underline-offset-2 hover:text-slate-700">
              Terms
            </Link>
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950">
          <strong className="font-semibold">Early-access data notice:</strong>{" "}
          load the fictional worked example or use de-identified material only.
          Anthropic&apos;s standard API retention can be up to 30 days when AI is
          enabled; zero-data-retention and counsel-reviewed confidentiality terms
          are not yet in place. Do not add a real matter or protected case file.
        </div>

        <ReportBuilder
          evidenceSections={EVIDENCE_SECTIONS}
          sectionGuide={SECTION_GUIDE}
          canSave={Boolean(user)}
          authConfigured={authConfigured}
          billingConfigured={billingConfigured}
          isPro={isPro}
          credits={credits}
          canBuyCredits={canBuyCredits}
          justUpgraded={upgraded === "1"}
          justPurchased={Number(purchased) || 0}
          autoBuy={autoBuy}
        />
      </main>
    </div>
  );
}
