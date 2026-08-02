import Link from "next/link";
import type { Metadata } from "next";
import { DISCIPLINES } from "@/lib/waitlist/schema";
import { ExpertInterest } from "../_components/ExpertInterest";

export const metadata: Metadata = {
  title: "For experts: help shape the tool",
  description:
    "We're looking for a few forensic expert witnesses to shape the report-drafting and AI-disclosure tool. Free access, your input drives the template. Tell us about your work. No call required.",
  alternates: { canonical: "/for-experts" },
};

const GET = [
  "Free founding access to the worked and de-identified workflows while the final confidentiality terms are completed.",
  "Direct say over your discipline's template, tuned to the format you actually use.",
  "First-mover standing, and founding-advisor credit if you want it.",
  "The 3–5 hours of report writing back, with your name still on the work.",
];

const ASK = [
  "A few minutes now: the short application below. We read every one.",
  "Later, if it's a fit: a de-identified look at your usual report structure and honest feedback.",
  "Only if you're comfortable: an intro or two to peers who write these well.",
];

function Bullet({ children, tone }: { children: React.ReactNode; tone: "get" | "ask" }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${tone === "get" ? "bg-emerald-500" : "bg-blue-500"}`}
      />
      <span className="text-base leading-relaxed text-slate-700">{children}</span>
    </li>
  );
}

const DISCIPLINE_PATHS = [
  {
    name: "Vocational rehabilitation",
    status: "Founding pilot",
    tone: "live",
    body: "The complete worked workflow is available now for de-identified evaluation, including RAPEL-oriented coverage and earning-capacity sections.",
    sample: "/sample",
    apply: "/for-experts?discipline=vocational_rehabilitation#application",
  },
  {
    name: "Forensic engineering",
    status: "Design-partner preview",
    tone: "preview",
    body: "Review an ASTM E3176-24-informed outline using the real evidence-map and AI-disclosure pipeline, then tell us what an engineer would change.",
    sample: "/sample?d=engineering",
    apply: "/for-experts?discipline=forensic_engineering#application",
  },
  {
    name: "Accident reconstruction",
    status: "Design-partner preview",
    tone: "preview",
    body: "Review a reconstruction sample that exposes measurements, calculation inputs, uncertainty prompts, and independent-method corroboration.",
    sample: "/sample?d=reconstruction",
    apply: "/for-experts?discipline=accident_reconstruction#application",
  },
] as const;

export default async function ForExperts({
  searchParams,
}: {
  searchParams: Promise<{ discipline?: string }>;
}) {
  const { discipline } = await searchParams;
  const initialDiscipline = DISCIPLINES.find((item) => item === discipline);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-slate-50/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-900 text-sm font-bold text-white">
              D
            </span>
            <span className="text-sm font-semibold tracking-tight text-slate-900">
              Disclosed.
            </span>
          </Link>
          <Link
            href="/sample"
            className="text-sm font-medium text-slate-600 no-underline transition hover:text-slate-900"
          >
            See a sample report →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10 sm:py-14">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-800">
          Design partners
        </p>
        <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Help shape the report tool you actually want
        </h1>
        <p className="mt-4 max-w-2xl text-pretty text-lg leading-relaxed text-slate-700">
          We&apos;re building a tool that takes the report-writing grind off
          forensic experts without taking your name off the work. It structures
          your own findings, requires source markers for factual sentences, and
          keeps a record of how AI was used. You verify that each source actually
          supports the text. Before we build more of the wrong thing, we want to
          hear from people who actually write these reports.
        </p>

        <div className="reveal mt-8 grid gap-8 sm:mt-10 sm:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">What you get</h2>
            <ul className="mt-4 space-y-3">
              {GET.map((g) => (
                <Bullet key={g} tone="get">
                  {g}
                </Bullet>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">What we&apos;d ask</h2>
            <ul className="mt-4 space-y-3">
              {ASK.map((a) => (
                <Bullet key={a} tone="ask">
                  {a}
                </Bullet>
              ))}
            </ul>
          </div>
        </div>

        {/* See it first */}
        <div className="lift mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm sm:mt-10">
          <span className="text-sm font-medium text-slate-600">Have a look first:</span>
          <Link href="/sample" className="text-sm font-semibold text-blue-800 no-underline transition hover:text-blue-950">
            A 2-minute sample report →
          </Link>
          <Link href="/intake" className="text-sm font-semibold text-blue-800 no-underline transition hover:text-blue-950">
            Try it on a paragraph →
          </Link>
          <Link
            href="/resources/ai-disclosure-in-expert-reports"
            className="text-sm font-semibold text-blue-800 no-underline transition hover:text-blue-950"
          >
            Where the AI rulings stand →
          </Link>
        </div>

        <section className="mt-10 sm:mt-12">
          <div className="max-w-2xl">
            <h2 className="text-xl font-semibold tracking-tight">
              Start with the version closest to your work
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              One evidence-and-disclosure engine, with discipline modules
              validated one at a time. Only vocational rehabilitation is open as
              a worked pilot today; the other two are concrete previews for
              expert review.
            </p>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {DISCIPLINE_PATHS.map((item) => (
              <article
                key={item.name}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <span
                  className={`self-start rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                    item.tone === "live"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {item.status}
                </span>
                <h3 className="mt-3 text-base font-semibold text-slate-900">
                  {item.name}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                  {item.body}
                </p>
                <div className="mt-4 flex flex-col gap-2 text-sm">
                  <Link
                    href={item.sample}
                    className="font-semibold text-blue-800 no-underline hover:text-blue-950"
                  >
                    Inspect the sample →
                  </Link>
                  <Link
                    href={item.apply}
                    className="font-medium text-slate-600 no-underline hover:text-slate-900"
                  >
                    Apply for this discipline
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* The application form */}
        <section id="application" className="lift mt-10 scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:mt-12 sm:p-8">
          <h2 className="text-xl font-semibold tracking-tight">Apply to be a design partner</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            In writing, no call needed. We&apos;re taking on a small number of
            practicing experts per discipline, and we read every application. The
            slots go to thoughtful answers, not blank forms. If you&apos;re a fit,
            we&apos;ll email you a slot and how to get in. Not a fit yet? You stay
            on the early-access list either way.
          </p>
          <div className="mt-6">
            <ExpertInterest initialDiscipline={initialDiscipline} />
          </div>
        </section>
      </main>
    </div>
  );
}
