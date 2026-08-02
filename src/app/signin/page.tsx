import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { supabaseAuthConfigured } from "@/lib/supabase/config";
import { getCurrentUser } from "@/lib/auth/user";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to save and revisit your reports.",
  robots: { index: false, follow: false },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const configured = supabaseAuthConfigured();
  if (configured) {
    const user = await getCurrentUser();
    if (user) redirect("/workspace");
  }
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-slate-50/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-900 text-sm font-bold text-white">
              D
            </span>
            <span className="text-sm font-semibold tracking-tight">Disclosed.</span>
          </Link>
          <Link
            href="/workspace"
            className="text-sm font-medium text-slate-600 no-underline transition hover:text-slate-900"
          >
            Back to the builder →
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
        <h1 className="text-2xl font-semibold tracking-tight">Save your work</h1>
        <p className="mt-2 text-sm text-slate-600">
          Sign in to save reports to your account and pick them back up later.
          You can keep building without an account — nothing you&apos;ve entered
          is lost by signing in.
        </p>

        <div className="mt-6">
          {configured ? (
            <SignInForm linkError={error === "link"} />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-sm font-medium text-slate-800">
                Accounts aren&apos;t enabled in this preview.
              </p>
              <p className="mt-2 text-sm text-slate-600">
                This deployment is running without a database, so the builder
                works in session-only mode — your report is assembled in the
                browser and exported on demand, but can&apos;t be saved to an
                account yet.
              </p>
              <Link
                href="/workspace"
                className="mt-4 inline-block rounded-xl bg-blue-900 px-4 py-2 text-sm font-semibold text-white no-underline transition hover:bg-blue-950"
              >
                Continue to the builder
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
